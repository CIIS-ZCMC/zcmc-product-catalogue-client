import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { theme } from './theme';
import Header from './components/Header';
import ProductsView from './components/ProductsView';
import ProductModal from './components/ProductModal';
import ProductDetailDrawer from './components/ProductDetailDrawer';
import CategoryExplorerView from './components/CategoryExplorerView';
import UniformNamingTool from './components/UniformNamingTool';
import DashboardView from './components/DashboardView';
import ImportExportModal from './components/ImportExportModal';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('products');
  const [stats, setStats] = useState(null);

  // Products list & filter state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    category_key: '',
    uom: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // Modals & drawers
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [detailDrawer, setDetailDrawer] = useState({ open: false, product: null });
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Notifications
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
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

  // Load products with current filters
  const fetchProducts = useCallback(async (page = 1, currentFilters = filters, perPage = pagination.perPage) => {
    setLoadingProducts(true);
    try {
      const params = {
        ...currentFilters,
        page,
        per_page: perPage,
      };
      const response = await api.getProducts(params);
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
    fetchStats();
    fetchProducts(1, filters);
  }, []);

  // Filter change handler
  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    fetchProducts(1, updated);
  };

  const handlePageChange = (newPage) => {
    fetchProducts(newPage, filters);
  };

  const handleRowsPerPageChange = (newPerPage) => {
    setPagination((prev) => ({ ...prev, perPage: newPerPage }));
    fetchProducts(1, filters, newPerPage);
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
    setProductModal({
      open: true,
      product: {
        item_description: uniformDescription,
      },
    });
  };

  const handleExport = () => {
    window.location.href = api.getExportUrl(filters);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenNewProduct={() => setProductModal({ open: true, product: null })}
          onOpenImport={() => setImportModalOpen(true)}
          onExport={handleExport}
          stats={stats}
        />

        {/* Full-width content wrapper consuming the entire page */}
        <Box sx={{ flex: 1, width: '100%', px: { xs: 2, sm: 2.5, md: 3 }, py: 2 }}>
          {currentTab === 'products' && (
            <ProductsView
              products={products}
              loading={loadingProducts}
              pagination={pagination}
              filters={filters}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onViewProduct={(p) => setDetailDrawer({ open: true, product: p })}
              onEditProduct={(p) => setProductModal({ open: true, product: p })}
              onDeleteProduct={handleDeleteProduct}
              onOpenNewProduct={() => setProductModal({ open: true, product: null })}
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
        </Box>

        {/* Clean Slim Footer */}
        <Box sx={{ py: 1.5, px: 3, borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', textAlign: 'center', mt: 'auto', width: '100%' }}>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Zamboanga City Medical Center (ZCMC) • Procurement Management Unit • Uniform Naming Standards
          </Typography>
        </Box>

        {/* Modals and Drawers */}
        <ProductModal
          open={productModal.open}
          onClose={() => setProductModal({ open: false, product: null })}
          onSave={handleSaveProduct}
          product={productModal.product}
        />

        <ProductDetailDrawer
          open={detailDrawer.open}
          onClose={() => setDetailDrawer({ open: false, product: null })}
          product={detailDrawer.product}
          onEdit={(p) => setProductModal({ open: true, product: p })}
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

        {/* Toast notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
            sx={{ width: '100%', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
