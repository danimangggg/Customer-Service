const db = require('../../models');
const XLSX = require('xlsx');

// Tables to skip — none, back up everything
const SKIP_TABLES = new Set([]);

const getAllBackupTables = async () => {
  const dbName = process.env.DB_NAME || 'customer-service';
  const rows = await db.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
    { replacements: [dbName], type: db.sequelize.QueryTypes.SELECT }
  );
  return rows.map(r => r.TABLE_NAME).filter(t => !SKIP_TABLES.has(t));
};

// Branch filter per table — only applied when branchCode is set
const getBranchWhere = (table, branchCode) => {
  if (!branchCode) return '';
  const map = {
    customer_queue:       `EXISTS (SELECT 1 FROM facilities f WHERE f.id = cq.facility_id AND f.branch_code = '${branchCode}')`,
    employees:            `branch_code = '${branchCode}'`,
    stores:               `branch_code = '${branchCode}'`,
    routes:               `branch_code = '${branchCode}'`,
    facilities:           `branch_code = '${branchCode}'`,
    Users:                `branch_code = '${branchCode}'`,
  };
  // Tables linked to customer_queue via process_id
  const cqLinked = ['odns_rdf','exit_history','service_time','customer_availability','gate_keeper_sessions'];
  if (cqLinked.includes(table)) {
    return `process_id IN (SELECT cq2.id FROM customer_queue cq2 LEFT JOIN facilities f2 ON f2.id = cq2.facility_id WHERE f2.branch_code = '${branchCode}')`;
  }
  // Tables linked to processes via process_id (HP)
  const hpLinked = ['service_time_hp','odns','picklist','pi_vehicle_requests'];
  if (hpLinked.includes(table)) {
    return `process_id IN (SELECT p.id FROM processes p WHERE p.branch_code = '${branchCode}')`;
  }
  return map[table] || '';
};

const getDataForBackup = async (branchCode) => {
  const tables = await getAllBackupTables();
  const result = {};
  for (const table of tables) {
    try {
      const where = getBranchWhere(table, branchCode);
      const alias = table === 'customer_queue' ? '`customer_queue` cq' : `\`${table}\``;
      const sql = `SELECT * FROM ${alias}${where ? ` WHERE ${where}` : ''}`;
      result[table] = await db.sequelize.query(sql, { type: db.sequelize.QueryTypes.SELECT });
    } catch (e) {
      result[table] = [];
    }
  }
  return result;
};

