import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Paper,
  Button,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BusinessIcon from '@mui/icons-material/Business';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { display, formatPeso } from '@/lib/product';

// Shows a percentage when the server sent one, otherwise the empty marker (never a made-up number).
const percent = (value) => (value === null || value === undefined ? display(value) : `${value}%`);
const count = (value) => (typeof value === 'number' ? value.toLocaleString() : display(value));

export default function DashboardView({ stats, onNavigateToProducts }) {
  const [internalFilter, setInternalFilter] = useState('active'); // 'active' or 'all'
  const [searchInternal, setSearchInternal] = useState('');

  if (!stats) return null;

  const internalCategories = stats.internal_category_distribution || [];
  const activeCount = stats.active_internal_categories_count ?? internalCategories.filter((c) => c.count > 0).length;
  const totalInternal = stats.total_internal_categories || internalCategories.length || 32;
  const categorizedCount = stats.internal_categorized_count ?? stats.total_products ?? 0;
  const uncategorizedCount = stats.internal_uncategorized_count ?? 0;

  // Filtered internal categories based on search and toggle
  const filteredInternalCategories = useMemo(() => {
    return internalCategories.filter((cat) => {
      // Toggle check: if 'active', only show categories with products (or show all if none have products yet)
      if (internalFilter === 'active' && activeCount > 0 && cat.count <= 0) {
        return false;
      }
      // Search check
      if (searchInternal.trim()) {
        const query = searchInternal.toLowerCase().trim();
        const nameMatch = cat.name?.toLowerCase().includes(query);
        const codeMatch = cat.code?.toLowerCase().includes(query);
        return nameMatch || codeMatch;
      }
      return true;
    });
  }, [internalCategories, internalFilter, activeCount, searchInternal]);

  return (
    <Box sx={{ py: 3 }}>
      {/* 4 Primary Top Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Catalogue Products"
            value={count(stats.total_products)}
            subtitle="Standardized Hospital Items"
            icon={<Inventory2Icon sx={{ color: '#2563eb' }} />}
            bgColor="#eff6ff"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Internal Categories"
            value={count(totalInternal)}
            subtitle={`${count(categorizedCount)} Items Assigned (${percent(stats.internal_category_coverage ?? 100)})`}
            icon={<BusinessIcon sx={{ color: '#0f766e' }} />}
            bgColor="#f0fdfa"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Uniform Naming Compliance"
            value={percent(stats.compliance_rate)}
            subtitle="Compliant Uppercase & Structure"
            icon={<CheckCircleIcon sx={{ color: '#10b981' }} />}
            bgColor="#f0fdf4"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="UNSPSC Classification"
            value={count(stats.total_categories)}
            subtitle={`${count(stats.total_segments)} Primary Top-Level Segments`}
            icon={<LocalHospitalIcon sx={{ color: '#6366f1' }} />}
            bgColor="#eef2ff"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Distribution by Internal Category (Hospital Cost Centers / Department Categories) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Distribution by Internal Category
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Products categorized across hospital institutional cost centers
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${activeCount} active / ${totalInternal} total`}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    backgroundColor: '#f0fdfa',
                    color: '#0f766e',
                    border: '1px solid #99f6e4',
                  }}
                />
              </Box>

              {/* Uncategorized Warning banner if any products lack internal category */}
              {uncategorizedCount > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    my: 1.5,
                    backgroundColor: '#fffbeb',
                    borderColor: '#fde68a',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#d97706', fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                      {uncategorizedCount} product{uncategorizedCount === 1 ? '' : 's'} without internal category assigned
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => onNavigateToProducts && onNavigateToProducts('')}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}
                  >
                    View All
                  </Button>
                </Paper>
              )}

              {/* Filter controls: toggle active/all and search */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', my: 1.5, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                  size="small"
                  value={internalFilter}
                  exclusive
                  onChange={(e, val) => val && setInternalFilter(val)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 1.5,
                      py: 0.4,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'none',
                    },
                  }}
                >
                  <ToggleButton value="active">
                    Active ({activeCount})
                  </ToggleButton>
                  <ToggleButton value="all">
                    All Categories ({totalInternal})
                  </ToggleButton>
                </ToggleButtonGroup>

                <TextField
                  size="small"
                  placeholder="Filter category or code..."
                  value={searchInternal}
                  onChange={(e) => setSearchInternal(e.target.value)}
                  sx={{
                    flex: 1,
                    minWidth: 160,
                    '& .MuiInputBase-input': { py: 0.6, fontSize: '0.78rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Scrollable category distribution list */}
              <Stack spacing={1.5} sx={{ mt: 1, maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
                {filteredInternalCategories.length > 0 ? (
                  filteredInternalCategories.map((cat) => {
                    const pct = cat.percentage ?? (stats.total_products > 0 ? Math.round((cat.count / stats.total_products) * 100) : 0);
                    const hasItems = cat.count > 0;
                    return (
                      <Paper
                        key={cat.id}
                        variant="outlined"
                        onClick={() => onNavigateToProducts && onNavigateToProducts(cat.id)}
                        sx={{
                          p: 1.25,
                          borderRadius: 1.5,
                          borderColor: hasItems ? '#99f6e4' : '#e2e8f0',
                          backgroundColor: hasItems ? '#f0fdfa' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            borderColor: '#0f766e',
                            boxShadow: '0 2px 8px rgba(15,118,110,0.1)',
                            backgroundColor: hasItems ? '#e6fffa' : '#f8fafc',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, pr: 1 }}>
                            <Chip
                              size="small"
                              label={cat.code}
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                backgroundColor: hasItems ? '#0f766e' : '#e2e8f0',
                                color: hasItems ? '#ffffff' : '#64748b',
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: hasItems ? 700 : 500,
                                color: hasItems ? '#0f172a' : '#475569',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={cat.name}
                            >
                              {cat.name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, shrink: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 800,
                                color: hasItems ? '#0f766e' : '#94a3b8',
                                fontSize: '0.78rem',
                              }}
                            >
                              {cat.count} {cat.count === 1 ? 'item' : 'items'} ({pct}%)
                            </Typography>
                            <OpenInNewIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(pct, hasItems ? 4 : 0))}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: hasItems ? '#0f766e' : '#cbd5e1',
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Paper>
                    );
                  })
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {searchInternal
                        ? `No internal categories match "${searchInternal}".`
                        : 'No categories with products found.'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Group Distribution (UNSPSC Top-Level Classification) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Distribution by UNSPSC Category Group
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Item count across top-level UNSPSC procurement classifications
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${stats.group_distribution?.length || 0} groups`}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.7rem', borderColor: '#bfdbfe', color: '#1d4ed8' }}
                />
              </Box>

              <Stack spacing={2} sx={{ mt: 2, flex: 1, maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                {stats.group_distribution?.map((g, idx) => {
                  const pct = stats.total_products > 0 ? Math.round((g.count / stats.total_products) * 100) : 0;
                  return (
                    <Box key={idx}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {g.category_group || 'Unclassified'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb' }}>
                          {g.count} {g.count === 1 ? 'item' : 'items'} ({pct}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: idx % 2 === 0 ? '#2563eb' : '#1d4ed8',
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Units of Measure (UOM) Breakdown (Commented out) */}
        {/*
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                Units of Measure (UOM) Frequency
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                Standard packaging units used in procurement purchase requests
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                {stats.uom_distribution?.map((u, i) => (
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      minWidth: 110,
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563eb' }}>
                      {u.count}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      {u.uom}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        */}

        {/* Recently Added Products List */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Recently Catalogued Hospital Items
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Latest entries verified under uniform naming guidelines
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => onNavigateToProducts && onNavigateToProducts()}
                >
                  View Full Catalogue
                </Button>
              </Box>

              <Stack spacing={1.5}>
                {stats.recent_products?.map((item) => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      '&:hover': { borderColor: '#2563eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563eb' }}>
                        {item.erp_item_code}
                      </Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        {item.internal_category && (
                          <Chip
                            size="small"
                            label={item.internal_category.code || item.internal_category.name}
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              backgroundColor: '#f0fdfa',
                              color: '#0f766e',
                              borderColor: '#99f6e4',
                            }}
                            variant="outlined"
                          />
                        )}
                        <Chip
                          size="small"
                          label={item.uom}
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, textTransform: 'lowercase' }}
                        />
                      </Stack>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                      {item.item_description}
                    </Typography>
                    {item.full_category_path && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                        {item.full_category_path}
                      </Typography>
                    )}
                    <Box sx={{ pt: 1, mt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>Unit Price:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#2563eb' }}>
                        {formatPeso(item.unit_price)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function MetricCard({ title, value, subtitle, icon, bgColor }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', my: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              backgroundColor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
