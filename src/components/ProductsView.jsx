import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Building2,
  FolderTree,
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertTriangle,
  PackageSearch,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from './ui/alert-dialog';
import { Combobox } from './ui/combobox';
import { api } from '../services/api';

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

    api.getItemUnits()
      .then((res) => {
        if (mounted && Array.isArray(res.data) && res.data.length > 0) {
          setUnitFilterOptions(['all', ...res.data.map((u) => u.name)]);
        }
      })
      .catch((err) => console.error('Failed to load item units filter:', err));

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

  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / (pagination.perPage || 15)));
  const currentPage = pagination.currentPage || 1;
  const startRow = pagination.total === 0 ? 0 : (currentPage - 1) * (pagination.perPage || 15) + 1;
  const endRow = Math.min(pagination.total || 0, currentPage * (pagination.perPage || 15));

  return (
    <div className="space-y-4">
      {/* Multi-Faceted Search & Filter Command Card */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          {/* Row 1: Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-600" />
            <Input
              placeholder="Search SSOT catalogue by description, ERP code, BizBox, PhilGEPS, noun, material, specs..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-9 pr-9 h-10 bg-slate-50/50 focus:bg-white"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange('search', '')}
                className="absolute right-2.5 top-2.5 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                title="Clear keyword"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Row 2: Faceted Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Internal Institutional Category */}
            <div className="lg:col-span-4 space-y-1">
              <Label className="text-[11px] text-slate-500">
                Internal Institutional Category
              </Label>
              <Combobox
                options={internalCategories}
                value={selectedInternalCat}
                onChange={(val) => onFilterChange('internal_category_id', val ? val.id : '')}
                getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
                getOptionKey={(opt) => opt.id}
                isOptionEqual={(a, b) => String(a?.id) === String(b?.id)}
                loading={loadingInternalCats}
                icon={Building2}
                placeholder="All Internal Categories"
                searchPlaceholder="Filter ZCMC internal category..."
                renderOption={(opt) => (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-medium text-slate-800 truncate">{opt.name}</span>
                    <Badge variant="blue" className="font-mono text-[10px] shrink-0">
                      {opt.code}
                    </Badge>
                  </div>
                )}
              />
            </div>

            {/* UNSPSC Commodity Category */}
            <div className="lg:col-span-4 space-y-1">
              <Label className="text-[11px] text-slate-500">
                UNSPSC Commodity Classification
              </Label>
              <Combobox
                options={commodityOptions}
                value={selectedCommodity}
                onChange={(val) => {
                  setSelectedCommodity(val);
                  onFilterChange('category_key', val ? val.key : '');
                }}
                onSearchChange={handleCommoditySearch}
                getOptionLabel={(opt) => (opt.code ? `[${opt.code}] ${opt.title}` : opt.title || '')}
                getOptionKey={(opt) => opt.key}
                isOptionEqual={(a, b) => Number(a?.key) === Number(b?.key)}
                loading={loadingCommodities}
                icon={FolderTree}
                placeholder="All UNSPSC Categories"
                searchPlaceholder="Type commodity name or 8-digit code..."
                renderOption={(opt) => (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{opt.title}</span>
                      {opt.code && (
                        <span className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {opt.code}
                        </span>
                      )}
                    </div>
                    {opt.ancestors && opt.ancestors.length > 0 && (
                      <p className="text-[11px] text-slate-500 truncate">
                        {opt.ancestors.map((a) => a.title).join(' › ')}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Unit of Measure (UOM) */}
            <div className="lg:col-span-2.5 space-y-1 sm:col-span-1 lg:col-span-3">
              <Label className="text-[11px] text-slate-500">
                Unit of Measure (UOM)
              </Label>
              <Select
                value={filters.uom || 'all'}
                onValueChange={(val) => onFilterChange('uom', val === 'all' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  {unitFilterOptions.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u === 'all' ? 'All Units' : u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <div className="lg:col-span-1">
              <Button
                variant={hasActiveFilters ? 'blueOutline' : 'outline'}
                onClick={handleClearAll}
                disabled={!hasActiveFilters}
                className="w-full h-9"
                title="Reset all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="lg:sr-only xl:not-sr-only">Reset</span>
              </Button>
            </div>
          </div>

          {/* Active Filters Pill Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-dashed border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">
                Active Filters:
              </span>

              {filters.search && (
                <Badge variant="blue" className="gap-1.5 pr-1">
                  <span>Keyword: &ldquo;{filters.search}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => onFilterChange('search', '')}
                    className="rounded-full p-0.5 hover:bg-blue-200/60 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {selectedInternalCat && (
                <Badge variant="blue" className="gap-1.5 pr-1">
                  <Building2 className="h-3 w-3" />
                  <span>
                    Internal: {selectedInternalCat.name} ({selectedInternalCat.code})
                  </span>
                  <button
                    type="button"
                    onClick={() => onFilterChange('internal_category_id', '')}
                    className="rounded-full p-0.5 hover:bg-blue-200/60 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {(selectedCommodity || filters.category_key) && (
                <Badge variant="blue" className="gap-1.5 pr-1">
                  <FolderTree className="h-3 w-3" />
                  <span>
                    {selectedCommodity
                      ? `UNSPSC: [${selectedCommodity.code}] ${selectedCommodity.title}`
                      : `UNSPSC Key: ${filters.category_key}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCommodity(null);
                      onFilterChange('category_key', '');
                    }}
                    className="rounded-full p-0.5 hover:bg-blue-200/60 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.uom && filters.uom !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 pr-1">
                  <span>UOM: {filters.uom}</span>
                  <button
                    type="button"
                    onClick={() => onFilterChange('uom', '')}
                    className="rounded-full p-0.5 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                className="ml-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main SSOT Data Table Card */}
      <Card className="overflow-hidden">
        {loading && (
          <div className="h-1 w-full bg-blue-100 overflow-hidden">
            <div className="h-full w-1/3 bg-blue-600 animate-pulse rounded-r" />
          </div>
        )}

        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[23%]">Item Code / References</TableHead>
              <TableHead className="w-[35%]">Standard Item Description</TableHead>
              <TableHead className="w-[24%]">Category Hierarchy (UNSPSC)</TableHead>
              <TableHead className="w-[8%] text-center">UOM</TableHead>
              <TableHead className="w-[10%] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <PackageSearch className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      No catalogue products found matching criteria
                    </h3>
                    <p className="text-xs text-slate-500">
                      Try adjusting your search filters or register a new standardized product in the SSOT library.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={handleClearAll}>
                          Reset Filters
                        </Button>
                      )}
                      <Button size="sm" onClick={onOpenNewProduct}>
                        <Plus className="h-3.5 w-3.5" />
                        Add Product
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((row) => {
                const rawSpecs = row.other_specs || row.specifications || '';
                const specs = rawSpecs
                  ? rawSpecs.split(';').map((s) => s.trim()).filter(Boolean)
                  : [];
                const isCompliant =
                  row.item_description === row.item_description?.toUpperCase() &&
                  row.item_description?.includes(',');

                return (
                  <TableRow
                    key={row.id}
                    className="align-top group cursor-pointer"
                    onClick={() => onViewProduct(row)}
                  >
                    {/* Column 1: Item Codes & System References */}
                    <TableCell className="align-top">
                      <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50/80 border border-blue-200/70 px-2 py-0.5 rounded">
                            {row.erp_item_code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(row.erp_item_code, row.id)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                            title={copiedId === row.id ? 'Copied!' : 'Copy ERP Code'}
                          >
                            {copiedId === row.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {(row.internal_category?.code || row.internal_category_code) && (
                          <div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 font-semibold"
                              title={row.internal_category?.name || 'ZCMC Category'}
                            >
                              ZCMC: {row.internal_category?.code || row.internal_category_code}
                            </Badge>
                          </div>
                        )}

                        <div className="space-y-0.5 text-[11px] text-slate-500">
                          {row.bizbox_item_code && (
                            <div className="truncate">
                              <span className="font-medium text-slate-600">BizBox:</span>{' '}
                              <span className="font-mono">{row.bizbox_item_code}</span>
                            </div>
                          )}
                          {row.philgeps_code && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-slate-600">PhilGEPS:</span>
                              <span className="font-mono">{row.philgeps_code}</span>
                              <a
                                href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                                title="Open PS-PhilGEPS portal"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          {row.unspsc_code && (
                            <div>
                              <span className="font-medium text-slate-600">UNSPSC:</span>{' '}
                              <span className="font-mono text-blue-600 font-semibold">
                                {row.unspsc_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 2: Standard Item Description & Specs */}
                    <TableCell className="align-top">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          {row.item_description}
                        </p>

                        {specs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {specs.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                              >
                                {s}
                              </span>
                            ))}
                            {specs.length > 3 && (
                              <span className="text-[11px] text-slate-400 self-center">
                                +{specs.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <Badge
                            variant={isCompliant ? 'success' : 'warning'}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {isCompliant ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {isCompliant ? 'Uniform Naming' : 'Check Standard'}
                          </Badge>

                          {row.tech_specs_pdf_url && (
                            <a
                              href={row.tech_specs_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <FileText className="h-3 w-3" />
                              PDF Specs
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 3: UNSPSC Hierarchy */}
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                          {row.categoryRelation?.title || row.subcategory || 'Uncategorized'}
                        </p>
                        {row.category_group && (
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {row.category_group}
                          </p>
                        )}
                        {row.category_hierarchy?.length > 0 && (
                          <span className="inline-block text-[11px] font-medium text-blue-600">
                            Level {row.category_hierarchy.length} Commodity
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 4: UOM */}
                    <TableCell className="align-top text-center">
                      <Badge variant="outline" className="uppercase font-mono text-[11px] bg-slate-50">
                        {row.uom}
                      </Badge>
                    </TableCell>

                    {/* Column 5: Actions */}
                    <TableCell className="align-top text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewProduct(row)}
                          title="Inspect Product Details"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditProduct(row)}
                          title="Edit Product"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, product: row })}
                            title="Delete Product (Admin Only)"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Table Footer Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(pagination.perPage || 15)}
              onValueChange={(val) => onRowsPerPageChange(parseInt(val, 10))}
            >
              <SelectTrigger className="h-8 w-[72px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 25, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-slate-400 ml-2">
              Showing <strong className="text-slate-800">{startRow}</strong>–
              <strong className="text-slate-800">{endRow}</strong> of{' '}
              <strong className="text-slate-800">{pagination.total || 0}</strong> items
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-2 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(1)}
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, product: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product from Catalogue?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">
                {deleteDialog.product?.item_description}
              </strong>{' '}
              (<span className="font-mono text-blue-600">{deleteDialog.product?.erp_item_code}</span>) from the SSOT product catalogue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
