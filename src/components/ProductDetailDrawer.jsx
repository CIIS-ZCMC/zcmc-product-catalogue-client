import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  Paper,
  Button,
  Grid,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function ProductDetailDrawer({
  open,
  onClose,
  product,
  onEdit,
}) {
  if (!product) return null;

  const specs = product.specifications ? product.specifications.split(';').map((s) => s.trim()).filter(Boolean) : [];
  const hierarchy = product.category_hierarchy || [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, p: 0 } }}>
      <Box sx={{ p: 2.5, backgroundColor: '#0f766e', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, fontWeight: 700 }}>
            Catalogue Product Details
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.2 }}>
            {product.erp_item_code || 'Product Details'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto' }}>
        {/* Item Description (Uniform Standard) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Uniform Item Description
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5, lineHeight: 1.3 }}>
            {product.item_description}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {(product.internal_category || product.internal_category_code) && (
              <Chip
                size="small"
                label={`ZCMC: ${product.internal_category ? product.internal_category.name : product.internal_category_code}`}
                sx={{ fontWeight: 700, backgroundColor: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4' }}
              />
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Pricing & Units */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Unit Price
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f766e' }}>
                ₱{Number(product.unit_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Unit of Measure (UOM)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                {product.uom}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Multi-level Flexible Category Hierarchy */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <AccountTreeIcon fontSize="small" sx={{ color: '#0f766e' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
              UNSPSC Category Hierarchy ({hierarchy.length} Levels)
            </Typography>
          </Stack>

          {hierarchy.length > 0 ? (
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {hierarchy.map((lvl, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.2,
                    borderRadius: 1.5,
                    border: '1px solid #e2e8f0',
                    backgroundColor: index === hierarchy.length - 1 ? '#f0fdfa' : '#ffffff',
                    borderColor: index === hierarchy.length - 1 ? '#99f6e4' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Level {index + 1} {index === 0 ? '(Category Group / Segment)' : index === hierarchy.length - 1 ? '(Assigned Commodity)' : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: index === hierarchy.length - 1 ? '#0f766e' : '#1e293b' }}>
                      {lvl.code ? `[${lvl.code}] ` : ''}{lvl.title}
                    </Typography>
                  </Box>
                  <Chip size="small" label={`Key: ${lvl.key}`} sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              No hierarchical category assigned.
            </Typography>
          )}

          {product.full_category_path && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748b', fontStyle: 'italic' }}>
              Path: {product.full_category_path}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Technical Specifications */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <ReceiptLongIcon fontSize="small" sx={{ color: '#0f766e' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Technical Specifications ({specs.length})
            </Typography>
          </Stack>

          {specs.length > 0 ? (
            <Stack spacing={0.8} sx={{ mt: 1 }}>
              {specs.map((spec, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    {spec}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              No technical specifications listed.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* System Codes & References */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
            Procurement & System Codes
          </Typography>
          <Stack spacing={1.2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>ERP Item Code:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f766e', fontFamily: 'monospace' }}>
                {product.erp_item_code || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Internal Category:</Typography>
              <Chip
                size="small"
                label={
                  product.internal_category
                    ? `${product.internal_category.name} (${product.internal_category.code})`
                    : product.internal_category_code || 'N/A'
                }
                sx={{ fontWeight: 700, backgroundColor: '#f0fdfa', color: '#0f766e', fontSize: '0.72rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>BizBox Hospital Code:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {product.bizbox_item_code || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>PhilGEPS Code:</Typography>
              {product.philgeps_code ? (
                <Link
                  href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontWeight: 700,
                    color: '#0f766e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    fontSize: '0.75rem',
                    textDecoration: 'underline',
                  }}
                >
                  {product.philgeps_code} <OpenInNewIcon sx={{ fontSize: 13 }} />
                </Link>
              ) : (
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>N/A</Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>UNSPSC Code:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>{product.unspsc_code || 'N/A'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Catalogue Database ID:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>#{product.id}</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              onClose();
              onEdit(product);
            }}
          >
            Edit Product
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
