import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ClearIcon from '@mui/icons-material/Clear'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LayersIcon from '@mui/icons-material/Layers'
import { api } from '../services/api'

/**
 * Commodity-first Category Selector.
 * Following user specification:
 * 1. User does not select Segment -> Family -> Class.
 * 2. User selects only the Commodity (Level 3).
 * 3. All parent relations (Segment, Family, Class, Breadcrumbs) auto-appear right away.
 * 4. Separate 'quick search' tab is removed.
 */
export default function CascadingCategorySelect({
  selectedKey,
  onSelectCategory,
}) {
  const [commodityOptions, setCommodityOptions] = useState([])
  const [selectedCommodity, setSelectedCommodity] = useState(null)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const debounceTimer = useRef(null)

  // Load initial default commodities on mount
  useEffect(() => {
    let active = true
    const loadInitialCommodities = async () => {
      try {
        setLoading(true)
        const data = await api.getCommodities('')
        if (active) {
          setCommodityOptions(data || [])
        }
      } catch (err) {
        console.error('Failed to load initial commodities', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialCommodities()
    return () => {
      active = false
    }
  }, [])

  // If selectedKey is provided (e.g. editing an existing product), resolve its full commodity details
  useEffect(() => {
    if (!selectedKey) {
      setSelectedCommodity(null)
      return
    }

    // If currently selected commodity matches selectedKey, no need to refetch
    if (selectedCommodity && selectedCommodity.key === Number(selectedKey)) {
      return
    }

    let active = true
    const fetchCategoryDetails = async () => {
      try {
        setLoading(true)
        const cat = await api.getCategory(selectedKey)
        if (active && cat) {
          const ancestors = cat.ancestors || []
          const segment = ancestors[0] || null
          const family = ancestors[1] || null
          const classItem = ancestors[2] || null

          const commodityObj = {
            key: cat.key,
            code: cat.code,
            title: cat.title,
            level: cat.level,
            definition: cat.definition,
            full_path: cat.full_path,
            relations: {
              segment: segment ? segment.title : null,
              segment_code: segment ? segment.code : null,
              family: family ? family.title : null,
              family_code: family ? family.code : null,
              class: classItem ? classItem.title : null,
              class_code: classItem ? classItem.code : null,
              commodity: cat.title,
              commodity_code: cat.code,
            },
            hierarchy: [
              ...ancestors,
              {
                key: cat.key,
                code: cat.code,
                title: cat.title,
                level: cat.level,
              },
            ],
          }

          setSelectedCommodity(commodityObj)
          // Add to options if not present
          setCommodityOptions((prev) => {
            const exists = prev.some((o) => o.key === cat.key)
            return exists ? prev : [commodityObj, ...prev]
          })
        }
      } catch (err) {
        console.error(
          'Failed to fetch category details for key',
          selectedKey,
          err
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchCategoryDetails()
    return () => {
      active = false
    }
  }, [selectedKey])

  // Debounced search for commodities as the user types
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!newInputValue || newInputValue.trim().length < 2) {
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await api.getCommodities(newInputValue.trim())
        setCommodityOptions(results || [])
      } catch (err) {
        console.error('Failed to search commodities', err)
      } finally {
        setLoading(false)
      }
    }, 250)
  }

  // Commodity selection handler
  const handleSelect = (event, item) => {
    if (item) {
      setSelectedCommodity(item)
      onSelectCategory({
        key: item.key,
        code: item.code,
        title: item.title,
        level: item.level,
      })
    } else {
      setSelectedCommodity(null)
      onSelectCategory(null)
    }
  }

  const handleClear = () => {
    setSelectedCommodity(null)
    setInputValue('')
    onSelectCategory(null)
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Label and Guidance */}
      <Box sx={{ mb: 1.2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LayersIcon sx={{ fontSize: 18, color: '#2563eb' }} />
          Select UNSPSC Commodity
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Select the specific commodity item. Its parent Segment, Family, and
          Class relations will resolve automatically.
        </Typography>
      </Box>

      {/* Direct Commodity Selector Autocomplete */}
      <Autocomplete
        fullWidth
        size="small"
        value={selectedCommodity}
        options={commodityOptions}
        loading={loading}
        getOptionLabel={(option) => {
          if (!option) return ''
          if (typeof option === 'string') return option
          return option.code ? `${option.title} [${option.code}]` : option.title
        }}
        isOptionEqualToValue={(option, val) => option?.key === val?.key}
        onInputChange={handleInputChange}
        onChange={handleSelect}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Type commodity name or code (e.g. Paracetamol, Nitrile gloves, Copier paper, 14111507)..."
            slotProps={{
              ...params.slotProps,
              input: {
                ...(params.slotProps?.input || {}),
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="primary" size={18} />
                    ) : null}
                    {params.slotProps?.input?.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          const relations = option.relations || {}
          return (
            <li {...props} key={option.key}>
              <Box sx={{ py: 0.8, width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: '#0f172a' }}
                  >
                    {option.title}
                  </Typography>
                  {option.code && (
                    <Chip
                      size="small"
                      label={option.code}
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        backgroundColor: '#f1f5f9',
                        color: '#2563eb',
                        height: 20,
                      }}
                    />
                  )}
                </Box>

                {/* Inline preview of parent class and segment */}
                {(relations.class || relations.segment) && (
                  <Typography
                    variant="caption"
                    sx={{ color: '#64748b', display: 'block', mt: 0.3 }}
                  >
                    {relations.class ? `Class: ${relations.class}` : ''}
                    {relations.class && relations.segment ? ' • ' : ''}
                    {relations.segment ? `Segment: ${relations.segment}` : ''}
                  </Typography>
                )}
              </Box>
            </li>
          )
        }}
      />

      {/* Auto-Resolved Category Relations Card (Appears right away when commodity is selected) */}
      {selectedCommodity && (
        <Paper
          variant="outlined"
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: '#eff6ff',
            borderColor: '#bfdbfe',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
          }}
        >
          {/* Header of relations card */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: '#2563eb', fontSize: 20 }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#1e3a8a' }}
              >
                Resolved Category Relations
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={`UNSPSC: ${selectedCommodity.code || 'N/A'}`}
                sx={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
              <Tooltip title="Clear Selection">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{ color: '#64748b' }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* 4-Level Structured Hierarchy Breakdown */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            {/* Level 0: Segment */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                sx={{
                  p: 1.2,
                  backgroundColor: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#1d4ed8',
                    fontWeight: 700,
                    display: 'block',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                  }}
                >
                  1. Segment (Group)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    lineHeight: 1.2,
                    mt: 0.2,
                  }}
                >
                  {selectedCommodity.relations?.segment || 'Top Level Segment'}
                </Typography>
                {selectedCommodity.relations?.segment_code && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                    }}
                  >
                    Code: {selectedCommodity.relations.segment_code}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Level 1: Family */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                sx={{
                  p: 1.2,
                  backgroundColor: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#1d4ed8',
                    fontWeight: 700,
                    display: 'block',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                  }}
                >
                  2. Family
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    lineHeight: 1.2,
                    mt: 0.2,
                  }}
                >
                  {selectedCommodity.relations?.family || 'Category Family'}
                </Typography>
                {selectedCommodity.relations?.family_code && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                    }}
                  >
                    Code: {selectedCommodity.relations.family_code}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Level 2: Class */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                sx={{
                  p: 1.2,
                  backgroundColor: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#1d4ed8',
                    fontWeight: 700,
                    display: 'block',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                  }}
                >
                  3. Class
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    lineHeight: 1.2,
                    mt: 0.2,
                  }}
                >
                  {selectedCommodity.relations?.class || 'Category Class'}
                </Typography>
                {selectedCommodity.relations?.class_code && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                    }}
                  >
                    Code: {selectedCommodity.relations.class_code}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Level 3: Commodity */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                sx={{
                  p: 1.2,
                  backgroundColor: '#ffffff',
                  border: '2px solid #2563eb',
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#2563eb',
                    fontWeight: 800,
                    display: 'block',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                  }}
                >
                  4. Commodity (Assigned)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    color: '#2563eb',
                    lineHeight: 1.2,
                    mt: 0.2,
                  }}
                >
                  {selectedCommodity.title}
                </Typography>
                {selectedCommodity.code && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#2563eb',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                    }}
                  >
                    Code: {selectedCommodity.code}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Full Path Breadcrumb Trail */}
          {selectedCommodity.full_path && (
            <Box sx={{ pt: 1, borderTop: '1px dashed #bfdbfe' }}>
              <Typography
                variant="caption"
                sx={{ color: '#2563eb', fontWeight: 700, display: 'block' }}
              >
                Full Hierarchy Trail:
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#334155', fontWeight: 600 }}
              >
                {selectedCommodity.full_path}
              </Typography>
            </Box>
          )}

          {/* UNSPSC Official Definition if available */}
          {selectedCommodity.definition && (
            <Box
              sx={{
                mt: 1,
                pt: 1,
                borderTop: '1px dashed #bfdbfe',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.8,
              }}
            >
              <InfoOutlinedIcon
                sx={{ fontSize: 16, color: '#1d4ed8', mt: 0.2 }}
              />
              <Typography
                variant="caption"
                sx={{ color: '#475569', fontStyle: 'italic', lineHeight: 1.3 }}
              >
                "{selectedCommodity.definition}"
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  )
}
