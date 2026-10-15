import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RuleIcon from '@mui/icons-material/Rule';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

export default function Header({
  currentTab,
  onTabChange,
  onOpenNewProduct,
  onOpenImport,
  onExport,
  stats,
}) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 1100,
        width: '100%',
      }}
    >
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 3 } }}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 54, md: 58 },
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: { xs: 'wrap', lg: 'nowrap' },
            gap: 2,
            py: 0.5,
          }}
        >
          {/* Brand Logo & Tag */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.8,
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
              }}
            >
              <LocalHospitalIcon sx={{ fontSize: 20 }} />
            </Box>
            <Chip
              label="ZCMC"
              size="small"
              sx={{
                backgroundColor: '#0f766e',
                color: '#ffffff',
                fontWeight: 800,
                letterSpacing: '0.06em',
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          </Box>

          {/* Navigation Tabs */}
          <Tabs
            value={currentTab}
            onChange={(e, val) => onTabChange(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 46,
              '& .MuiTab-root': {
                minHeight: 46,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                gap: 0.8,
                px: 2,
              },
            }}
          >
            <Tab icon={<Inventory2Icon fontSize="small" />} iconPosition="start" label="Product Catalogue" value="products" />
            <Tab icon={<AccountTreeIcon fontSize="small" />} iconPosition="start" label="Category Hierarchy" value="categories" />
            <Tab icon={<RuleIcon fontSize="small" />} iconPosition="start" label="Uniform Naming Tool" value="naming" />
            <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label="Dashboard" value="dashboard" />
          </Tabs>

          {/* Right Section: Stats & Action Buttons */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            {stats && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', display: { xs: 'none', xl: 'flex' } }}>
                <Chip
                  size="small"
                  label={`Items: ${stats.total_products || 0}`}
                  variant="outlined"
                  sx={{ borderColor: '#cbd5e1', fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                />
                <Chip
                  size="small"
                  label={`UNSPSC: ${stats.total_categories?.toLocaleString() || '158,519'}`}
                  variant="outlined"
                  sx={{ borderColor: '#cbd5e1', fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                />
                <Chip
                  size="small"
                  label={`Naming: ${stats.compliance_rate || 100}%`}
                  color={stats.compliance_rate >= 80 ? 'success' : 'warning'}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                />
              </Stack>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={onExport}
              sx={{ borderColor: '#cbd5e1', color: '#334155', '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }, textTransform: 'none', fontWeight: 600 }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={onOpenImport}
              sx={{ borderColor: '#cbd5e1', color: '#334155', '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }, textTransform: 'none', fontWeight: 600 }}
            >
              Import CSV
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={onOpenNewProduct}
              sx={{ px: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Add Product
            </Button>
          </Stack>
        </Toolbar>
      </Box>
    </AppBar>
  );
}
