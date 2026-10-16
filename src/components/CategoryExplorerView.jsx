import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { cn } from '../lib/utils';
import { api } from '../services/api';

export default function CategoryExplorerView({ onFilterProductsByCategory }) {
  const [navPath, setNavPath] = useState([]);
  const [currentChildren, setCurrentChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeProducts, setNodeProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [modalState, setModalState] = useState({ open: false, isEdit: false, data: null });
  const [formFields, setFormFields] = useState({ title: '', code: '', parent_key: null });
  const [savingCategory, setSavingCategory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    loadRoots();
  }, []);

  const loadRoots = async () => {
    setLoading(true);
    try {
      const roots = await api.getRootCategories();
      setCurrentChildren(roots);
      setNavPath([]);
      if (roots.length > 0 && !selectedNode) {
        selectNode(roots[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrilldown = async (category) => {
    setLoading(true);
    try {
      const children = await api.getCategoryChildren(category.key);
      setNavPath((prev) => [...prev, category]);
      setCurrentChildren(children);
      selectNode(category);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToBreadcrumb = async (index) => {
    if (index === -1) {
      loadRoots();
      return;
    }
    const target = navPath[index];
    const newPath = navPath.slice(0, index + 1);
    setLoading(true);
    try {
      const children = await api.getCategoryChildren(target.key);
      setNavPath(newPath);
      setCurrentChildren(children);
      selectNode(target);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectNode = async (cat) => {
    setSelectedNode(cat);
    setLoadingProducts(true);
    try {
      const res = await api.getProducts({ category_key: cat.key, per_page: 10 });
      setNodeProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenAdd = () => {
    setFormFields({
      title: '',
      code: '',
      parent_key: selectedNode ? selectedNode.key : null,
    });
    setModalState({ open: true, isEdit: false, data: null });
    setErrorMsg('');
  };

  const handleOpenEdit = () => {
    if (!selectedNode) return;
    setFormFields({
      title: selectedNode.title || '',
      code: selectedNode.code || '',
      parent_key: selectedNode.parent_key || null,
    });
    setModalState({ open: true, isEdit: true, data: selectedNode });
    setErrorMsg('');
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formFields.title.trim()) {
      setErrorMsg('Category title is required.');
      return;
    }

    setSavingCategory(true);
    setErrorMsg('');
    try {
      if (modalState.isEdit) {
        await api.updateCategory(modalState.data.key, formFields);
        setActionSuccess('Category updated successfully.');
      } else {
        await api.createCategory(formFields);
        setActionSuccess('Subcategory added successfully.');
      }
      setModalState({ open: false, isEdit: false, data: null });
      if (navPath.length > 0) {
        const last = navPath[navPath.length - 1];
        const refreshed = await api.getCategoryChildren(last.key);
        setCurrentChildren(refreshed);
      } else {
        loadRoots();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error saving category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedNode) return;
    const msg = `Are you sure you want to delete category "${selectedNode.title}"?`;
    if (!window.confirm(msg)) return;

    try {
      await api.deleteCategory(selectedNode.key);
      setActionSuccess('Category deleted successfully.');
      if (navPath.length > 0) {
        const last = navPath[navPath.length - 1];
        const refreshed = await api.getCategoryChildren(last.key);
        setCurrentChildren(refreshed);
        setSelectedNode(last);
      } else {
        loadRoots();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="space-y-4">
      {actionSuccess && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <AlertDescription>{actionSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Breadcrumb Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
        <button
          type="button"
          onClick={() => handleNavigateToBreadcrumb(-1)}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <FolderTree className="h-3.5 w-3.5" />
          <span>All Segments (Root)</span>
        </button>

        {navPath.map((item, idx) => (
          <React.Fragment key={item.key}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => handleNavigateToBreadcrumb(idx)}
              className={cn(
                'rounded-md px-2 py-1 text-xs transition-colors cursor-pointer',
                idx === navPath.length - 1
                  ? 'font-bold text-slate-900 bg-slate-100'
                  : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {item.code ? `[${item.code}] ` : ''}
              {item.title}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Split Pane Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Categories List */}
        <Card className="lg:col-span-6 flex flex-col min-h-[540px] overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 bg-slate-50/80 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {navPath.length === 0
                  ? 'Top-Level UNSPSC Segments'
                  : `Subcategories of ${navPath[navPath.length - 1].title}`}
              </h3>
              <p className="text-xs text-slate-500">
                {currentChildren.length} categories available
              </p>
            </div>
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" />
              <span>Add Category</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[580px] divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span>Loading taxonomy nodes...</span>
              </div>
            ) : currentChildren.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No child categories found in this branch. This is a terminal commodity level.
              </div>
            ) : (
              currentChildren.map((child) => {
                const isSelected = selectedNode && selectedNode.key === child.key;
                return (
                  <div
                    key={child.key}
                    onClick={() => selectNode(child)}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 text-blue-600">
                        {child.children_count > 0 ? (
                          <Folder className="h-4 w-4" />
                        ) : (
                          <FolderOpen className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-xs leading-snug',
                            isSelected ? 'font-bold text-blue-950' : 'font-medium text-slate-800'
                          )}
                        >
                          {child.code && (
                            <span className="font-mono text-blue-600 mr-1.5">[{child.code}]</span>
                          )}
                          {child.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Key: {child.key} • {child.children_count || 0} sub-branches
                        </p>
                      </div>
                    </div>

                    {child.children_count > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDrilldown(child);
                        }}
                        title="Drill down into subcategories"
                      >
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Pane: Selected Category Node Inspector */}
        <Card className="lg:col-span-6 flex flex-col min-h-[540px] overflow-hidden">
          {selectedNode ? (
            <>
              <div className="p-5 bg-blue-50/50 border-b border-blue-100 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge variant="default" className="text-[10px]">
                      Level {selectedNode.level || navPath.length}
                    </Badge>
                    <h3 className="text-base font-bold text-slate-900 leading-snug pt-1">
                      {selectedNode.title}
                    </h3>
                    <p className="font-mono text-xs text-blue-600 font-semibold">
                      Code: {selectedNode.code || 'N/A'} • Key: {selectedNode.key}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenEdit}
                      title="Edit Category"
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteCategory}
                      title="Delete Category"
                      className="hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {selectedNode.children_count > 0 && (
                  <Button
                    variant="blueOutline"
                    size="sm"
                    onClick={() => handleDrilldown(selectedNode)}
                  >
                    <span>Browse {selectedNode.children_count} Subcategories</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <CardContent className="p-5 space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span>Products under this category ({nodeProducts.length})</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onFilterProductsByCategory(selectedNode.key)}
                    className="h-auto p-0 text-xs"
                  >
                    <span>View All in Catalogue</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {loadingProducts ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                ) : nodeProducts.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-center text-xs text-slate-400">
                    No catalogue products directly assigned to this category node yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {nodeProducts.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-slate-200 p-3 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {p.erp_item_code}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            {p.uom}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 mt-1">
                          {p.item_description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a category from the left panel to inspect details and associated products.
            </div>
          )}
        </Card>
      </div>

      {/* Add / Edit Category Modal */}
      <Dialog
        open={modalState.open}
        onOpenChange={(open) => !open && setModalState({ open: false, isEdit: false, data: null })}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {modalState.isEdit ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>

            {errorMsg && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="catTitle">Category Title *</Label>
                <Input
                  id="catTitle"
                  required
                  placeholder="e.g. Surgical Instruments, Printing Paper..."
                  value={formFields.title}
                  onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catCode">UNSPSC Code</Label>
                <Input
                  id="catCode"
                  placeholder="e.g. 14111500"
                  value={formFields.code}
                  onChange={(e) => setFormFields({ ...formFields, code: e.target.value })}
                  className="font-mono"
                />
                <p className="text-[11px] text-slate-400">Official UNSPSC code (optional)</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalState({ open: false, isEdit: false, data: null })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingCategory}>
                {savingCategory && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {savingCategory
                    ? 'Saving...'
                    : modalState.isEdit
                    ? 'Save Changes'
                    : 'Create Category'}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
