import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { api } from '../services/api';

export default function UniformNamingTool({ onSendToProductModal }) {
  const [genericNoun, setGenericNoun] = useState('');
  const [modifiers, setModifiers] = useState('');
  const [specs, setSpecs] = useState('');
  const [packaging, setPackaging] = useState('');

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
      {/* Left: Interactive Generator Form */}
      <Card className="lg:col-span-7">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Uniform Naming Standardizer</CardTitle>
              <CardDescription>
                ZCMC Procurement Guideline: [NOUN], [MODIFIERS], [SPECIFICATIONS], [PACKAGING]
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="genericNoun">1. Generic Noun / Item Category *</Label>
              <Input
                id="genericNoun"
                placeholder="e.g. PAPER, GLOVES, SYRINGE, PARACETAMOL, CATHETER"
                value={genericNoun}
                onChange={(e) => setGenericNoun(e.target.value)}
                className="uppercase"
              />
              <p className="text-[11px] text-slate-400">Primary object noun without brand</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modifiers">2. Primary Modifiers / Type</Label>
              <Input
                id="modifiers"
                placeholder="e.g. MULTICOPY, EXAMINATION, SURGICAL, DISPOSABLE"
                value={modifiers}
                onChange={(e) => setModifiers(e.target.value)}
                className="uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specs">3. Technical Size / Material / Dosage</Label>
              <Input
                id="specs"
                placeholder="e.g. A4, NITRILE POWDER-FREE, 500MG, 5ML 21G"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                className="uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="packaging">4. Packaging / Unit Form</Label>
              <Input
                id="packaging"
                placeholder="e.g. 500 SHEETS/REAM, 100 PIECES/BOX, 100 CAPSULES/BOX"
                value={packaging}
                onChange={(e) => setPackaging(e.target.value)}
                className="uppercase"
              />
            </div>

            <Button onClick={handleGenerate} className="w-full sm:w-auto">
              <Wand2 className="h-4 w-4" />
              <span>Generate Uniform Description</span>
            </Button>
          </div>

          <div className="pt-5 border-t border-slate-200 space-y-2">
            <Label htmlFor="directAudit">Or Direct Text Validation:</Label>
            <Textarea
              id="directAudit"
              rows={3}
              placeholder="Type or paste any draft description to audit against ZCMC naming standards..."
              value={generatedText}
              onChange={(e) => handleDirectAudit(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Right: Standardization Preview & Audit Result */}
      <Card className="lg:col-span-5 flex flex-col">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <CardTitle className="text-base">Standardization Preview &amp; Compliance</CardTitle>
          <CardDescription>
            Live validation score and duplicate detection against existing SSOT entries
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {generatedText ? (
            <div className="rounded-xl border-2 border-blue-600/80 bg-blue-50/30 p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                Normalized Naming
              </span>
              <p className="font-mono text-sm font-bold text-slate-900 leading-relaxed">
                {generatedText}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Name'}</span>
                </Button>
                <Button size="sm" onClick={() => onSendToProductModal(generatedText)}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Use in Product Form</span>
                </Button>
              </div>
            </div>
          ) : (
            <Alert variant="info">
              <Info className="h-4 w-4 shrink-0" />
              <AlertDescription>
                Use the component generator on the left or type a description to see live compliance analysis.
              </AlertDescription>
            </Alert>
          )}

          {auditResult && (
            <div
              className={`rounded-xl border p-4 space-y-3 ${
                auditResult.is_valid
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-amber-200 bg-amber-50/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {auditResult.is_valid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      auditResult.is_valid ? 'text-emerald-900' : 'text-amber-900'
                    }`}
                  >
                    Compliance Score: {auditResult.score}%
                  </span>
                </div>
                <Badge variant={auditResult.is_valid ? 'success' : 'warning'}>
                  {auditResult.is_valid ? 'Compliant' : 'Needs Review'}
                </Badge>
              </div>

              {auditResult.feedback?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Observations &amp; Recommendations:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                    {auditResult.feedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {auditResult.similar_items?.length > 0 && (
                <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5">
                  <span className="text-xs font-bold text-red-700 block">
                    Existing Similar Items in Database:
                  </span>
                  <div className="space-y-1">
                    {auditResult.similar_items.map((sim) => (
                      <p key={sim.id} className="text-xs text-slate-700">
                        • <strong className="font-mono text-blue-600">[{sim.erp_item_code}]</strong>{' '}
                        {sim.item_description} ({sim.uom})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
