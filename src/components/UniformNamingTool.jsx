import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import RuleIcon from '@mui/icons-material/Rule';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { api } from '../services/api';

export default function UniformNamingTool({ onSendToProductModal }) {
  // Wizard parts
  const [genericNoun, setGenericNoun] = useState('');
  const [modifiers, setModifiers] = useState('');
  const [specs, setSpecs] = useState('');
  const [packaging, setPackaging] = useState('');

  // Generated text & audit
  const [generatedText, setGeneratedText] = useState('');
  const [auditResult, setAuditResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const parts = [genericNoun, modifiers, specs, packaging]
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const uniform = parts.join(', ');
    setGeneratedText(uniform);

    if (uniform) {
      try {
        const audit = await api.validateNaming(uniform);
        setAuditResult(audit);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDirectAudit = async (text) => {
    setGeneratedText(text);
    if (text.trim().length >= 2) {
      try {
        const audit = await api.validateNaming(text);
        setAuditResult(audit);
      } catch (err) {
        console.error(err);
      }
    } else {
      setAuditResult(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Left: Interactive Generator Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.5, backgroundColor: '#2563eb', color: '#fff' }}>
                  <RuleIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Uniform Naming Standardizer
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    ZCMC Procurement Guideline: [NOUN], [MODIFIERS], [SPECIFICATIONS], [PACKAGING]
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
                Component Generator
              </Typography>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="1. Generic Noun / Item Category *"
                  placeholder="e.g. PAPER, GLOVES, SYRINGE, PARACETAMOL, CATHETER"
                  value={genericNoun}
                  onChange={(e) => setGenericNoun(e.target.value)}
                  helperText="Primary object noun without brand"
                />

                <TextField
                  fullWidth
                  size="small"
                  label="2. Primary Modifiers / Type"
                  placeholder="e.g. MULTICOPY, EXAMINATION, SURGICAL, DISPOSABLE"
                  value={modifiers}
                  onChange={(e) => setModifiers(e.target.value)}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="3. Technical Size / Material / Dosage"
                  placeholder="e.g. A4, NITRILE POWDER-FREE, 500MG, 5ML 21G"
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="4. Packaging / Unit Form"
                  placeholder="e.g. 500 SHEETS/REAM, 100 PIECES/BOX, 100 CAPSULES/BOX"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                />

                <Button
                  variant="contained"
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleGenerate}
                  sx={{ py: 1 }}
                >
                  Generate Uniform Description
                </Button>
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                Or Direct Text Validation:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Type or paste any draft description to audit..."
                value={generatedText}
                onChange={(e) => handleDirectAudit(e.target.value)}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Validation & Audit Result */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                Standardization Preview
              </Typography>

              {generatedText ? (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Normalized Naming:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                    {generatedText}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopy}
                    >
                      {copied ? 'Copied!' : 'Copy Name'}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddCircleIcon />}
                      onClick={() => onSendToProductModal(generatedText)}
                    >
                      Use in Product Form
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Use the component generator on the left or type a description to see live compliance analysis.
                </Alert>
              )}

              {auditResult && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: auditResult.is_valid ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${auditResult.is_valid ? '#86efac' : '#fde047'}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {auditResult.is_valid ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <WarningAmberIcon color="warning" />
                      )}
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: auditResult.is_valid ? '#15803d' : '#a16207' }}>
                        Compliance Score: {auditResult.score}%
                      </Typography>
                    </Stack>
                  </Box>

                  {auditResult.feedback?.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                        Observations & Recommendations:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.8rem', color: '#475569' }}>
                        {auditResult.feedback.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {auditResult.similar_items?.length > 0 && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #cbd5e1' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#b91c1c' }}>
                        Existing Similar Items in Database:
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {auditResult.similar_items.map((sim) => (
                          <Typography key={sim.id} variant="caption" sx={{ color: '#334155' }}>
                            • <strong>[{sim.erp_item_code}]</strong> {sim.item_description} ({sim.uom})
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
