import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import Header from './components/Header';
import ProductsView from './components/ProductsView';
import ProductModal from './components/ProductModal';
import ProductDetailDrawer from './components/ProductDetailDrawer';
import CategoryExplorerView from './components/CategoryExplorerView';
import UniformNamingTool from './components/UniformNamingTool';
import DashboardView from './components/DashboardView';
import ActivityLogsView from './components/ActivityLogsView';
import ImportExportModal from './components/ImportExportModal';
import AuthView from './components/AuthView';
import { api, authStorage } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser());
  const [currentTab, setCurrentTab] = useState('products');
  const [stats, setStats] = useState(null);

  // Products list & filter state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    category_key: '',
    internal_category_id: '',
    uom: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // In-page Product Form state (Add / Edit Product as an in-page view instead of a modal)
  const [editingProduct, setEditingProduct] = useState(null);
  const [returnTab, setReturnTab] = useState('products');

  // Drawers & Import Modal
  const [detailDrawer, setDetailDrawer] = useState({ open: false, product: null });
  const [importModalOpen, setImportModalOpen] = useState(false);

  const notify = (message, severity = 'success') => {
    if (severity === 'error') {
      toast.error(message);
    } else if (severity === 'warning') {
      toast.warning(message);
    } else if (severity === 'info') {
      toast.info(message);
    } else {
      toast.success(message);
    }
  };

  // Load stats
  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    }
  };

  // Load products catalogue
  const fetchProducts = useCallback(async (page = 1, currentFilters = filters, perPage = pagination.perPage) => {
    setLoadingProducts(true);
    try {
      const response = await api.getProducts({
        page,
        per_page: perPage,
        ...currentFilters,
      });

      setProducts(response.data || []);
      setPagination({
        currentPage: response.current_page || 1,
        perPage: response.per_page || perPage,
        total: response.total || 0,
      });
    } catch (err) {
      notify(err.message || 'Error fetching products catalogue', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, [filters, pagination.perPage]);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
      fetchProducts(1, filters);
    }
  }, []);

  // Filter change handler
  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    fetchProducts(1, updated);
  };

  const handleResetFilters = () => {
    const reset = {
      search: '',
      category_key: '',
      internal_category_id: '',
      uom: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    setFilters(reset);
    fetchProducts(1, reset);
  };

  const handlePageChange = (newPage) => {
    fetchProducts(newPage, filters);
  };

  const handleRowsPerPageChange = (newPerPage) => {
    setPagination((prev) => ({ ...prev, perPage: newPerPage }));
    fetchProducts(1, filters, newPerPage);
  };

  // Navigate to in-page Add / Edit Product view
  const handleOpenNewProduct = () => {
    if (currentTab !== 'product-form') {
      setReturnTab(currentTab);
    }
    setEditingProduct(null);
    setCurrentTab('product-form');
  };

  const handleOpenEditProduct = (product) => {
    if (currentTab !== 'product-form') {
      setReturnTab(currentTab);
    }
    setEditingProduct(product);
    setCurrentTab('product-form');
  };

  const handleCloseProductForm = () => {
    setEditingProduct(null);
    setCurrentTab(returnTab || 'products');
  };

  // Product CRUD handlers
  const handleSaveProduct = async (payload, id) => {
    if (id) {
      await api.updateProduct(id, payload);
      notify('Product updated successfully.');
    } else {
      await api.createProduct(payload);
      notify('Product added to catalogue successfully.');
    }
    fetchProducts(pagination.currentPage, filters);
    fetchStats();
    setEditingProduct(null);
    setCurrentTab('products');
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      notify('Product removed from catalogue.');
      fetchProducts(pagination.currentPage, filters);
      fetchStats();
    } catch (err) {
      notify(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleFilterByCategory = (categoryKey) => {
    handleFilterChange('category_key', categoryKey);
    setCurrentTab('products');
  };

  const handleSendToProductModal = (uniformDescription) => {
    const parts = (uniformDescription || '').split(',').map((s) => s.trim());
    setReturnTab('naming');
    setEditingProduct({
      noun: parts[0] || '',
      type: parts[1] || '',
      material_composition: parts[2] || '',
      key_attributes: parts[3] || '',
      size: parts[4] || '',
      item_description: uniformDescription,
    });
    setCurrentTab('product-form');
  };

  const handleExport = async () => {
    try {
      if (api.downloadExportCsv) {
        await api.downloadExportCsv(filters);
        notify('Exported catalogue CSV successfully.');
      } else {
        window.location.href = api.getExportUrl(filters);
      }
    } catch (err) {
      notify(err.message || 'Failed to export CSV', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      authStorage.clear();
      setCurrentUser(null);
      notify('Signed out successfully.');
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    notify(`Welcome back, ${user.first_name || user.email}!`);
    fetchStats();
    fetchProducts(1, filters);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      authStorage.clear();
      setCurrentUser(null);
      notify('Session expired. Please sign in again.', 'warning');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  if (!currentUser) {
    return (
      <>
        <AuthView onAuthSuccess={handleAuthSuccess} />
        <Toaster richColors position="bottom-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/80 flex flex-col text-slate-900">
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewProduct={handleOpenNewProduct}
        onOpenImport={() => setImportModalOpen(true)}
        onExport={handleExport}
        stats={stats}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {currentTab === 'products' && (
          <ProductsView
            products={products}
            currentUser={currentUser}
            loading={loadingProducts}
            pagination={pagination}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onViewProduct={(p) => setDetailDrawer({ open: true, product: p })}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenNewProduct={handleOpenNewProduct}
          />
        )}

        {currentTab === 'product-form' && (
          <ProductModal
            open={true}
            asPage={true}
            onClose={handleCloseProductForm}
            onSave={handleSaveProduct}
            product={editingProduct}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'categories' && (
          <CategoryExplorerView
            onFilterProductsByCategory={handleFilterByCategory}
          />
        )}

        {currentTab === 'naming' && (
          <UniformNamingTool
            onSendToProductModal={handleSendToProductModal}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            onNavigateToProducts={() => setCurrentTab('products')}
          />
        )}

        {currentTab === 'logs' && (
          <ActivityLogsView />
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-3 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            <span className="font-medium text-slate-700">Zamboanga City Medical Center (ZCMC)</span>
            <span>•</span>
            <span>Single Source of Truth (SSOT) Product Catalogue Library</span>
          </div>
          <div className="text-slate-400">
            Procurement Management Unit • Uniform Naming &amp; UNSPSC Standards
          </div>
        </div>
      </footer>

      {/* Product Detail Slide-Over Sheet & Import CSV Dialog */}
      <ProductDetailDrawer
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, product: null })}
        product={detailDrawer.product}
        onEdit={handleOpenEditProduct}
      />

      <ImportExportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => {
          fetchProducts(1, filters);
          fetchStats();
          notify('Import completed successfully.');
        }}
      />

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
