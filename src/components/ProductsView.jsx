import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
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
  Grid,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

const ERP_UNIT_NAMES = [
  'Ampule', 'Account', 'Assembly', 'Bag', 'Bar', 'Bot', 'Bottle', 'Booklet', 'Box', 'Bundle', 'Can', 'Capsule', 'Card',
  'Cart', 'Cartridge', 'Case', 'Cycle', 'Drum', 'Ft2', 'Gallon', 'GBq', 'Jar', 'Kg', 'Kilo', 'Kit', 'Kits', 'Liter', 'Loaf',
  'Lot', 'mCi', 'Meter', 'Month', 'Nebule', 'Pack', 'Pad', 'Pail', 'Pair', 'Pax', 'Pfs', 'Piece',
  'Plate', 'Rack', 'Ream', 'Roll', 'Sachet', 'Sack', 'Seat', 'Set', 'Sheet', 'Spool', 'System', 'Solution', 
  'Tablet', 'Tank', 'Test', 'Tin', 'Tray', 'Tube', 'Unit', 'Vial', 'Inhaler', 'MDI', 'Prefilled Syringe', 'Syringe', 'Length', 'Letter', 'Infusion set'
].sort((a, b) => a.localeCompare(b));

export default function ProductsView({
  products,
  loading,
  pagination,
  filters,
  currentUser = null,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onRowsPerPageChange,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenNewProduct,
}) {
  const isAdmin = currentUser?.is_admin === true;
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  const [copiedId, setCopiedId] = useState(null);

  // UOM filter options
  const [unitFilterOptions, setUnitFilterOptions] = useState(['all', ...ERP_UNIT_NAMES]);

  // Internal Categories options
  const [internalCategories, setInternalCategories] = useState([]);
  const [loadingInternalCats, setLoadingInternalCats] = useState(false);

  // UNSPSC Categories (Commodities) search & options
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [loadingCommodities, setLoadingCommodities] = useState(false);
  const debounceTimer = useRef(null);

  // Load UOMs, Internal Categories, and initial Commodities on mount
  useEffect(() => {
    let mounted = true;

    // Load UOMs
    api.getItemUnits()
      .then((res) => {
        if (mounted && Array.isArray(res.data) && res.data.length > 0) {
          setUnitFilterOptions(['all', ...res.data.map((u) => u.name)]);
        }
      })
      .catch((err) => console.error('Failed to load item units filter:', err));

    // Load Internal Categories
    setLoadingInternalCats(true);
    api.getInternalCategories()
      .then((res) => {
        if (mounted && Array.isArray(res.data)) {
          setInternalCategories(res.data);
        }
      })
      .catch((err) => console.error('Failed to load internal categories filter:', err))
      .finally(() => {
        if (mounted) setLoadingInternalCats(false);
      });

    // Load Initial Commodities
    setLoadingCommodities(true);
    api.getCommodities('')
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setCommodityOptions(data);
        }
      })
      .catch((err) => console.error('Failed to load initial commodities filter:', err))
      .finally(() => {
        if (mounted) setLoadingCommodities(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Sync selectedCommodity when filters.category_key changes externally
  useEffect(() => {
    if (!filters.category_key) {
      setSelectedCommodity(null);
      return;
    }

    const keyNum = Number(filters.category_key);
    const existing = commodityOptions.find((c) => c.key === keyNum);
    if (existing) {
      setSelectedCommodity(existing);
    } else {
      // Fetch details for this category key
      api.getCategory(filters.category_key)
        .then((cat) => {
          if (cat) {
            setSelectedCommodity(cat);
            setCommodityOptions((prev) => [cat, ...prev.filter((p) => p.key !== cat.key)]);
          }
        })
        .catch((err) => console.error('Failed to resolve category filter key:', err));
    }
  }, [filters.category_key]);

  // Debounced search for UNSPSC Commodities
  const handleCommoditySearch = (input) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setLoadingCommodities(true);
        const data = await api.getCommodities(input.trim());
        setCommodityOptions(data || []);
      } catch (err) {
        console.error('Failed searching commodities:', err);
      } finally {
        setLoadingCommodities(false);
      }
    }, 300);
  };

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

  const selectedInternalCat =
    internalCategories.find((c) => String(c.id) === String(filters.internal_category_id)) || null;

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim()) ||
    filters.category_key ||
    filters.internal_category_id ||
    (filters.uom && filters.uom !== 'all')
  );

  const handleClearAll = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onFilterChange('search', '');
      onFilterChange('category_key', '');
      onFilterChange('internal_category_id', '');
      onFilterChange('uom', '');
    }
    setSelectedCommodity(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search & Multi-Filter Card */}
      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1.5}>
            {/* Row 1: Keyword Search Bar */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search catalogue by description, ERP code, BizBox, PhilGEPS, noun, material, specs..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#0f766e' }} />
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

            {/* Row 2: Category, Internal Category, and UOM Filters */}
            <Grid container spacing={1.5} alignItems="center">
              {/* Internal Category Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Autocomplete
                  size="small"
                  options={internalCategories}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={selectedInternalCat}
                  onChange={(e, val) => onFilterChange('internal_category_id', val ? val.id : '')}
                  loading={loadingInternalCats}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Internal Institutional Category"
                      placeholder="All Internal Categories"
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...(params.slotProps?.input || {}),
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <BusinessIcon fontSize="small" sx={{ color: '#0f766e' }} />
                              </InputAdornment>
                              {params.slotProps?.input?.startAdornment}
                            </>
                          ),
                          endAdornment: (
                            <>
                              {loadingInternalCats ? <CircularProgress color="inherit" size={16} /> : null}
                              {params.slotProps?.input?.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={option.code}
                          sx={{
                            ml: 1,
                            fontSize: '0.68rem',
                            height: 20,
                            backgroundColor: '#f1f5f9',
                            fontWeight: 700,
                            color: '#0f766e',
                          }}
                        />
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* UNSPSC Categories Filter (Commodity Search) */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Autocomplete
                  size="small"
                  options={commodityOptions}
                  getOptionLabel={(option) => option.code ? `[${option.code}] ${option.title}` : option.title || ''}
                  value={selectedCommodity}
                  loading={loadingCommodities}
                  onInputChange={(e, value, reason) => {
                    if (reason === 'input') {
                      handleCommoditySearch(value);
                    }
                  }}
                  onChange={(e, val) => {
                    setSelectedCommodity(val);
                    onFilterChange('category_key', val ? val.key : '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="UNSPSC Category Filter"
                      placeholder="Type to search UNSPSC category..."
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...(params.slotProps?.input || {}),
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <AccountTreeIcon fontSize="small" sx={{ color: '#0f766e' }} />
                              </InputAdornment>
                              {params.slotProps?.input?.startAdornment}
                            </>
                          ),
                          endAdornment: (
                            <>
                              {loadingCommodities ? <CircularProgress color="inherit" size={16} /> : null}
                              {params.slotProps?.input?.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.key}>
                      <Box sx={{ py: 0.3, width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          [{option.code}] {option.title}
                        </Typography>
                        {option.ancestors && option.ancestors.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                            {option.ancestors.map((a) => a.title).join(' › ')}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* UOM Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Unit of Measure (UOM)"
                  value={filters.uom || 'all'}
                  onChange={(e) => onFilterChange('uom', e.target.value === 'all' ? '' : e.target.value)}
                >
                  {unitFilterOptions.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u === 'all' ? 'All Units' : u}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Reset Filters Action Button */}
              <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<FilterAltOffIcon />}
                  disabled={!hasActiveFilters}
                  onClick={handleClearAll}
                  sx={{
                    height: 40,
                    borderColor: hasActiveFilters ? '#0f766e' : '#e2e8f0',
                    color: hasActiveFilters ? '#0f766e' : '#94a3b8',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#0d9488',
                      backgroundColor: '#f0fdfa',
                    },
                  }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>

            {/* Active Filters Pill Bar */}
            {hasActiveFilters && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, pt: 1, borderTop: '1px dashed #e2e8f0', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  Active Filters:
                </Typography>

                {filters.search && (
                  <Chip
                    size="small"
                    label={`Keyword: "${filters.search}"`}
                    onDelete={() => onFilterChange('search', '')}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                  />
                )}

                {selectedInternalCat && (
                  <Chip
                    size="small"
                    icon={<BusinessIcon sx={{ fontSize: '13px !important' }} />}
                    label={`Internal: ${selectedInternalCat.name} (${selectedInternalCat.code})`}
                    onDelete={() => onFilterChange('internal_category_id', '')}
                    sx={{ backgroundColor: '#f0fdfa', color: '#0f766e', borderColor: '#99f6e4', fontWeight: 700, fontSize: '0.72rem' }}
                    variant="outlined"
                  />
                )}

                {(selectedCommodity || filters.category_key) && (
                  <Chip
                    size="small"
                    icon={<AccountTreeIcon sx={{ fontSize: '13px !important' }} />}
                    label={
                      selectedCommodity
                        ? `UNSPSC: [${selectedCommodity.code}] ${selectedCommodity.title}`
                        : `UNSPSC Key: ${filters.category_key}`
                    }
                    onDelete={() => {
                      setSelectedCommodity(null);
                      onFilterChange('category_key', '');
                    }}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                  />
                )}

                {filters.uom && filters.uom !== 'all' && (
                  <Chip
                    size="small"
                    label={`UOM: ${filters.uom}`}
                    onDelete={() => onFilterChange('uom', '')}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                  />
                )}

                <Button
                  size="small"
                  onClick={handleClearAll}
                  sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, p: 0.3 }}
                >
                  Clear All
                </Button>
              </Stack>
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
                {/* <TableCell align="right" sx={{ fontWeight: 700, width: '12%' }}>Unit Price (PHP)</TableCell> */}
                <TableCell align="center" sx={{ fontWeight: 700, width: '10%' }}>Actions</TableCell>
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
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                      {hasActiveFilters && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleClearAll}
                        >
                          Reset Filters
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        onClick={onOpenNewProduct}
                      >
                        Add Product
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((row) => {
                  const rawSpecs = row.other_specs || row.specifications || '';
                  const specs = rawSpecs ? rawSpecs.split(';').map((s) => s.trim()).filter(Boolean) : [];
                  const isCompliant = row.item_description === row.item_description?.toUpperCase() && row.item_description?.includes(',');

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
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', alignSelf: 'center' }}>
                                +{specs.length - 3} more
                              </Typography>
                            )}
                          </Stack>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            label={isCompliant ? 'Uniform Naming' : 'Check Standard'}
                            color={isCompliant ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                          {row.tech_specs_pdf_url && (
                            <Chip
                              size="small"
                              icon={<PictureAsPdfIcon sx={{ fontSize: '12px !important' }} />}
                              label="PDF Specs"
                              color="info"
                              variant="outlined"
                              component="a"
                              href={row.tech_specs_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              clickable
                              onClick={(e) => e.stopPropagation()}
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      {/* UNSPSC Hierarchy Path */}
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {row.categoryRelation?.title || row.subcategory || 'Uncategorized'}
                        </Typography>
                        {row.category_group && (
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                            {row.category_group}
                          </Typography>
                        )}
                        {row.category_hierarchy?.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 600, display: 'block', mt: 0.2 }}>
                            Level {row.category_hierarchy.length} Commodity
                          </Typography>
                        )}
                      </TableCell>

                      {/* UOM */}
                      <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                        <Chip
                          size="small"
                          label={row.uom}
                          sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>

                      {/* Unit Price */}
                      {/* <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f766e' }}>
                          ₱{Number(row.unit_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </Typography>
                      </TableCell> */}

                      {/* Actions */}
                      <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => onViewProduct(row)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Product">
                            <IconButton size="small" onClick={() => onEditProduct(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && (
                            <Tooltip title="Delete Product (Admin Only)">
                              <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, product: row })}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
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
          rowsPerPageOptions={[10, 15, 25, 50]}
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
            Are you sure you want to remove <strong>{deleteDialog.product?.item_description}</strong> (
            {deleteDialog.product?.erp_item_code}) from the product catalogue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
