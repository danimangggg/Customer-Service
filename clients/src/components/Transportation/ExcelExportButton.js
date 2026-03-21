import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';

/**
 * columns: array of { field, headerName }
 * rows: array of data objects
 * fileName: string without extension
 */
const ExcelExportButton = ({ columns, rows, fileName = 'export' }) => {
  const handleExport = () => {
    const headers = columns
      .filter(c => c.field !== 'actions')
      .map(c => c.headerName || c.field);

    const data = rows.map(row =>
      columns
        .filter(c => c.field !== 'actions')
        .map(c => {
          const val = row[c.field];
          if (val === null || val === undefined) return '';
          if (val instanceof Date) return val.toLocaleString();
          return val;
        })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  return (
    <Button
      size="small"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      sx={{ textTransform: 'none', fontWeight: 600, color: '#166534', borderColor: '#16a34a', border: '1px solid' }}
    >
      Export Excel
    </Button>
  );
};

export default ExcelExportButton;
