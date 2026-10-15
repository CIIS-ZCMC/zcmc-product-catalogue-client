import React from 'react';
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
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function DashboardView({ stats, onNavigateToProducts }) {
  if (!stats) return null;

  return (
    <Box sx={{ py: 3 }}>
      {/* 4 Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Catalogue Products"
            value={stats.total_products || 0}
            subtitle="Standardized Hospital Items"
            icon={<Inventory2Icon sx={{ color: '#0f766e' }} />}
            bgColor="#f0fdfa"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Uniform Naming Compliance"
            value={(stats.compliance_rate || 0) + '%'}
            subtitle="Compliant Uppercase & Structure"
            icon={<CheckCircleIcon sx={{ color: '#10b981' }} />}
            bgColor="#f0fdf4"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Primary UNSPSC Segments"
            value={stats.total_segments || 58}
            subtitle="Top-Level Category Groups"
            icon={<AccountTreeIcon sx={{ color: '#0284c7' }} />}
            bgColor="#f0f9ff"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total UNSPSC Categories"
            value={stats.total_categories?.toLocaleString() || '158,519'}
            subtitle="Segments, Families, Classes & Commodities"
            icon={<LocalHospitalIcon sx={{ color: '#6366f1' }} />}
            bgColor="#eef2ff"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Category Group Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                Distribution by Category Group
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                Item count across top-level procurement classifications
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                {stats.group_distribution?.map((g, idx) => {
                  const pct = stats.total_products > 0 ? Math.round((g.count / stats.total_products) * 100) : 0;
                  return (
                    <Box key={idx}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {g.category_group || 'Unclassified'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f766e' }}>
                          {g.count} items ({pct}%)
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
                            backgroundColor: idx % 2 === 0 ? '#0f766e' : '#0d9488',
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

        {/* Units of Measure (UOM) Breakdown */}
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
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f766e' }}>
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

        {/* Recently Added Products List */}
        <Grid size={12}>
          <Card>
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
                  onClick={onNavigateToProducts}
                >
                  View Full Catalogue
                </Button>
              </Box>

              <Grid container spacing={2}>
                {stats.recent_products?.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        '&:hover': { borderColor: '#0f766e', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f766e' }}>
                            {item.erp_item_code}
                          </Typography>
                          <Chip
                            size="small"
                            label={item.uom}
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, textTransform: 'lowercase' }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                          {item.item_description}
                        </Typography>
                        {item.full_category_path && (
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.8, fontStyle: 'italic' }}>
                            {item.full_category_path}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ pt: 1.5, mt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Unit Price:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f766e' }}>
                          ₱{Number(item.unit_price || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
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
