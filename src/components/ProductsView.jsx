import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Stack,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const UOM_FILTER_OPTIONS = ['all', 'ream', 'piece', 'box', 'pack', 'bottle', 'vial', 'ampule', 'tablet', 'capsule', 'set'];

export default function ProductsView({
  products,
  loading,
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onRowsPerPageChange,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenNewProduct,
}) {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (deleteDialog.product) {
      await onDeleteProduct(deleteDialog.product.id);
      setDeleteDialog({ open: false, product: null });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search & Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Search by description, ERP code, Bizbox, PhilGEPS, UNSPSC, category..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', md: 320 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => onFilterChange('search', '')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />

            <TextField
              select
              size="small"
              label="Unit of Measure"
              value={filters.uom || 'all'}
              onChange={(e) => onFilterChange('uom', e.target.value === 'all' ? '' : e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {UOM_FILTER_OPTIONS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u === 'all' ? 'All Units' : u}
                </MenuItem>
              ))}
            </TextField>

            {filters.category_key && (
              <Chip
                label={`Category Filter Active (Key: ${filters.category_key})`}
                color="primary"
                onDelete={() => onFilterChange('category_key', '')}
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Products Table Card */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {loading && <LinearProgress color="primary" />}
        <TableContainer sx={{ width: '100%' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '22%' }}>Item Code / References</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '32%' }}>Standard Item Description</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '26%' }}>Category Hierarchy (UNSPSC)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: '8%' }}>UOM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: '12%' }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: '10%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 600 }}>
                      No catalogue products found matching criteria.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                      Try adjusting your search filters or add a new standardized product.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mt: 2 }}
                      onClick={onOpenNewProduct}
                    >
                      Add First Product
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((row) => {
                  const specs = row.specifications ? row.specifications.split(';').map(s => s.trim()).filter(Boolean) : [];
                  const isCompliant = row.item_description === row.item_description.toUpperCase() && row.item_description.includes(',');

                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Item Codes */}
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f766e', fontFamily: 'monospace' }}>
                              {row.erp_item_code}
                            </Typography>
                            <Tooltip title={copiedId === row.id ? 'Copied!' : 'Copy Code'}>
                              <IconButton size="small" onClick={() => handleCopyCode(row.erp_item_code, row.id)} sx={{ p: 0.2 }}>
                                <ContentCopyIcon sx={{ fontSize: 13, color: copiedId === row.id ? '#0f766e' : '#94a3b8' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          {(row.internal_category?.code || row.internal_category_code) && (
                            <Chip
                              size="small"
                              label={`ZCMC: ${row.internal_category?.code || row.internal_category_code}`}
                              title={row.internal_category?.name || 'ZCMC Category'}
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                backgroundColor: '#f0fdfa',
                                color: '#0f766e',
                                fontWeight: 800,
                                border: '1px solid #99f6e4',
                                alignSelf: 'flex-start',
                              }}
                            />
                          )}
                          {row.bizbox_item_code && (
                            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                              <strong>Bizbox:</strong> {row.bizbox_item_code}
                            </Typography>
                          )}
                          {row.philgeps_code && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                <strong>PhilGEPS:</strong> {row.philgeps_code}
                              </Typography>
                              <Tooltip title="View PS-PhilGEPS portal">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ p: 0.1, color: '#0f766e' }}
                                >
                                  <OpenInNewIcon sx={{ fontSize: 11 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                          {row.unspsc_code && (
                            <Typography variant="caption" sx={{ color: '#0284c7', display: 'block', fontWeight: 600 }}>
                              <strong>UNSPSC:</strong> {row.unspsc_code}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Standard Description */}
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                          {row.item_description}
                        </Typography>

                        {/* Specs preview chips */}
                        {specs.length > 0 && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mt: 0.8 }}>
                            {specs.slice(0, 3).map((s, idx) => (
                              <Chip key={idx} label={s} size="small" sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#f1f5f9' }} />
                            ))}
                            {specs.length > 3 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', alignSelf: 'center' }}>
                                +{specs.length - 3} more
                              </Typography>
                            )}
                          </Stack>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
                          <Chip
                            size="small"
                            label={isCompliant ? 'Uniform Naming' : 'Check Standard'}
                            color={isCompliant ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />

                        </Box>
                      </TableCell>

                      {/* Category Hierarchy Breadcrumbs */}
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        {row.category_relation ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {row.subcategory || row.category_relation.title}
                            </Typography>
                            {row.category_group && (
                              <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 600, display: 'block' }}>
                                Group: {row.category_group}
                              </Typography>
                            )}
                            {row.full_category_path && (
                              <Tooltip title={row.full_category_path} arrow>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#64748b',
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 320,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {row.full_category_path}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>

                      {/* UOM */}
                      <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                        <Chip
                          label={row.uom}
                          size="small"
                          sx={{ backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 600, textTransform: 'lowercase' }}
                        />
                      </TableCell>

                      {/* Unit Price */}
                      <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f766e' }}>
                          ₱{Number(row.unit_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => onViewProduct(row)} sx={{ color: '#0f766e' }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Product">
                            <IconButton size="small" onClick={() => onEditProduct(row)} sx={{ color: '#0284c7' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setDeleteDialog({ open: true, product: row })} sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 15, 25, 50, 100]}
          component="div"
          count={pagination.total || 0}
          rowsPerPage={pagination.perPage || 15}
          page={(pagination.currentPage || 1) - 1}
          onPageChange={(e, newPage) => onPageChange(newPage + 1)}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, product: null })}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{' '}
            <strong>{deleteDialog.product?.item_description}</strong> ({deleteDialog.product?.erp_item_code}) from the catalogue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
