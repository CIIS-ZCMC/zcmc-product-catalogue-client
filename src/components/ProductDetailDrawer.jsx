import React, { useState, useEffect } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'
import HistoryIcon from '@mui/icons-material/History'
import { api } from '../services/api'

export default function ProductDetailDrawer({
  open,
  onClose,
  product,
  onEdit,
}) {
  const [priceHistory, setPriceHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false)

  useEffect(() => {
    if (product && product.id && open) {
      // Check if price_history is already passed or fetch it
      if (
        Array.isArray(product.price_history) &&
        product.price_history.length > 0
      ) {
        setPriceHistory(product.price_history)
      } else {
        setLoadingHistory(true)
        api
          .getPriceHistory(product.id)
          .then((res) => {
            setPriceHistory(res.history || [])
          })
          .catch((err) => {
            console.error('Failed to load price history', err)
            setPriceHistory([])
          })
          .finally(() => {
            setLoadingHistory(false)
          })
      }

      // Fetch product audit logs
      setLoadingAuditLogs(true)
      api
        .getProductActivityLogs(product.id)
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.logs || []
          setAuditLogs(list)
        })
        .catch((err) => {
          console.error('Failed to load audit logs', err)
          setAuditLogs([])
        })
        .finally(() => {
          setLoadingAuditLogs(false)
        })
    } else {
      setPriceHistory([])
      setAuditLogs([])
    }
  }, [product, open])

  if (!product) return null

  const rawSpecs = product.other_specs || product.specifications || ''
  const specs = rawSpecs
    ? rawSpecs
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  const hierarchy = product.category_hierarchy || []

  // Structured attributes breakdown without Net Content or Pack
  const structuredFields = [
    { label: 'Noun', value: product.noun, highlight: true },
    { label: 'Type', value: product.type },
    { label: 'Material / Composition', value: product.material_composition },
    { label: 'Key Attributes', value: product.key_attributes },
    { label: 'Size', value: product.size },
    { label: 'Unit of Measure', value: product.uom?.toUpperCase() },
  ].filter((item) => Boolean(item.value))

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 0 } }}
    >
      <Box
        sx={{
          p: 2.5,
          backgroundColor: '#2563eb',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.85,
              fontWeight: 700,
            }}
          >
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
        {/* Item Description (Standard Built Name) */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            Standard Item Description (Built Counterpart)
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5, lineHeight: 1.3 }}
          >
            {product.item_description}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {(product.internal_category || product.internal_category_code) && (
              <Chip
                size="small"
                label={`ZCMC: ${product.internal_category ? product.internal_category.name : product.internal_category_code}`}
                sx={{
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                }}
              />
            )}
            {product.tech_specs_pdf_url && (
              <Chip
                size="small"
                icon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                label="PDF Specs Attached"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        </Box>

        {/* Structured Naming Attributes Card */}
        {structuredFields.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: '#f8fafc',
              borderColor: '#cbd5e1',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
            >
              <FormatQuoteIcon sx={{ color: '#2563eb', fontSize: 20 }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#0f172a' }}
              >
                Standard Naming Attributes Breakdown
              </Typography>
            </Box>

            <Table
              size="small"
              sx={{
                '& td': { py: 0.7, px: 1, borderBottom: '1px solid #e2e8f0' },
              }}
            >
              <TableBody>
                {structuredFields.map((field, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      sx={{
                        width: '42%',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                      }}
                    >
                      {field.label}:
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: field.highlight ? '#2563eb' : '#1e293b',
                        fontSize: '0.82rem',
                      }}
                    >
                      {field.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Technical Specification PDF Document Card */}
        {product.tech_specs_pdf_url && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: '#eff6ff',
              borderColor: '#bfdbfe',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PictureAsPdfIcon sx={{ color: '#2563eb', fontSize: 28 }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: '#0f172a' }}
                >
                  Technical Specifications Document
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Manufacturer datasheet / PDF specification
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              variant="contained"
              startIcon={<OpenInNewIcon />}
              component="a"
              href={product.tech_specs_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#2563eb',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#1d4ed8' },
              }}
            >
              View PDF
            </Button>
          </Paper>
        )}

        {/* Current Pricing & Units */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: '#f8fafc',
            borderColor: '#e2e8f0',
            borderRadius: 2,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Current Unit Price
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: '#2563eb' }}
              >
                ₱
                {Number(product.unit_price || 0).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Unit of Measure (UOM)
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: '#334155' }}
              >
                {product.uom}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Unit Price History Table (Tracking Inflation Over Time) */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <TrendingUpIcon fontSize="small" sx={{ color: '#2563eb' }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#0f172a' }}
              >
                Unit Price History & Inflation Tracking
              </Typography>
            </Stack>
            {loadingHistory && <CircularProgress size={16} />}
          </Box>

          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, overflow: 'hidden', borderColor: '#e2e8f0' }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      color: '#475569',
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      color: '#475569',
                    }}
                  >
                    Price
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      color: '#475569',
                    }}
                  >
                    Change / Inflation
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      color: '#475569',
                    }}
                  >
                    Reason / Remarks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceHistory.length > 0 ? (
                  priceHistory.map((h, i) => {
                    const isIncrease = h.price_change > 0
                    const isDecrease = h.price_change < 0
                    return (
                      <TableRow key={h.id || i} hover>
                        <TableCell
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#334155',
                          }}
                        >
                          {formatDate(h.effective_date || h.created_at)}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#2563eb',
                          }}
                        >
                          ₱
                          {Number(h.new_price).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.72rem' }}>
                          {h.old_price === null ? (
                            <Chip
                              size="small"
                              label="Initial Price"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                backgroundColor: '#f1f5f9',
                              }}
                            />
                          ) : isIncrease ? (
                            <Chip
                              size="small"
                              icon={
                                <TrendingUpIcon
                                  sx={{ fontSize: '13px !important' }}
                                />
                              }
                              label={`+₱${Number(h.price_change).toFixed(2)} (+${h.percentage_change}%)`}
                              color="error"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : isDecrease ? (
                            <Chip
                              size="small"
                              icon={
                                <TrendingDownIcon
                                  sx={{ fontSize: '13px !important' }}
                                />
                              }
                              label={`-₱${Math.abs(Number(h.price_change)).toFixed(2)} (${h.percentage_change}%)`}
                              color="success"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              icon={<RemoveIcon />}
                              label="No change"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ fontSize: '0.72rem', color: '#64748b' }}
                        >
                          {h.reason || 'Price recorded'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 2, color: '#94a3b8', fontSize: '0.75rem' }}
                    >
                      Current price recorded: ₱
                      {Number(product.unit_price || 0).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Audit Trail & Modification History */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <HistoryIcon fontSize="small" sx={{ color: '#2563eb' }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#0f172a' }}
              >
                Audit Trail & History
              </Typography>
            </Stack>
            {loadingAuditLogs && <CircularProgress size={16} />}
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              borderColor: '#e2e8f0',
            }}
          >
            {auditLogs.length > 0 ? (
              <Stack spacing={1.2}>
                {auditLogs.map((log) => {
                  const isCreated = log.action === 'CREATED'
                  const isUpdated = log.action === 'UPDATED'
                  const isPdf = log.action === 'PDF_UPLOADED'

                  const badgeBg = isCreated
                    ? '#dcfce7'
                    : isUpdated
                      ? '#e0f2fe'
                      : isPdf
                        ? '#fef3c7'
                        : '#f1f5f9'
                  const badgeColor = isCreated
                    ? '#166534'
                    : isUpdated
                      ? '#0369a1'
                      : isPdf
                        ? '#92400e'
                        : '#475569'

                  return (
                    <Box
                      key={log.id}
                      sx={{
                        p: 1.2,
                        backgroundColor: '#ffffff',
                        borderRadius: 1.5,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.8}
                          alignItems="center"
                        >
                          <Chip
                            size="small"
                            label={log.action}
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              backgroundColor: badgeBg,
                              color: badgeColor,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: '#2563eb' }}
                          >
                            {log.user_name || log.user_email || 'System'}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          sx={{ color: '#64748b', fontSize: '0.7rem' }}
                        >
                          {formatDate(log.created_at)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#334155',
                          display: 'block',
                          fontSize: '0.75rem',
                        }}
                      >
                        {log.description}
                      </Typography>
                      {log.new_values &&
                        Object.keys(log.new_values).length > 0 && (
                          <Box
                            sx={{
                              mt: 0.8,
                              pt: 0.8,
                              borderTop: '1px dashed #e2e8f0',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: '#475569',
                                display: 'block',
                                fontSize: '0.68rem',
                                mb: 0.3,
                              }}
                            >
                              Changed Fields:
                            </Typography>
                            <Stack spacing={0.3}>
                              {Object.entries(log.new_values).map(
                                ([k, newVal]) => (
                                  <Box
                                    key={k}
                                    sx={{
                                      fontSize: '0.68rem',
                                      color: '#64748b',
                                      display: 'flex',
                                      gap: 0.5,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: '#334155',
                                      }}
                                    >
                                      {k}:
                                    </span>
                                    {log.old_values &&
                                      log.old_values[k] !== undefined && (
                                        <span
                                          style={{
                                            textDecoration: 'line-through',
                                            color: '#dc2626',
                                          }}
                                        >
                                          {String(log.old_values[k] ?? 'empty')}
                                        </span>
                                      )}
                                    <span
                                      style={{
                                        color: '#059669',
                                        fontWeight: 600,
                                      }}
                                    >
                                      → {String(newVal ?? 'empty')}
                                    </span>
                                  </Box>
                                )
                              )}
                            </Stack>
                          </Box>
                        )}
                    </Box>
                  )
                })}
              </Stack>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  display: 'block',
                  textAlign: 'center',
                  py: 1,
                }}
              >
                {loadingAuditLogs
                  ? 'Loading change history...'
                  : 'No activity logs recorded yet for this product.'}
              </Typography>
            )}
          </Paper>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Other Technical Specifications */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <ReceiptLongIcon fontSize="small" sx={{ color: '#2563eb' }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: '#0f172a' }}
            >
              Other Specifications (Optional) ({specs.length})
            </Typography>
          </Stack>

          {specs.length > 0 ? (
            <Stack spacing={0.8} sx={{ mt: 1 }}>
              {specs.map((spec, i) => (
                <Box
                  key={i}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    {spec}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              No other technical specifications listed.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* System Codes & References */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}
          >
            Procurement & System Codes
          </Typography>
          <Stack spacing={1.2}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                ERP Item Code:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: '#2563eb',
                  fontFamily: 'monospace',
                }}
              >
                {product.erp_item_code || 'N/A'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Internal Category:
              </Typography>
              <Chip
                size="small"
                label={
                  product.internal_category
                    ? `${product.internal_category.name} (${product.internal_category.code})`
                    : product.internal_category_code || 'N/A'
                }
                sx={{
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '0.72rem',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                BizBox Hospital Code:
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: '#0f172a' }}
              >
                {product.bizbox_item_code || 'N/A'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                PhilGEPS Code:
              </Typography>
              {product.philgeps_code ? (
                <Link
                  href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontWeight: 700,
                    color: '#2563eb',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    fontSize: '0.75rem',
                    textDecoration: 'underline',
                  }}
                >
                  {product.philgeps_code}{' '}
                  <OpenInNewIcon sx={{ fontSize: 13 }} />
                </Link>
              ) : (
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  N/A
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                UNSPSC Code:
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: '#0f172a' }}
              >
                {product.unspsc_code || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Catalogue Database ID:
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: '#0f172a' }}
              >
                #{product.id}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              onClose()
              onEdit(product)
            }}
          >
            Edit Product
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}
