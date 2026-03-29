import { useState, useEffect, useRef } from 'react';
import api from '../../axiosInstance';
import {
  Box, Card, CardContent, Typography, Button, CircularProgress,
  Alert, Stack, Divider, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';


const BackupManager = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [format] = useState('sql');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Restore state
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    api.get(`${API_URL}/api/backup/summary`)
      .then(res => { if (res.data.success) setSummary(res.data.summary); })
      .catch(() => setError('Failed to load backup summary'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      setSuccess(null);
      const res = await api.get(`${API_URL}/api/backup/download`, { params: { format }, responseType: 'blob' });
      const extMap = { json: 'json', csv: 'csv', excel: 'xlsx', sql: 'sql' };
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${new Date().toISOString().split('T')[0]}.${extMap[format]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Backup downloaded successfully');
    } catch {
      setError('Backup download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'sql') {
      setError('Only SQL backup files can be restored');
      e.target.value = '';
      return;
    }
    setRestoreFile(file);
    setError(null);
  };

  const handleRestoreClick = () => {
    if (!restoreFile) return;
    setConfirmOpen(true);
  };

  const handleRestoreConfirm = async () => {
    setConfirmOpen(false);
    setRestoring(true);
    setError(null);
    setSuccess(null);
    try {
      const text = await restoreFile.text();
      const res = await api.post(`${API_URL}/api/backup/restore`, { format: 'sql', sql: text });
      if (res.data.success) setSuccess(res.data.message);

      setRestoreFile(null);
      fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Restore failed. Check the file and try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1100 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <BackupIcon sx={{ fontSize: 36, color: '#c62828' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Data Backup & Restore</Typography>
          <Typography variant="body2" color="text.secondary">Download or restore process data</Typography>
        </Box>
      </Stack>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Summary */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Records in database</Typography>
          <Divider sx={{ my: 1 }} />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={28} /></Box>
      ) : summary ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 1 }}>
              {Object.entries(summary).map(([label, value]) => (
                <Stack key={label} direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ bgcolor: '#f8f9fa', px: 1.5, py: 0.75, borderRadius: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mr: 1 }}>{label}</Typography>
                  <Chip label={value} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.75rem', height: 22, flexShrink: 0 }} />
                </Stack>
              ))}
            </Box>
          ) : null}
        </CardContent>
      </Card>

      {/* Download section */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Download Backup</Typography>
      <Button
        variant="contained" size="large"
        startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
        onClick={handleDownload}
        disabled={downloading || loading}
        sx={{ background: 'linear-gradient(45deg, #c62828, #e53935)', px: 4 }}
      >
        {downloading ? 'Preparing...' : 'Download SQL Backup'}
      </Button>

      <Divider sx={{ my: 4 }} />

      {/* Restore section */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>Restore from Backup</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Only SQL backup files (.sql) are supported for restore.
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".sql"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current.click()}
          disabled={restoring}
        >
          Choose SQL File {restoreFile && '✓'}
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={restoring ? <CircularProgress size={18} color="inherit" /> : <RestoreIcon />}
          onClick={handleRestoreClick}
          disabled={!restoreFile || restoring}
        >
          {restoring ? 'Restoring...' : 'Restore'}
        </Button>
      </Stack>

      {restoring && <LinearProgress sx={{ mt: 2 }} color="warning" />}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Confirm Restore
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You are about to restore from <strong>{restoreFile?.name}</strong>.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Existing records with matching IDs will be overwritten. This cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Make sure you have a current backup before restoring.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleRestoreConfirm}>
            Yes, Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupManager;
