import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Building2,
  Sparkles,
  FileText,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Hash,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Combobox } from './ui/combobox';
import CascadingCategorySelect from './CascadingCategorySelect';
import { api } from '../services/api';

const ERP_UNIT_NAMES = [
  'Ampule', 'Account', 'Assembly', 'Bag', 'Bar', 'Bot', 'Bottle', 'Booklet', 'Box', 'Bundle', 'Can', 'Capsule', 'Card',
  'Cart', 'Cartridge', 'Case', 'Cycle', 'Drum', 'Ft2', 'Gallon', 'GBq', 'Jar', 'Kg', 'Kilo', 'Kit', 'Kits', 'Liter', 'Loaf',
  'Lot', 'mCi', 'Meter', 'Month', 'Nebule', 'Pack', 'Pad', 'Pail', 'Pair', 'Pax', 'Pfs', 'Piece',
  'Plate', 'Rack', 'Ream', 'Roll', 'Sachet', 'Sack', 'Seat', 'Set', 'Sheet', 'Spool', 'System', 'Solution',
  'Tablet', 'Tank', 'Test', 'Tin', 'Tray', 'Tube', 'Unit', 'Vial', 'Inhaler', 'MDI', 'Prefilled Syringe', 'Syringe', 'Length', 'Letter', 'Infusion set'
].sort((a, b) => a.localeCompare(b));

