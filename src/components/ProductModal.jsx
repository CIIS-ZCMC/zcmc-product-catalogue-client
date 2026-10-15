import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  IconButton,
  Stack,
  InputAdornment,
  Divider,
  Autocomplete,
  Link,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BusinessIcon from '@mui/icons-material/Business';
import CascadingCategorySelect from './CascadingCategorySelect';
import { api } from '../services/api';

const UOM_OPTIONS = [
  'ream',
  'piece',
  'box',
  'pack',
  'bottle',
  'vial',
  'ampule',
  'tablet',
  'capsule',
  'set',
  'roll',
  'tube',
  'gallon',
  'liter',
  'meter',
  'kilogram',
  'pair',
  'kit',
];

export default function ProductModal({
  open,
  onClose,
  onSave,
  product = null,
}) {
  const isEdit = Boolean(product && product.id);

  // Form state (generic_name, brand, remarks removed as requested)
  const [formData, setFormData] = useState({
    item_description: '',
    category_key: null,
    internal_category_id: null,
    internal_category_code: '',
    erp_item_code: '',
    bizbox_item_code: '',
    philgeps_code: '',
    unspsc_code: '',
    uom: 'piece',
    unit_price: '',
  });

  // Internal categories list from backend
  const [internalCategories, setInternalCategories] = useState([]);
  const [loadingInternalCats, setLoadingInternalCats] = useState(false);
  const [generatingErpCode, setGeneratingErpCode] = useState(false);

  // Specs managed as array for user-friendly semicolon handling
  const [specTags, setSpecTags] = useState([]);
  const [newSpecInput, setNewSpecInput] = useState('');

  // Uniform naming live validation state
  const [namingAudit, setNamingAudit] = useState(null);
  const [validatingNaming, setValidatingNaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load internal categories on mount
  useEffect(() => {
    let mounted = true;
    const fetchInternalCategories = async () => {
      setLoadingInternalCats(true);
      try {
        const res = await api.getInternalCategories();
        if (mounted) {
          setInternalCategories(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load internal categories:', err);
      } finally {
        if (mounted) {
          setLoadingInternalCats(false);
        }
      }
    };

    fetchInternalCategories();
    return () => {
      mounted = false;
    };
  }, []);

  // Form initialization
  useEffect(() => {
    if (product) {
      setFormData({
        item_description: product.item_description || '',
        category_key: product.category_key || null,
        internal_category_id: product.internal_category_id || null,
        internal_category_code:
          product.internal_category_code ||
          (product.internal_category ? product.internal_category.code : ''),
        erp_item_code: product.erp_item_code || '',
        bizbox_item_code: product.bizbox_item_code || '',
        philgeps_code: product.philgeps_code || '',
        unspsc_code: product.unspsc_code || '',
        uom: product.uom || 'piece',
        unit_price: product.unit_price ?? '',
      });

      if (product.specifications) {
        setSpecTags(product.specifications.split(';').map((s) => s.trim()).filter(Boolean));
      } else {
        setSpecTags([]);
      }

      if (product.item_description) {
        validateNaming(product.item_description);
      }
    } else {
      setFormData({
        item_description: '',
        category_key: null,
        internal_category_id: null,
        internal_category_code: '',
        erp_item_code: '',
        bizbox_item_code: '',
        philgeps_code: '',
        unspsc_code: '',
        uom: 'piece',
        unit_price: '',
      });
      setSpecTags([]);
      setNamingAudit(null);
    }
    setErrorMsg('');
  }, [product, open]);

  // Request next available ERP Item Code: [category_code]-[internal category code]-[seq starting at 01]
  const updateNextErpCode = async (catCode, intCode, intId, catKey = null) => {
    if ((!catCode && !catKey) || (!intCode && !intId)) {
      setFormData((prev) => ({ ...prev, erp_item_code: '' }));
      return;
    }

    setGeneratingErpCode(true);
    try {
      const res = await api.getNextErpCode(catCode, intCode, intId, catKey);
      if (res && res.erp_item_code) {
        setFormData((prev) => ({ ...prev, erp_item_code: res.erp_item_code }));
      }
    } catch (err) {
      console.error('Failed to generate next ERP item code:', err);
    } finally {
      setGeneratingErpCode(false);
    }
  };

  // Debounced live naming validation
  const validateNaming = async (text) => {
    if (!text || text.trim().length < 2) {
      setNamingAudit(null);
      return;
    }
    setValidatingNaming(true);
    try {
      const result = await api.validateNaming(text);
      setNamingAudit(result);
    } catch (err) {
      console.error('Validation error', err);
    } finally {
      setValidatingNaming(false);
    }
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, item_description: val }));
    validateNaming(val);
  };

  const handleUppercaseFormat = () => {
    const upper = formData.item_description.toUpperCase();
    setFormData((prev) => ({ ...prev, item_description: upper }));
    validateNaming(upper);
  };

  const handleAddSpec = () => {
    if (newSpecInput.trim()) {
      setSpecTags((prev) => [...prev, newSpecInput.trim()]);
      setNewSpecInput('');
    }
  };

  const handleRemoveSpec = (idx) => {
    setSpecTags((prev) => prev.filter((_, i) => i !== idx));
  };

  // Category (UNSPSC Commodity) selection handler
  const handleCategorySelect = (cat) => {
    if (cat) {
      const newCatKey = cat.key;
      const newCatCode = cat.code;
      setFormData((prev) => {
        const updated = {
          ...prev,
          category_key: newCatKey,
          unspsc_code: newCatCode || prev.unspsc_code,
        };
        // Auto-refresh ERP code if not editing and internal category is already chosen
        if (!isEdit && updated.internal_category_code) {
          updateNextErpCode(newCatCode, updated.internal_category_code, updated.internal_category_id, newCatKey);
        }
        return updated;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        category_key: null,
        unspsc_code: '',
        erp_item_code: isEdit ? prev.erp_item_code : '',
      }));
    }
  };

  // Internal Category selection handler
  const handleInternalCategorySelect = (intCat) => {
    if (intCat) {
      setFormData((prev) => {
        const updated = {
          ...prev,
          internal_category_id: intCat.id,
          internal_category_code: intCat.code,
        };
        // Auto-refresh ERP code if not editing and category code/key is already chosen
        if (!isEdit && (updated.unspsc_code || updated.category_key)) {
          updateNextErpCode(updated.unspsc_code, intCat.code, intCat.id, updated.category_key);
        }
        return updated;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        internal_category_id: null,
        internal_category_code: '',
        erp_item_code: isEdit ? prev.erp_item_code : '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.item_description.trim()) {
      setErrorMsg('Item description is required.');
      return;
    }

    if (!formData.category_key) {
      setErrorMsg('Please select a UNSPSC Commodity category.');
      return;
    }

    if (!formData.internal_category_id) {
      setErrorMsg('Internal Category is required. Please select one from the list.');
      return;
    }

    if (!formData.bizbox_item_code.trim()) {
      setErrorMsg('BizBox Item Code is required.');
      return;
    }

    if (!formData.philgeps_code.trim()) {
      setErrorMsg('PhilGEPS Code is required.');
      return;
    }

    if (!formData.uom) {
      setErrorMsg('Unit of Measure (UOM) is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        item_description: formData.item_description.toUpperCase().trim(),
        bizbox_item_code: formData.bizbox_item_code.trim(),
        philgeps_code: formData.philgeps_code.trim(),
        specifications: specTags.join('; '),
        unit_price: formData.unit_price === '' ? 0 : parseFloat(formData.unit_price),
      };

      await onSave(payload, isEdit ? product.id : null);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product catalogue item.');
    } finally {
      setSaving(false);
    }
  };

  const selectedInternalCat =
    internalCategories.find((c) => c.id === formData.internal_category_id) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {isEdit ? 'Edit Catalogue Product' : 'Add New Product to Catalogue'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Hospital Uniform Naming & Institutional Hierarchy Association
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* Uniform Item Description Section */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Uniform Item Description * (All Uppercase Standard)
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleUppercaseFormat}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Convert to ALL CAPS
                </Button>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                required
                placeholder="e.g. PAPER, MULTICOPY, 80GSM, A4, 500 SHEETS/REAM"
                value={formData.item_description}
                onChange={handleDescriptionChange}
                helperText="Format: [ITEM TYPE], [KEY MODIFIER], [SIZE/PACKAGING] (e.g. GLOVES, EXAMINATION, LATEX, MEDIUM)"
              />

              {/* Real-time Uniform Naming Guidance Box */}
              {namingAudit && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: namingAudit.is_valid ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${namingAudit.is_valid ? '#bbf7d0' : '#fde68a'}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {namingAudit.is_valid ? (
                        <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                      ) : (
                        <WarningAmberIcon sx={{ color: '#d97706', fontSize: 18 }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: namingAudit.is_valid ? '#166534' : '#92400e' }}
                      >
                        Uniform Naming Standard: {namingAudit.is_valid ? 'Compliant' : 'Improvement Recommended'}
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      label={`Score: ${namingAudit.score}%`}
                      color={namingAudit.is_valid ? 'success' : 'warning'}
                      sx={{ fontWeight: 800, height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>

                  {namingAudit.feedback?.length > 0 && (
                    <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.75rem', color: '#475569' }}>
                      {namingAudit.feedback.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </Box>
                  )}

                  {namingAudit.similar_items?.length > 0 && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #cbd5e1' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>
                        Notice: Found existing similar items in catalogue (avoid duplicate naming):
                      </Typography>
                      {namingAudit.similar_items.slice(0, 2).map((item) => (
                        <Typography key={item.id} variant="caption" sx={{ display: 'block', color: '#475569' }}>
                          • [{item.erp_item_code}] {item.item_description} ({item.uom})
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Grid>

            {/* Flexible Category Hierarchy Selection Component (Commodity Only) */}
            <Grid size={12}>
              <Divider sx={{ my: 0.5 }} />
              <CascadingCategorySelect
                selectedKey={formData.category_key}
                onSelectCategory={handleCategorySelect}
              />
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Institutional Internal Category & Identifiers Section */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={internalCategories}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                value={selectedInternalCat}
                onChange={(e, val) => handleInternalCategorySelect(val)}
                loading={loadingInternalCats}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    required
                    label="Internal Institutional Category *"
                    placeholder="Select ZCMC Internal Category..."
                    helperText="Institution classification for ZCMC procurement"
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
                            {loadingInternalCats ? <CircularProgress color="inherit" size={18} /> : null}
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

            {/* ERP Item Code (Auto-generated & Locked) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="ERP Item Code (System Generated)"
                value={
                  generatingErpCode
                    ? 'Generating...'
                    : formData.erp_item_code || 'Auto-generated upon Category & Internal Category selection'
                }
                helperText="Rule: [category_code]-[internal category code]-[seq starting at 01] (Read-only)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" sx={{ color: '#0f766e' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      backgroundColor: '#f8fafc',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: formData.erp_item_code ? '#0f766e' : '#94a3b8',
                    },
                  },
                }}
              />
            </Grid>

            {/* BizBox Item Code (Required User Input) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="BizBox Item Code *"
                placeholder="e.g. BZ-MED-001"
                value={formData.bizbox_item_code}
                onChange={(e) => setFormData({ ...formData, bizbox_item_code: e.target.value })}
                helperText="Required Bizbox hospital system item code"
              />
            </Grid>

            {/* PhilGEPS Code (Required with guidance link) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="PhilGEPS Code *"
                placeholder="e.g. 14111507-PP-M01"
                value={formData.philgeps_code}
                onChange={(e) => setFormData({ ...formData, philgeps_code: e.target.value })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Open PS-PhilGEPS Common-Use Items Directory in new tab">
                          <IconButton
                            size="small"
                            component="a"
                            href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: '#0f766e' }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
                helperText={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                    <span>Find code in:</span>
                    <Link
                      href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontWeight: 700,
                        color: '#0f766e',
                        textDecoration: 'underline',
                        '&:hover': { color: '#0d9488' },
                      }}
                    >
                      PS-PhilGEPS Common-Use Items ↗
                    </Link>
                  </Box>
                }
              />
            </Grid>

            {/* Price & Unit of Measure */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Unit of Measure (UOM) *"
                required
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
              >
                {UOM_OPTIONS.map((uom) => (
                  <MenuItem key={uom} value={uom}>
                    {uom}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Unit Price (PHP ₱)"
                placeholder="0.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  },
                }}
              />
            </Grid>

            {/* Specifications Semicolon Builder */}
            <Grid size={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                Technical Specifications (Separated by semicolon ;)
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a technical specification (e.g. 80gsm, 500 sheets/ream, Sterile) and press Add..."
                  value={newSpecInput}
                  onChange={(e) => setNewSpecInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpec();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddSpec}
                  startIcon={<AddCircleIcon />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Add Spec
                </Button>
              </Stack>

              {specTags.length > 0 && (
                <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.8 }}>
                  {specTags.map((spec, idx) => (
                    <Chip
                      key={idx}
                      label={spec}
                      size="small"
                      onDelete={() => handleRemoveSpec(idx)}
                      sx={{ backgroundColor: '#e2e8f0', color: '#334155' }}
                    />
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add to Catalogue'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
