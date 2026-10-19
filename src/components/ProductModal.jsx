import React, { useState, useEffect, useRef } from 'react'
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
  Paper,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import BusinessIcon from '@mui/icons-material/Business'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CascadingCategorySelect from './CascadingCategorySelect'
import { api } from '../services/api'

const ERP_UNIT_NAMES = [
  'Ampule',
  'Account',
  'Assembly',
  'Bag',
  'Bar',
  'Bot',
  'Bottle',
  'Booklet',
  'Box',
  'Bundle',
  'Can',
  'Capsule',
  'Card',
  'Cart',
  'Cartridge',
  'Case',
  'Cycle',
  'Drum',
  'Ft2',
  'Gallon',
  'GBq',
  'Jar',
  'Kg',
  'Kilo',
  'Kit',
  'Kits',
  'Liter',
  'Loaf',
  'Lot',
  'mCi',
  'Meter',
  'Month',
  'Nebule',
  'Pack',
  'Pad',
  'Pail',
  'Pair',
  'Pax',
  'Pfs',
  'Piece',
  'Plate',
  'Rack',
  'Ream',
  'Roll',
  'Sachet',
  'Sack',
  'Seat',
  'Set',
  'Sheet',
  'Spool',
  'System',
  'Solution',
  'Tablet',
  'Tank',
  'Test',
  'Tin',
  'Tray',
  'Tube',
  'Unit',
  'Vial',
  'Inhaler',
  'MDI',
  'Prefilled Syringe',
  'Syringe',
  'Length',
  'Letter',
  'Infusion set',
].sort((a, b) => a.localeCompare(b))