export default function ProductModal({
  open = true,
  onClose,
  onSave,
  product = null,
  currentUser = null,
}) {
  const isEdit = Boolean(product && product.id);
  const fileInputRef = useRef(null);

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
  });

  const [unitOptions, setUnitOptions] = useState(ERP_UNIT_NAMES);
  const [internalCategories, setInternalCategories] = useState([]);
  const [loadingInternalCats, setLoadingInternalCats] = useState(false);
  const [generatingErpCode, setGeneratingErpCode] = useState(false);

  // PDF upload state
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');

  // Other specs tag builder
  const [specTags, setSpecTags] = useState([]);
  const [newSpecInput, setNewSpecInput] = useState('');

  // Uniform naming live audit
  const [namingAudit, setNamingAudit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // End-user password confirmation state for editing existing products
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const isAdmin = currentUser?.is_admin === true;

  // Compute standard name from: [Noun], [Type], [Material / Composition], [Key Attributes], [Size]
  const computeStandardName = (data) => {
    const parts = [
      data.noun,
      data.type,
      data.material_composition,
      data.key_attributes,
      data.size,
    ];
    return parts
      .map((p) => (p || '').trim().toUpperCase())
      .filter(Boolean)
      .join(', ');
  };

  // Load internal categories & UOMs on mount
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

    api.getItemUnits()
      .then((res) => {
        if (mounted && Array.isArray(res.data) && res.data.length > 0) {
          setUnitOptions(res.data.map((u) => u.name));
        }
      })
      .catch((err) => {
        console.error('Failed to load item units:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Live naming validation
  const validateNaming = async (text) => {
    if (!text || text.trim().length < 2) {
      setNamingAudit(null);
      return;
    }
    try {
      const result = await api.validateNaming(text);
      setNamingAudit(result);
    } catch (err) {
      console.error('Validation error', err);
    }
  };

  // Initialize form from product prop
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
          product.internal_category?.code || product.internal_category_code || '',
        erp_item_code: product.erp_item_code || '',
        bizbox_item_code: product.bizbox_item_code || '',
        philgeps_code: product.philgeps_code || '',
        unspsc_code: product.unspsc_code || '',
        uom: (() => {
          if (!product.uom) return 'Piece';
          const match = ERP_UNIT_NAMES.find((u) => u.toLowerCase() === product.uom.toLowerCase());
          return match || product.uom;
        })(),
        other_specs: product.other_specs || product.specifications || '',
        tech_specs_pdf_path: product.tech_specs_pdf_path || null,
      };

      if (!initialData.item_description) {
        initialData.item_description = computeStandardName(initialData);
      }

      setFormData(initialData);

      if (product.tech_specs_pdf_url || product.tech_specs_pdf_path) {
        setPdfPreviewUrl(product.tech_specs_pdf_url || '');
        const filename =
          (product.tech_specs_pdf_path || '').split('/').pop() || 'Existing Technical Specs.pdf';
        setPdfFileName(filename);
      } else {
        setPdfPreviewUrl('');
        setPdfFileName('');
      }

      const specsSource = product.other_specs || product.specifications || '';
      if (specsSource) {
        setSpecTags(specsSource.split(';').map((s) => s.trim()).filter(Boolean));
      } else {
        setSpecTags([]);
      }

      if (initialData.item_description) {
        validateNaming(initialData.item_description);
      }
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
      });
      setPdfPreviewUrl('');
      setPdfFileName('');
      setSpecTags([]);
      setNamingAudit(null);
    }
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordError('');
    setErrorMsg('');
  }, [product, open]);

  // Request next available ERP Item Code
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

  // Structured field change handler - strictly uppercase
  const handleStructuredFieldChange = (field, value) => {
    const uppercaseValue = value.toUpperCase();
    setFormData((prev) => {
      const updated = { ...prev, [field]: uppercaseValue };
      const built = computeStandardName(updated);
      updated.item_description = built;
      validateNaming(built);
      return updated;
    });
  };

  // PDF File Upload Handler
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files are accepted for technical specifications.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('PDF file size exceeds 20MB limit.');
      return;
    }

    setPdfUploading(true);
    setErrorMsg('');
    try {
      const res = await api.uploadSpecsPdf(file);
      setFormData((prev) => ({
        ...prev,
        tech_specs_pdf_path: res.file_path,
      }));
      setPdfFileName(res.original_filename || file.name);
      setPdfPreviewUrl(res.file_url);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload technical specifications PDF.');
    } finally {
      setPdfUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePdf = () => {
    setFormData((prev) => ({
      ...prev,
      tech_specs_pdf_path: null,
    }));
    setPdfFileName('');
    setPdfPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        if (!isEdit && updated.internal_category_code) {
          updateNextErpCode(
            newCatCode,
            updated.internal_category_code,
            updated.internal_category_id,
            newCatKey
          );
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

    if (!formData.noun.trim()) {
      setErrorMsg('Noun is required to construct the standard item name.');
      return;
    }

    const builtName = computeStandardName(formData);
    if (!builtName.trim()) {
      setErrorMsg('Item description cannot be empty. Please fill in the standard naming fields.');
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

    if (isEdit && !isAdmin) {
      if (!confirmPassword.trim()) {
        setPasswordError('Password confirmation is required to save changes to this product.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        noun: formData.noun.trim().toUpperCase(),
        type: formData.type ? formData.type.trim().toUpperCase() : null,
        material_composition: formData.material_composition
          ? formData.material_composition.trim().toUpperCase()
          : null,
        key_attributes: formData.key_attributes ? formData.key_attributes.trim().toUpperCase() : null,
        size: formData.size ? formData.size.trim().toUpperCase() : null,
        item_description: builtName,
        bizbox_item_code: formData.bizbox_item_code.trim(),
        philgeps_code: formData.philgeps_code.trim(),
        other_specs: specTags.length > 0 ? specTags.join('; ') : null,
        tech_specs_pdf_path: formData.tech_specs_pdf_path || null,
      };

      if (isEdit && !isAdmin) {
        payload.confirm_password = confirmPassword;
      }

      await onSave(payload, isEdit ? product.id : null);
    } catch (err) {
      if (err.errors?.confirm_password) {
        setPasswordError(err.errors.confirm_password[0]);
      } else {
        setErrorMsg(err.message || 'Failed to save product catalogue item.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const selectedInternalCat =
    internalCategories.find((c) => c.id === formData.internal_category_id) || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Catalogue</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {isEdit ? 'Edit Catalogue Product' : 'Register New SSOT Product'}
              </h1>
              {isEdit && formData.erp_item_code && (
                <Badge variant="blue" className="font-mono text-xs">
                  {formData.erp_item_code}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Hospital Uniform Naming &amp; Structured UNSPSC Classification Builder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save to Catalogue'}</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Two-Column In-Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Structured Form Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Standard Naming Specification Builder */}
          <Card>
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    1. Standard Naming Specification Builder
                  </CardTitle>
                  <CardDescription>
                    All inputs automatically convert to uppercase. Assembles into: [NOUN], [TYPE], [MATERIAL], [ATTRIBUTES], [SIZE]
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Noun */}
              <div className="space-y-1.5">
                <Label htmlFor="noun">
                  Noun (Primary Item Name) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="noun"
                  required
                  placeholder="e.g. BLEACH, DETERGENT, PAPER"
                  value={formData.noun}
                  onChange={(e) => handleStructuredFieldChange('noun', e.target.value)}
                  className="uppercase font-medium"
                />
                <p className="text-[11px] text-slate-400">Core item noun (Required)</p>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  placeholder="e.g. LIQUID, POWDER, BOND"
                  value={formData.type}
                  onChange={(e) => handleStructuredFieldChange('type', e.target.value)}
                  className="uppercase"
                />
                <p className="text-[11px] text-slate-400">Sub-classification or form</p>
              </div>

              {/* Material / Composition */}
              <div className="space-y-1.5">
                <Label htmlFor="material">Material / Composition</Label>
                <Input
                  id="material"
                  placeholder="e.g. SODIUM HYPOCHLORITE 5.25%, NYLON"
                  value={formData.material_composition}
                  onChange={(e) =>
                    handleStructuredFieldChange('material_composition', e.target.value)
                  }
                  className="uppercase"
                />
                <p className="text-[11px] text-slate-400">Active ingredient or material</p>
              </div>

              {/* Key Attributes */}
              <div className="space-y-1.5">
                <Label htmlFor="attributes">Key Attributes</Label>
                <Input
                  id="attributes"
                  placeholder="e.g. MULTICOPY, 70 GSM, 0.5 MM"
                  value={formData.key_attributes}
                  onChange={(e) => handleStructuredFieldChange('key_attributes', e.target.value)}
                  className="uppercase"
                />
                <p className="text-[11px] text-slate-400">Properties, color, mechanism</p>
              </div>

              {/* Size */}
              <div className="space-y-1.5">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  placeholder="e.g. A4, LONG, 6 X 9 IN, LARGE"
                  value={formData.size}
                  onChange={(e) => handleStructuredFieldChange('size', e.target.value)}
                  className="uppercase"
                />
                <p className="text-[11px] text-slate-400">Physical dimensions or size</p>
              </div>

              {/* Unit of Measure */}
              <div className="space-y-1.5">
                <Label>
                  Unit of Measure (UOM) <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.uom}
                  onValueChange={(val) => setFormData({ ...formData, uom: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((uom) => (
                      <SelectItem key={uom} value={uom}>
                        {uom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">Standard hospital inventory unit</p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Taxonomy & Institutional Classification */}
          <Card>
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    2. Taxonomy &amp; Institutional Classification
                  </CardTitle>
                  <CardDescription>
                    Assign UNSPSC commodity hierarchy and ZCMC internal category to auto-generate the ERP item code
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <CascadingCategorySelect
                selectedKey={formData.category_key}
                onSelectCategory={handleCategorySelect}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Internal Institutional Category */}
                <div className="space-y-1.5">
                  <Label>
                    Internal Institutional Category <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={internalCategories}
                    value={selectedInternalCat}
                    onChange={handleInternalCategorySelect}
                    getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
                    getOptionKey={(opt) => opt.id}
                    isOptionEqual={(a, b) => a?.id === b?.id}
                    loading={loadingInternalCats}
                    icon={Building2}
                    placeholder="Select ZCMC Internal Category..."
                    searchPlaceholder="Search ZCMC internal category..."
                    renderOption={(opt) => (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-medium text-slate-900">{opt.name}</span>
                        <Badge variant="blue" className="font-mono text-[10px]">
                          {opt.code}
                        </Badge>
                      </div>
                    )}
                  />
                  <p className="text-[11px] text-slate-400">
                    Institution classification for ZCMC procurement
                  </p>
                </div>

                {/* Auto-generated ERP Item Code */}
                <div className="space-y-1.5">
                  <Label>ERP Item Code (System Generated)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-blue-600" />
                    <Input
                      readOnly
                      value={
                        generatingErpCode
                          ? 'Generating...'
                          : formData.erp_item_code || 'Select UNSPSC & Internal Category'
                      }
                      className="pl-9 bg-slate-50 font-mono font-semibold text-blue-700"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Format: [UNSPSC]-[Internal Code]-[Seq]
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Cross-System Reference Codes & Technical Documents */}
          <Card>
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    3. System Codes, Specifications &amp; Datasheet
                  </CardTitle>
                  <CardDescription>
                    Cross-reference codes for BizBox and PhilGEPS, plus optional technical specifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BizBox Item Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="bizbox">
                    BizBox Item Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bizbox"
                    required
                    placeholder="e.g. BZ-MED-001"
                    value={formData.bizbox_item_code}
                    onChange={(e) =>
                      setFormData({ ...formData, bizbox_item_code: e.target.value })
                    }
                    className="font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Required BizBox hospital system item code
                  </p>
                </div>

                {/* PhilGEPS Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="philgeps">
                      PhilGEPS Code <span className="text-red-500">*</span>
                    </Label>
                    <a
                      href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                    >
                      <span>PS-PhilGEPS Directory</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Input
                    id="philgeps"
                    required
                    placeholder="e.g. 14111507-PP-M01"
                    value={formData.philgeps_code}
                    onChange={(e) =>
                      setFormData({ ...formData, philgeps_code: e.target.value })
                    }
                    className="font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Official PhilGEPS common-use or item reference code
                  </p>
                </div>
              </div>

              {/* PDF Technical Specification Upload */}
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Technical Specification Document (PDF)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload manufacturer brochure, technical datasheet, or standard specification PDF (Max 20MB).
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                  {formData.tech_specs_pdf_path ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={pdfPreviewUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="max-w-[180px] truncate">
                          {pdfFileName || 'Tech_Specs.pdf'}
                        </span>
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemovePdf}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        title="Remove PDF"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="blueOutline"
                      size="sm"
                      disabled={pdfUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {pdfUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{pdfUploading ? 'Uploading PDF...' : 'Upload PDF Document'}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Optional Specifications Tag Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label>Other Specifications (Optional tags)</Label>
                <p className="text-xs text-slate-500">
                  Add supplementary specifications or certifications (e.g. Sterile, Heavy Duty, ISO Certified).
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type an optional specification and press Enter or Add..."
                    value={newSpecInput}
                    onChange={(e) => setNewSpecInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpec();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddSpec}>
                    <Plus className="h-4 w-4" />
                    <span>Add Spec</span>
                  </Button>
                </div>

                {specTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {specTags.map((spec, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1.5 pr-1 py-1">
                        <span>{spec}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(idx)}
                          className="rounded-full p-0.5 hover:bg-slate-200 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Non-Admin Password Confirmation Card (when editing) */}
          {isEdit && !isAdmin && (
            <Card className="border-amber-300 bg-amber-50/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-bold">Security Verification Required</h4>
                </div>
                <p className="text-xs text-amber-800">
                  As an institutional end user, please enter your account password to authorize modifications to this catalogue product.
                </p>
                <div className="space-y-1.5 max-w-md">
                  <Label htmlFor="confirmEditPassword" className="text-amber-900">
                    Confirm Account Password to Save *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmEditPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your current login password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className="bg-white pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs font-semibold text-red-600">{passwordError}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 4 Columns: Sticky Live Preview & Compliance Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <Card className="border-blue-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3.5 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Live Standard Name Preview
              </span>
              <Badge className="bg-white/20 text-white border-white/20 text-[10px]">
                Auto-Assembled
              </Badge>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="rounded-lg border-2 border-blue-600/80 bg-slate-50 p-3.5 min-h-[72px] flex items-center">
                <p
                  className={`font-mono text-sm font-bold leading-relaxed break-words ${
                    formData.item_description ? 'text-slate-900' : 'text-slate-400 font-normal'
                  }`}
                >
                  {formData.item_description ||
                    'Type Noun, Type, Material, etc. to preview assembled SSOT description...'}
                </p>
              </div>

              {/* Live Compliance Audit */}
              {namingAudit && (
                <div
                  className={`rounded-lg border p-3.5 space-y-2 ${
                    namingAudit.is_valid
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-amber-200 bg-amber-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {namingAudit.is_valid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                      <span
                        className={`text-xs font-bold ${
                          namingAudit.is_valid ? 'text-emerald-900' : 'text-amber-900'
                        }`}
                      >
                        {namingAudit.is_valid ? 'Standard Compliant' : 'Improvement Recommended'}
                      </span>
                    </div>
                    <Badge variant={namingAudit.is_valid ? 'success' : 'warning'}>
                      Score: {namingAudit.score}%
                    </Badge>
                  </div>

                  {namingAudit.feedback?.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                      {namingAudit.feedback.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Summary Metadata */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ERP Item Code:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {generatingErpCode
                      ? 'Generating...'
                      : formData.erp_item_code || 'Pending classification'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Unit of Measure:</span>
                  <Badge variant="outline" className="font-mono uppercase text-[10px]">
                    {formData.uom}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">UNSPSC Code:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {formData.unspsc_code || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Internal Category:</span>
                  <span className="font-medium text-slate-800">
                    {selectedInternalCat ? selectedInternalCat.code : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">BizBox Code:</span>
                  <span className="font-mono text-slate-800">
                    {formData.bizbox_item_code || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">PhilGEPS Code:</span>
                  <span className="font-mono text-slate-800">
                    {formData.philgeps_code || '—'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save to Catalogue'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel &amp; Return
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
