import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Button,
  TextField,
  Chip,
  Stack,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { api } from '../services/api';

export default function CategoryExplorerView({ onFilterProductsByCategory }) {
  // Navigation stack: array of category objects [rootSegment, family, class, ...]
  const [navPath, setNavPath] = useState([]);
  const [currentChildren, setCurrentChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selected leaf or node for right pane details
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeProducts, setNodeProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Category CRUD dialogs
  const [modalState, setModalState] = useState({ open: false, isEdit: false, data: null });
  const [formFields, setFormFields] = useState({ title: '', code: '', parent_key: null });
  const [savingCategory, setSavingCategory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Initial load: root segments
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
      // Refresh current children list
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
    <Box sx={{ py: 3 }}>
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess('')}>
          {actionSuccess}
        </Alert>
      )}

      {/* Breadcrumb Navigation Bar */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<AccountTreeIcon />}
          onClick={() => handleNavigateToBreadcrumb(-1)}
          sx={{ fontWeight: 700, color: '#0f766e' }}
        >
          All Segments (Root)
        </Button>

        {navPath.map((item, idx) => (
          <React.Fragment key={item.key}>
            <ChevronRightIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
            <Button
              size="small"
              onClick={() => handleNavigateToBreadcrumb(idx)}
              sx={{
                fontWeight: idx === navPath.length - 1 ? 800 : 600,
                color: idx === navPath.length - 1 ? '#0f172a' : '#475569',
              }}
            >
              {item.code ? `[${item.code}] ` : ''}{item.title}
            </Button>
          </React.Fragment>
        ))}
      </Paper>

      <Grid container spacing={3}>
        {/* Left column: Categories List under current drilldown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', minHeight: 550, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {navPath.length === 0 ? 'Top-Level Segments' : `Subcategories of ${navPath[navPath.length - 1].title}`}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {currentChildren.length} categories available
                </Typography>
              </Box>

              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
              >
                Add Category
              </Button>
            </Box>

            <CardContent sx={{ p: 0, flex: 1, overflowY: 'auto', maxHeight: 600 }}>
              {loading ? (
                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={30} />
                </Box>
              ) : currentChildren.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    No child categories found in this branch. This is a terminal commodity level.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {currentChildren.map((child) => {
                    const isSelected = selectedNode && selectedNode.key === child.key;

                    return (
                      <ListItem
                        key={child.key}
                        disablePadding
                        divider
                        secondaryAction={
                          child.children_count > 0 ? (
                            <IconButton size="small" onClick={() => handleDrilldown(child)} sx={{ color: '#0f766e' }}>
                              <ChevronRightIcon />
                            </IconButton>
                          ) : null
                        }
                      >
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => selectNode(child)}
                          sx={{
                            py: 1.2,
                            '&.Mui-selected': {
                              backgroundColor: '#f0fdfa',
                              borderLeft: '4px solid #0f766e',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36, color: isSelected ? '#0f766e' : '#64748b' }}>
                            {child.children_count > 0 ? <FolderIcon fontSize="small" /> : <FolderOpenIcon fontSize="small" />}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: '#0f172a' }}>
                                {child.code ? `[${child.code}] ` : ''}{child.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Key: {child.key} • {child.children_count || 0} sub-branches
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Selected Category Node Details & Associated Products */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', minHeight: 550 }}>
            {selectedNode ? (
              <Box>
                {/* Node details header */}
                <Box sx={{ p: 2.5, backgroundColor: '#f0fdfa', borderBottom: '1px solid #ccfbf1' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Chip
                        size="small"
                        label={`Level ${selectedNode.level || (navPath.length)}`}
                        sx={{ backgroundColor: '#0f766e', color: '#fff', fontWeight: 700, mb: 1, fontSize: '0.7rem' }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#134e4a', lineHeight: 1.2 }}>
                        {selectedNode.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 600 }}>
                        Code: {selectedNode.code || 'N/A'} • Key: {selectedNode.key}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit this Category">
                        <IconButton size="small" onClick={handleOpenEdit} sx={{ color: '#0284c7' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Category">
                        <IconButton size="small" onClick={handleDeleteCategory} sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {/* Action to drill down if children exist */}
                  {selectedNode.children_count > 0 && (
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<ChevronRightIcon />}
                      onClick={() => handleDrilldown(selectedNode)}
                      sx={{ mt: 1.5, borderColor: '#0f766e', color: '#0f766e' }}
                    >
                      Browse {selectedNode.children_count} Subcategories
                    </Button>
                  )}
                </Box>

                {/* Products in this category branch */}
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Inventory2Icon fontSize="small" sx={{ color: '#0f766e' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Products under this category ({nodeProducts.length})
                      </Typography>
                    </Stack>

                    <Button
                      size="small"
                      onClick={() => onFilterProductsByCategory(selectedNode.key)}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      View All in Catalogue
                    </Button>
                  </Box>

                  {loadingProducts ? (
                    <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : nodeProducts.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        No catalogue products directly assigned to this category node yet.
                      </Typography>
                    </Paper>
                  ) : (
                    <Stack spacing={1}>
                      {nodeProducts.map((p) => (
                        <Paper
                          key={p.id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            borderColor: '#e2e8f0',
                            '&:hover': { borderColor: '#0f766e' },
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f766e' }}>
                            {p.erp_item_code}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {p.item_description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              UOM: {p.uom}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f766e' }}>
                              ₱{Number(p.unit_price || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Box>
            ) : (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Select a category from the left panel to inspect details and associated products.
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Add / Edit Category Dialog */}
      <Dialog open={modalState.open} onClose={() => setModalState({ open: false, isEdit: false, data: null })} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveCategory}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {modalState.isEdit ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2.5 }}>
            {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Category Title *"
                required
                placeholder="e.g. Surgical Instruments, Printing Paper..."
                value={formFields.title}
                onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
              />
              <TextField
                fullWidth
                size="small"
                label="UNSPSC Code"
                placeholder="e.g. 14111500"
                value={formFields.code}
                onChange={(e) => setFormFields({ ...formFields, code: e.target.value })}
                helperText="Official UNSPSC code (optional)"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalState({ open: false, isEdit: false, data: null })}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={savingCategory}>
              {savingCategory ? 'Saving...' : modalState.isEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