export default function ProductModal({
  open,
  onClose,
  onSave,
  product = null,
  currentUser = null,
}) {
  const isEdit = Boolean(product && product.id)
  const fileInputRef = useRef(null)

  // Form state
  const [formData, setFormData] = useState({
    noun: '',
    type: '',
    material_composition: '',
    key_attributes: '',
    size: '',
    item_description: '',
    category_key: null,
    internal_category_id: null,
    internal_category_code: '',
    erp_item_code: '',
    bizbox_item_code: '',
    philgeps_code: '',
    unspsc_code: '',
    uom: 'Piece',
    other_specs: '',
    tech_specs_pdf_path: null,
  })

  const [unitOptions, setUnitOptions] = useState(ERP_UNIT_NAMES)
  const [internalCategories, setInternalCategories] = useState([])
  const [loadingInternalCats, setLoadingInternalCats] = useState(false)
  const [generatingErpCode, setGeneratingErpCode] = useState(false)

  // PDF upload state
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfFileName, setPdfFileName] = useState('')
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')

  // Other specs tag builder
  const [specTags, setSpecTags] = useState([])
  const [newSpecInput, setNewSpecInput] = useState('')

  // Uniform naming live audit
  const [namingAudit, setNamingAudit] = useState(null)
  const [_validatingNaming, setValidatingNaming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // End-user password confirmation state for editing existing products
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const isAdmin = currentUser?.is_admin === true

  // Helper to build standard name from: [Noun], [Type], [Material / Composition], [Key Attributes], [Size]
  const computeStandardName = (data) => {
    const parts = [
      data.noun,
      data.type,
      data.material_composition,
      data.key_attributes,
      data.size,
    ]
    return parts
      .map((p) => (p || '').trim().toUpperCase())
      .filter(Boolean)
      .join(', ')
  }

  // Load internal categories on mount
  useEffect(() => {
    let mounted = true
    const fetchInternalCategories = async () => {
      setLoadingInternalCats(true)
      try {
        const res = await api.getInternalCategories()
        if (mounted) {
          setInternalCategories(res.data || [])
        }
      } catch (err) {
        console.error('Failed to load internal categories:', err)
      } finally {
        if (mounted) {
          setLoadingInternalCats(false)
        }
      }
    }

    fetchInternalCategories()

    api
      .getItemUnits()
      .then((res) => {
        if (mounted && Array.isArray(res.data) && res.data.length > 0) {
          setUnitOptions(res.data.map((u) => u.name))
        }
      })
      .catch((err) => {
        console.error('Failed to load item units:', err)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Debounced live naming validation
  const validateNaming = async (text) => {
    if (!text || text.trim().length < 2) {
      setNamingAudit(null)
      return
    }
    setValidatingNaming(true)
    try {
      const result = await api.validateNaming(text)
      setNamingAudit(result)
    } catch (err) {
      console.error('Validation error', err)
    } finally {
      setValidatingNaming(false)
    }
  }

  // Form initialization
  useEffect(() => {
    if (product) {
      const initialData = {
        noun: product.noun || '',
        type: product.type || '',
        material_composition: product.material_composition || '',
        key_attributes: product.key_attributes || '',
        size: product.size || '',
        item_description: product.item_description || '',
        category_key: product.category_key || null,
        internal_category_id: product.internal_category_id || null,
        internal_category_code:
          product.internal_category?.code ||
          product.internal_category_code ||
          '',
        erp_item_code: product.erp_item_code || '',
        bizbox_item_code: product.bizbox_item_code || '',
        philgeps_code: product.philgeps_code || '',
        unspsc_code: product.unspsc_code || '',
        uom: (() => {
          if (!product.uom) return 'Piece'
          const match = ERP_UNIT_NAMES.find(
            (u) => u.toLowerCase() === product.uom.toLowerCase()
          )
          return match || product.uom
        })(),
        other_specs: product.other_specs || product.specifications || '',
        tech_specs_pdf_path: product.tech_specs_pdf_path || null,
      }

      if (!initialData.item_description) {
        initialData.item_description = computeStandardName(initialData)
      }

      setFormData(initialData)

      if (product.tech_specs_pdf_url || product.tech_specs_pdf_path) {
        setPdfPreviewUrl(product.tech_specs_pdf_url || '')
        const filename =
          (product.tech_specs_pdf_path || '').split('/').pop() ||
          'Existing Technical Specs.pdf'
        setPdfFileName(filename)
      } else {
        setPdfPreviewUrl('')
        setPdfFileName('')
      }

      const specsSource = product.other_specs || product.specifications || ''
      if (specsSource) {
        setSpecTags(
          specsSource
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      } else {
        setSpecTags([])
      }

      if (initialData.item_description) {
        validateNaming(initialData.item_description)
      }
      setConfirmPassword('')
      setShowPassword(false)
      setPasswordError('')
    } else {
      setFormData({
        noun: '',
        type: '',
        material_composition: '',
        key_attributes: '',
        size: '',
        item_description: '',
        category_key: null,
        internal_category_id: null,
        internal_category_code: '',
        erp_item_code: '',
        bizbox_item_code: '',
        philgeps_code: '',
        unspsc_code: '',
        uom: 'Piece',
        other_specs: '',
        tech_specs_pdf_path: null,
      })
      setPdfPreviewUrl('')
      setPdfFileName('')
      setSpecTags([])
      setNamingAudit(null)
    }
    setConfirmPassword('')
    setShowPassword(false)
    setPasswordError('')
    setErrorMsg('')
  }, [product, open])

  // Request next available ERP Item Code
  const updateNextErpCode = async (catCode, intCode, intId, catKey = null) => {
    if ((!catCode && !catKey) || (!intCode && !intId)) {
      setFormData((prev) => ({ ...prev, erp_item_code: '' }))
      return
    }

    setGeneratingErpCode(true)
    try {
      const res = await api.getNextErpCode(catCode, intCode, intId, catKey)
      if (res && res.erp_item_code) {
        setFormData((prev) => ({ ...prev, erp_item_code: res.erp_item_code }))
      }
    } catch (err) {
      console.error('Failed to generate next ERP item code:', err)
    } finally {
      setGeneratingErpCode(false)
    }
  }

  // Structured field change handler - strictly uppercase
  const handleStructuredFieldChange = (field, value) => {
    const uppercaseValue = value.toUpperCase()
    setFormData((prev) => {
      const updated = { ...prev, [field]: uppercaseValue }
      const built = computeStandardName(updated)
      updated.item_description = built
      validateNaming(built)
      return updated
    })
  }

  // PDF File Upload Handler
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setErrorMsg('Only PDF files are accepted for technical specifications.')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('PDF file size exceeds 20MB limit.')
      return
    }

    setPdfUploading(true)
    setErrorMsg('')
    try {
      const res = await api.uploadSpecsPdf(file)
      setFormData((prev) => ({
        ...prev,
        tech_specs_pdf_path: res.file_path,
      }))
      setPdfFileName(res.original_filename || file.name)
      setPdfPreviewUrl(res.file_url)
    } catch (err) {
      setErrorMsg(
        err.message || 'Failed to upload technical specifications PDF.'
      )
    } finally {
      setPdfUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePdf = () => {
    setFormData((prev) => ({
      ...prev,
      tech_specs_pdf_path: null,
    }))
    setPdfFileName('')
    setPdfPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddSpec = () => {
    if (newSpecInput.trim()) {
      setSpecTags((prev) => [...prev, newSpecInput.trim()])
      setNewSpecInput('')
    }
  }

  const handleRemoveSpec = (idx) => {
    setSpecTags((prev) => prev.filter((_, i) => i !== idx))
  }

  // Category (UNSPSC Commodity) selection handler
  const handleCategorySelect = (cat) => {
    if (cat) {
      const newCatKey = cat.key
      const newCatCode = cat.code
      setFormData((prev) => {
        const updated = {
          ...prev,
          category_key: newCatKey,
          unspsc_code: newCatCode || prev.unspsc_code,
        }
        if (!isEdit && updated.internal_category_code) {
          updateNextErpCode(
            newCatCode,
            updated.internal_category_code,
            updated.internal_category_id,
            newCatKey
          )
        }
        return updated
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        category_key: null,
        unspsc_code: '',
        erp_item_code: isEdit ? prev.erp_item_code : '',
      }))
    }
  }

  // Internal Category selection handler
  const handleInternalCategorySelect = (intCat) => {
    if (intCat) {
      setFormData((prev) => {
        const updated = {
          ...prev,
          internal_category_id: intCat.id,
          internal_category_code: intCat.code,
        }
        if (!isEdit && (updated.unspsc_code || updated.category_key)) {
          updateNextErpCode(
            updated.unspsc_code,
            intCat.code,
            intCat.id,
            updated.category_key
          )
        }
        return updated
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        internal_category_id: null,
        internal_category_code: '',
        erp_item_code: isEdit ? prev.erp_item_code : '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.noun.trim()) {
      setErrorMsg('Noun is required to construct the standard item name.')
      return
    }

    const builtName = computeStandardName(formData)
    if (!builtName.trim()) {
      setErrorMsg(
        'Item description cannot be empty. Please fill in the standard naming fields.'
      )
      return
    }

    if (!formData.category_key) {
      setErrorMsg('Please select a UNSPSC Commodity category.')
      return
    }

    if (!formData.internal_category_id) {
      setErrorMsg(
        'Internal Category is required. Please select one from the list.'
      )
      return
    }

    if (!formData.bizbox_item_code.trim()) {
      setErrorMsg('BizBox Item Code is required.')
      return
    }

    if (!formData.philgeps_code.trim()) {
      setErrorMsg('PhilGEPS Code is required.')
      return
    }

    if (!formData.uom) {
      setErrorMsg('Unit of Measure (UOM) is required.')
      return
    }

    if (isEdit && !isAdmin) {
      if (!confirmPassword.trim()) {
        setPasswordError(
          'Password confirmation is required to save changes to this product.'
        )
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        noun: formData.noun.trim().toUpperCase(),
        type: formData.type ? formData.type.trim().toUpperCase() : null,
        material_composition: formData.material_composition
          ? formData.material_composition.trim().toUpperCase()
          : null,
        key_attributes: formData.key_attributes
          ? formData.key_attributes.trim().toUpperCase()
          : null,
        size: formData.size ? formData.size.trim().toUpperCase() : null,
        item_description: builtName,
        bizbox_item_code: formData.bizbox_item_code.trim(),
        philgeps_code: formData.philgeps_code.trim(),
        other_specs: specTags.length > 0 ? specTags.join('; ') : null,
        tech_specs_pdf_path: formData.tech_specs_pdf_path || null,
      }

      if (isEdit && !isAdmin) {
        payload.confirm_password = confirmPassword
      }

      await onSave(payload, isEdit ? product.id : null)
      onClose()
    } catch (err) {
      if (err.errors?.confirm_password) {
        setPasswordError(err.errors.confirm_password[0])
      } else {
        setErrorMsg(err.message || 'Failed to save product catalogue item.')
      }
    } finally {
      setSaving(false)
    }
  }

  const selectedInternalCat =
    internalCategories.find((c) => c.id === formData.internal_category_id) ||
    null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
              {isEdit
                ? 'Edit Catalogue Product'
                : 'Add New Product to Catalogue'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Hospital Uniform Naming & Structured Classification Builder
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {errorMsg && (
            <Alert
              severity="error"
              sx={{ mb: 2.5 }}
              onClose={() => setErrorMsg('')}
            >
              {errorMsg}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* Standard Naming Specification Builder Card */}
            <Grid size={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  borderColor: '#cbd5e1',
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  <FormatQuoteIcon sx={{ color: '#2563eb', fontSize: 22 }} />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 800, color: '#0f172a' }}
                    >
                      Standard Naming Specification Builder
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      All inputs automatically capitalize as you type. UOM is
                      paired with specification components.
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  {/* Noun (Required) */}
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Noun (Primary Item Name) *"
                      placeholder="e.g. BLEACH, DETERGENT, PAPER"
                      value={formData.noun}
                      onChange={(e) =>
                        handleStructuredFieldChange('noun', e.target.value)
                      }
                      slotProps={{
                        htmlInput: { style: { textTransform: 'uppercase' } },
                      }}
                      helperText="Core item noun (Required)"
                    />
                  </Grid>

                  {/* Type */}
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Type"
                      placeholder="e.g. LIQUID, POWDER, BOND"
                      value={formData.type}
                      onChange={(e) =>
                        handleStructuredFieldChange('type', e.target.value)
                      }
                      slotProps={{
                        htmlInput: { style: { textTransform: 'uppercase' } },
                      }}
                      helperText="Sub-classification or form"
                    />
                  </Grid>

                  {/* Material / Composition */}
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Material / Composition"
                      placeholder="e.g. SODIUM HYPOCHLORITE 5.25%, NYLON"
                      value={formData.material_composition}
                      onChange={(e) =>
                        handleStructuredFieldChange(
                          'material_composition',
                          e.target.value
                        )
                      }
                      slotProps={{
                        htmlInput: { style: { textTransform: 'uppercase' } },
                      }}
                      helperText="Active ingredient or material"
                    />
                  </Grid>

                  {/* Key Attributes */}
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Key Attributes"
                      placeholder="e.g. MULTICOPY, 70 GSM, 0.5 MM"
                      value={formData.key_attributes}
                      onChange={(e) =>
                        handleStructuredFieldChange(
                          'key_attributes',
                          e.target.value
                        )
                      }
                      slotProps={{
                        htmlInput: { style: { textTransform: 'uppercase' } },
                      }}
                      helperText="Properties, color, mechanism"
                    />
                  </Grid>

                  {/* Size */}
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Size"
                      placeholder="e.g. A4, LONG, 6 X 9 IN, LARGE"
                      value={formData.size}
                      onChange={(e) =>
                        handleStructuredFieldChange('size', e.target.value)
                      }
                      slotProps={{
                        htmlInput: { style: { textTransform: 'uppercase' } },
                      }}
                      helperText="Physical dimensions or size"
                    />
                  </Grid>

                  {/* Unit of Measure (UOM) - Positioned with naming */}
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Unit of Measure (UOM) *"
                      required
                      value={formData.uom}
                      onChange={(e) =>
                        setFormData({ ...formData, uom: e.target.value })
                      }
                      helperText="Standard hospital inventory unit"
                    >
                      {unitOptions.map((uom) => (
                        <MenuItem key={uom} value={uom}>
                          {uom}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                {/* Built Standard Name Live Display */}
                <Box
                  sx={{
                    mt: 2.5,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#ffffff',
                    border: '2px solid #2563eb',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.8,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: '#2563eb',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Standard Name (Built Counterpart):
                    </Typography>
                    <Chip
                      size="small"
                      label="Auto-Assembled Standard"
                      sx={{
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        height: 20,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 800,
                      color: formData.item_description ? '#0f172a' : '#94a3b8',
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {formData.item_description ||
                      'Type Noun, Type, etc. above to see live built name...'}
                  </Typography>

                  {/* Real-time Uniform Naming Guidance Box */}
                  {namingAudit && (
                    <Box
                      sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed #cbd5e1' }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          {namingAudit.is_valid ? (
                            <CheckCircleIcon
                              sx={{ color: '#16a34a', fontSize: 18 }}
                            />
                          ) : (
                            <WarningAmberIcon
                              sx={{ color: '#d97706', fontSize: 18 }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: namingAudit.is_valid
                                ? '#166534'
                                : '#92400e',
                            }}
                          >
                            Naming Compliance:{' '}
                            {namingAudit.is_valid
                              ? 'Standard Compliant'
                              : 'Improvement Recommended'}
                          </Typography>
                        </Stack>
                        <Chip
                          size="small"
                          label={`Score: ${namingAudit.score}%`}
                          color={namingAudit.is_valid ? 'success' : 'warning'}
                          sx={{
                            fontWeight: 800,
                            height: 20,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>

                      {namingAudit.feedback?.length > 0 && (
                        <Box
                          component="ul"
                          sx={{
                            m: 0,
                            pl: 2,
                            fontSize: '0.75rem',
                            color: '#475569',
                          }}
                        >
                          {namingAudit.feedback.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Technical Specifications PDF Upload Box */}
            <Grid size={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PictureAsPdfIcon sx={{ color: '#2563eb', fontSize: 32 }} />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 800, color: '#0f172a' }}
                    >
                      Technical Specification Document (PDF)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Upload manufacturer brochure, technical datasheet, or
                      standard specification PDF (Max 20MB).
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handlePdfUpload}
                  />

                  {formData.tech_specs_pdf_path ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={<PictureAsPdfIcon />}
                        label={pdfFileName || 'Tech_Specs.pdf'}
                        color="success"
                        variant="outlined"
                        component={pdfPreviewUrl ? 'a' : 'div'}
                        href={pdfPreviewUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable={Boolean(pdfPreviewUrl)}
                        sx={{ fontWeight: 700 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={handleRemovePdf}
                        title="Remove PDF"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={
                        pdfUploading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <CloudUploadIcon />
                        )
                      }
                      disabled={pdfUploading}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        borderColor: '#2563eb',
                        color: '#2563eb',
                        fontWeight: 700,
                        '&:hover': {
                          borderColor: '#1d4ed8',
                          backgroundColor: '#dbeafe',
                        },
                      }}
                    >
                      {pdfUploading
                        ? 'Uploading PDF...'
                        : 'Upload PDF Document'}
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* UNSPSC Commodity Category Selection */}
            <Grid size={12}>
              <Divider sx={{ my: 0.5 }} />
              <CascadingCategorySelect
                selectedKey={formData.category_key}
                onSelectCategory={handleCategorySelect}
              />
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Institutional Internal Category */}
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
                              <BusinessIcon
                                fontSize="small"
                                sx={{ color: '#2563eb' }}
                              />
                            </InputAdornment>
                            {params.slotProps?.input?.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {loadingInternalCats ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.slotProps?.input?.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        alignItems: 'center',
                      }}
                    >
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
                          color: '#2563eb',
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
                    : formData.erp_item_code ||
                      'Auto-generated upon Category & Internal Category selection'
                }
                helperText="Rule: [category_code]-[internal category code]-[seq starting at 01] (Read-only)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" sx={{ color: '#2563eb' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      backgroundColor: '#f8fafc',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: formData.erp_item_code ? '#2563eb' : '#94a3b8',
                    },
                  },
                }}
              />
            </Grid>

            {/* BizBox Item Code */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="BizBox Item Code *"
                placeholder="e.g. BZ-MED-001"
                value={formData.bizbox_item_code}
                onChange={(e) =>
                  setFormData({ ...formData, bizbox_item_code: e.target.value })
                }
                helperText="Required Bizbox hospital system item code"
              />
            </Grid>

            {/* PhilGEPS Code */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="PhilGEPS Code *"
                placeholder="e.g. 14111507-PP-M01"
                value={formData.philgeps_code}
                onChange={(e) =>
                  setFormData({ ...formData, philgeps_code: e.target.value })
                }
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
                            sx={{ color: '#2563eb' }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
                helperText={
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.3,
                    }}
                  >
                    <span>Find code in:</span>
                    <Link
                      href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontWeight: 700,
                        color: '#2563eb',
                        textDecoration: 'underline',
                        '&:hover': { color: '#1d4ed8' },
                      }}
                    >
                      PS-PhilGEPS Common-Use Items ↗
                    </Link>
                  </Box>
                }
              />
            </Grid>

            {/* End User Password Authorization Section */}
            {isEdit && !isAdmin && (
              <Grid size={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#fffbeb',
                    borderColor: '#fde68a',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <LockIcon sx={{ color: '#d97706', fontSize: 20 }} />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 800, color: '#92400e' }}
                    >
                      Security Verification Required
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: '#78350f', display: 'block', mb: 1.5 }}
                  >
                    As an institutional end user, please enter your account
                    password to authorize modifications to this catalogue
                    product.
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? 'text' : 'password'}
                    required
                    label="Confirm Account Password to Save *"
                    placeholder="Enter your current login password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setPasswordError('')
                    }}
                    error={Boolean(passwordError)}
                    helperText={
                      passwordError ||
                      'Your password will be verified by the server before committing changes.'
                    }
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Paper>
              </Grid>
            )}

            {/* Other Specifications (other_specs - Optional) */}
            <Grid size={12}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}
              >
                Other Specifications (Optional, separated by semicolon ;)
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#64748b', display: 'block', mb: 1 }}
              >
                Optional tags or notes (e.g. Sterile, Heavy Duty, CE Certified).
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type an optional specification and press Add..."
                  value={newSpecInput}
                  onChange={(e) => setNewSpecInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSpec()
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
                <Stack
                  direction="row"
                  spacing={0.8}
                  flexWrap="wrap"
                  sx={{ gap: 0.8 }}
                >
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

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving
              ? 'Saving...'
              : isEdit
                ? 'Update Product'
                : 'Add to Catalogue'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
