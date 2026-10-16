import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Divider,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { api } from '../services/api';

const ACTION_CONFIG = {
  CREATED: { label: 'Created', color: 'success', icon: <AddCircleIcon fontSize="inherit" /> },
  UPDATED: { label: 'Updated', color: 'info', icon: <EditIcon fontSize="inherit" /> },
  DELETED: { label: 'Deleted', color: 'error', icon: <DeleteIcon fontSize="inherit" /> },
  IMPORTED: { label: 'Imported', color: 'secondary', icon: <CloudUploadIcon fontSize="inherit" /> },
  PDF_UPLOADED: { label: 'PDF Upload', color: 'primary', icon: <PictureAsPdfIcon fontSize="inherit" /> },
};

export default function ActivityLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Change inspection modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
      };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedAction !== 'ALL') {
        params.action = selectedAction;
      }
      const res = await api.getActivityLogs(params);
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Box>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 118, 110, 0.4)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2dd4bf',
              }}
            >
              <HistoryIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                System Audit Trail & Activity Logs
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                Immutable audit logs tracking product creations, modifications, deletions, and document uploads.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`Total Logged Events: ${total}`}
            variant="outlined"
            sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: '#e2e8f0', fontWeight: 700 }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={() => fetchLogs()}
            disabled={loading}
            sx={{
              backgroundColor: '#0f766e',
              '&:hover': { backgroundColor: '#0d9488' },
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, borderColor: '#e2e8f0' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search logs by user, description, or item code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            select
            size="small"
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
            label="Filter Action"
          >
            <MenuItem value="ALL">All Actions</MenuItem>
            <MenuItem value="CREATED">Created</MenuItem>
            <MenuItem value="UPDATED">Updated</MenuItem>
            <MenuItem value="DELETED">Deleted</MenuItem>
            <MenuItem value="IMPORTED">Imported</MenuItem>
            <MenuItem value="PDF_UPLOADED">PDF Uploaded</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {/* Logs Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: '#f8fafc', fontWeight: 700, color: '#334155' } }}>
                <TableCell sx={{ width: '15%' }}>Timestamp</TableCell>
                <TableCell sx={{ width: '12%' }}>Action</TableCell>
                <TableCell sx={{ width: '22%' }}>User / Actor</TableCell>
                <TableCell sx={{ width: '18%' }}>Target Item</TableCell>
                <TableCell sx={{ width: '25%' }}>Description</TableCell>
                <TableCell align="center" sx={{ width: '8%' }}>Changes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: '#0f766e' }} />
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      Loading audit logs...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      No activity logs found.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                      Try clearing search filters or perform catalogue actions to generate logs.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const actionCfg = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    color: 'default',
                    icon: <HistoryIcon fontSize="inherit" />,
                  };
                  const hasDiff = Boolean(log.old_values || log.new_values);

                  return (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        {formatDate(log.created_at)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={actionCfg.icon}
                          label={actionCfg.label}
                          color={actionCfg.color}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.2}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {log.user?.is_admin ? (
                              <AdminPanelSettingsIcon sx={{ fontSize: 14, color: '#0f766e' }} />
                            ) : (
                              <PersonIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>
                              {log.user_name || 'System'}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                            {log.user_email || '—'} {log.ip_address ? `• ${log.ip_address}` : ''}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f766e' }}>
                          {log.entity_identifier || `#${log.entity_id || '—'}`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                          {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.78rem', color: '#334155' }}>
                        {log.description}
                      </TableCell>

                      <TableCell align="center">
                        {hasDiff ? (
                          <Tooltip title="View change details">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedLog(log)}
                              sx={{
                                color: '#0f766e',
                                backgroundColor: '#f0fdfa',
                                '&:hover': { backgroundColor: '#ccfbf1' },
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 15, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>

      {/* Change Inspection Modal */}
      {selectedLog && (
        <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CompareArrowsIcon sx={{ color: '#0f766e' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Audit Change Details &bull; Log #{selectedLog.id}
              </Typography>
            </Stack>
            <IconButton onClick={() => setSelectedLog(null)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2.5 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {selectedLog.description}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Executed by <strong>{selectedLog.user_name}</strong> ({selectedLog.user_email}) on {formatDate(selectedLog.created_at)}
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '25%' }}>Attribute</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '37.5%', color: '#dc2626' }}>Before (Old Value)</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '37.5%', color: '#16a34a' }}>After (New Value)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const oldVal = selectedLog.old_values || {};
                    const newVal = selectedLog.new_values || {};
                    const keys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]));

                    if (keys.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#94a3b8' }}>
                            No structured attribute diff available for this event.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return keys.map((key) => {
                      const vOld = oldVal[key] !== undefined && oldVal[key] !== null ? String(oldVal[key]) : '—';
                      const vNew = newVal[key] !== undefined && newVal[key] !== null ? String(newVal[key]) : '—';

                      return (
                        <TableRow key={key}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', backgroundColor: '#fef2f2', color: '#991b1b', wordBreak: 'break-word' }}>
                            {vOld}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', backgroundColor: '#f0fdf4', color: '#166534', wordBreak: 'break-word', fontWeight: 600 }}>
                            {vNew}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 1.5 }}>
            <Button onClick={() => setSelectedLog(null)} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