const getBackupSummary = async (req, res) => {
  try {
    const accountType = req.headers['x-account-type'] || null;
    if (accountType !== 'Super Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const tables = await getAllBackupTables();
    const summary = {};

    for (const table of tables) {
      try {
        const alias = table === 'customer_queue' ? '`customer_queue` cq' : `\`${table}\``;
        const [rows] = await db.sequelize.query(`SELECT COUNT(*) as n FROM ${alias}`);
        summary[table] = rows[0].n;
      } catch { summary[table] = 0; }
    }
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get summary', details: error.message });
  }
};

const downloadBackup = async (req, res) => {
  try {
    const accountType = req.headers['x-account-type'] || null;
    if (accountType !== 'Super Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const format = (req.query.format || 'sql').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const data = await getDataForBackup(null);

    if (format === 'json') {
      const backup = {
        exported_at: new Date().toISOString(),
        branch_code: branch,
        summary: Object.fromEntries(Object.entries(data).map(([k,v]) => [k, v.length])),
        data
      };
      res.setHeader('Content-Disposition', `attachment; filename="backup_full_${date}.json"`);
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify(backup, null, 2));
    }

    if (format === 'csv') {
      const toCSV = (rows) => {
        if (!rows.length) return '';
        const headers = Object.keys(rows[0]);
        const lines = [headers.join(',')];
        rows.forEach(row => {
          lines.push(headers.map(h => {
            const val = row[h] == null ? '' : String(row[h]).replace(/"/g, '""');
            return `"${val}"`;
          }).join(','));
        });
        return lines.join('\n');
      };
      const csv = Object.entries(data).map(([name, rows]) => `=== ${name} ===\n${toCSV(rows)}`).join('\n\n');
      res.setHeader('Content-Disposition', `attachment; filename="backup_full_${date}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      Object.entries(data).forEach(([name, rows]) => {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{}]), name.substring(0, 31));
      });
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', `attachment; filename="backup_full_${date}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buf);
    }

    if (format === 'sql') {
      const toSQL = (tableName, rows) => {
        if (!rows.length) return `-- No data for ${tableName}\n`;
        const cols = Object.keys(rows[0]);
        const colList = cols.map(c => `\`${c}\``).join(', ');
        const updateList = cols.filter(c => c !== 'id').map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
        const lines = [`-- Table: ${tableName}`];
        rows.forEach(row => {
          const vals = Object.values(row).map(v => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`).join(', ');
          lines.push(`INSERT INTO \`${tableName}\` (${colList}) VALUES (${vals}) ON DUPLICATE KEY UPDATE ${updateList};`);
        });
        return lines.join('\n') + '\n';
      };
      const sql = [
        `-- Backup exported: ${new Date().toISOString()}`, `-- Branch: ${branch}`, '',
        ...Object.entries(data).map(([name, rows]) => toSQL(name, rows))
      ].join('\n');
      res.setHeader('Content-Disposition', `attachment; filename="backup_full_${date}.sql"`);
      res.setHeader('Content-Type', 'application/sql');
      return res.send(sql);
    }

    res.status(400).json({ error: 'Invalid format. Use: json, csv, excel, sql' });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Backup failed', details: error.message });
  }
};

const restoreBackup = async (req, res) => {
  try {
    const accountType = req.headers['x-account-type'] || null;
    if (accountType !== 'Super Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { format, data, sql } = req.body;

    if (format === 'sql') {
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: 'SQL content is required' });
      }
      // Split by semicolon, filter empty lines and comments, run each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        await db.sequelize.query(stmt);
      }
      return res.json({ success: true, message: `Restored ${statements.length} SQL statements` });
    }

    if (format === 'json') {
      if (!data) return res.status(400).json({ error: 'JSON data is required' });

      const upsert = async (table, rows, pkField = 'id') => {
        if (!rows || !rows.length) return 0;
        const cols = Object.keys(rows[0]);
        const colList = cols.map(c => `\`${c}\``).join(', ');
        const updateList = cols.filter(c => c !== pkField).map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
        for (const row of rows) {
          const vals = cols.map(c => row[c] == null ? null : row[c]);
          const placeholders = cols.map(() => '?').join(', ');
          await db.sequelize.query(
            `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateList}`,
            { replacements: vals }
          );
        }
        return rows.length;
      };

      const tableMap = {
        processes_rdf: 'customer_queue', odns_rdf: 'odns_rdf',
        exit_history: 'exit_history', service_time: 'service_time',
        processes_hp: 'processes', odns_hp: 'odns',
        service_time_hp: 'service_time_hp', picklist: 'picklist',
        pi_vehicle_requests: 'pi_vehicle_requests', route_assignments: 'route_assignments',
        invoices: 'invoices', gate_keeper_sessions: 'gate_keeper_sessions',
        customer_availability: 'customer_availability',
        customer_queue: 'customer_queue', processes: 'processes', odns: 'odns',
        service_times: 'service_time',
      };

      const restored = {};
      for (const [key, rows] of Object.entries(data)) {
        const tableName = tableMap[key];
        if (!tableName || !Array.isArray(rows) || !rows.length) continue;
        restored[key] = await upsert(tableName, rows);
      }

      return res.json({ success: true, message: 'Restore completed', restored });
    }

    res.status(400).json({ error: 'Restore only supports json or sql format' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Restore failed', details: error.message });
  }
};

module.exports = { downloadBackup, getBackupSummary, restoreBackup };
