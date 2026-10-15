import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api } from '../services/api';

export default function ImportExportModal({ open, onClose, onImportSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    try {
      const res = await api.importProducts(selectedFile);
      setResult(res);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = api.getExportUrl();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleReset} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Import / Export Product Catalogue
        </Typography>
        <IconButton onClick={handleReset} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {result.message}
            </Typography>
            <Typography variant="caption">
              Added: {result.imported} new items • Updated: {result.updated} existing items
            </Typography>
          </Alert>
        )}

        <Stack spacing={2.5}>
          {/* Download template section */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  ZCMC Catalogue CSV Template
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Includes PhilGEPS, UNSPSC, and uniform naming columns
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadTemplate}
              >
                Download CSV
              </Button>
            </Box>
          </Paper>

          <Divider />

          {/* Upload drop area */}
          <Box
            sx={{
              border: '2px dashed #cbd5e1',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              '&:hover': { borderColor: '#0f766e', backgroundColor: '#f0fdfa' },
            }}
            component="label"
          >
            <input
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <CloudUploadIcon sx={{ fontSize: 40, color: '#0f766e', mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {selectedFile ? selectedFile.name : 'Click to select CSV catalogue file'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
              Accepts .csv files up to 10MB
            </Typography>
          </Box>

          {uploading && <LinearProgress color="primary" />}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc' }}>
        <Button onClick={handleReset} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          startIcon={<CloudUploadIcon />}
        >
          {uploading ? 'Processing Import...' : 'Import to Catalogue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
