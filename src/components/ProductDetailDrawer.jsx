import React, { useState, useEffect } from 'react';
import {
  Pencil,
  CheckCircle2,
  FileText,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Quote,
  Tag,
  Hash,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import { api } from '../services/api';

export default function ProductDetailDrawer({
  open,
  onClose,
  product,
  onEdit,
}) {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  useEffect(() => {
    if (product && product.id && open) {
      if (Array.isArray(product.price_history) && product.price_history.length > 0) {
        setPriceHistory(product.price_history);
      } else {
        setLoadingHistory(true);
        api.getPriceHistory(product.id)
          .then((res) => {
            setPriceHistory(res.history || []);
          })
          .catch((err) => {
            console.error('Failed to load price history', err);
            setPriceHistory([]);
          })
          .finally(() => {
            setLoadingHistory(false);
          });
      }

      setLoadingAuditLogs(true);
      api.getProductActivityLogs(product.id)
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.logs || [];
          setAuditLogs(list);
        })
        .catch((err) => {
          console.error('Failed to load audit logs', err);
          setAuditLogs([]);
        })
        .finally(() => {
          setLoadingAuditLogs(false);
        });
    } else {
      setPriceHistory([]);
      setAuditLogs([]);
    }
  }, [product, open]);

  if (!product) return null;

  const rawSpecs = product.other_specs || product.specifications || '';
  const specs = rawSpecs
    ? rawSpecs.split(';').map((s) => s.trim()).filter(Boolean)
    : [];

  const structuredFields = [
    { label: 'Noun', value: product.noun, highlight: true },
    { label: 'Type', value: product.type },
    { label: 'Material / Composition', value: product.material_composition },
    { label: 'Key Attributes', value: product.key_attributes },
    { label: 'Size', value: product.size },
    { label: 'Unit of Measure', value: product.uom?.toUpperCase() },
  ].filter((item) => Boolean(item.value));

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="p-0 flex flex-col sm:max-w-xl">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white pr-12">
          <SheetHeader className="text-left">
            <SheetDescription className="text-[11px] font-semibold uppercase tracking-wider text-blue-100">
              SSOT Product Inspector
            </SheetDescription>
            <SheetTitle className="font-mono text-lg font-bold text-white">
              {product.erp_item_code || 'Product Details'}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Standard Built Name */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Standard Item Description (Built Counterpart)
            </span>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {product.item_description}
            </h3>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(product.internal_category || product.internal_category_code) && (
                <Badge variant="blue">
                  ZCMC:{' '}
                  {product.internal_category
                    ? product.internal_category.name
                    : product.internal_category_code}
                </Badge>
              )}
              <Badge variant="outline" className="font-mono uppercase">
                UOM: {product.uom}
              </Badge>
              {product.tech_specs_pdf_url && (
                <Badge variant="success">
                  <FileText className="h-3 w-3" />
                  PDF Specs Attached
                </Badge>
              )}
            </div>
          </div>

          {/* Tabbed Inspector */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview &amp; Codes</TabsTrigger>
              <TabsTrigger value="pricing">Price History</TabsTrigger>
              <TabsTrigger value="audit">
                Audit Trail ({auditLogs.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Overview & System Codes */}
            <TabsContent value="overview" className="space-y-4 pt-2">
              {/* Structured Naming Attributes */}
              {structuredFields.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Quote className="h-4 w-4 text-blue-600" />
                    <span>Standard Naming Attributes Breakdown</span>
                  </div>
                  <div className="divide-y divide-slate-200/70 text-xs">
                    {structuredFields.map((field, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 gap-4">
                        <span className="font-medium text-slate-500">{field.label}:</span>
                        <span
                          className={`font-semibold text-right ${
                            field.highlight ? 'text-blue-600 font-bold' : 'text-slate-900'
                          }`}
                        >
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical PDF Document */}
              {product.tech_specs_pdf_url && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Technical Specifications Document
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Manufacturer datasheet / PDF specification
                      </p>
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <a
                      href={product.tech_specs_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>View PDF</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              )}

              {/* Other Technical Specifications */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>Other Specifications ({specs.length})</span>
                </div>
                {specs.length > 0 ? (
                  <div className="space-y-1.5">
                    {specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No other technical specifications listed.
                  </p>
                )}
              </div>

              {/* Procurement & System Codes */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Hash className="h-4 w-4 text-blue-600" />
                  <span>Procurement &amp; System Codes</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">ERP Item Code:</span>
                    <span className="font-mono font-bold text-blue-600">
                      {product.erp_item_code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">Internal Category:</span>
                    <Badge variant="blue" className="text-[11px]">
                      {product.internal_category
                        ? `${product.internal_category.name} (${product.internal_category.code})`
                        : product.internal_category_code || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">BizBox Hospital Code:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {product.bizbox_item_code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">PhilGEPS Code:</span>
                    {product.philgeps_code ? (
                      <a
                        href="https://ps-philgeps.gov.ph/home/index.php/what-we-sell/common-use-items"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono font-semibold text-blue-600 hover:underline"
                      >
                        <span>{product.philgeps_code}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">UNSPSC Code:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {product.unspsc_code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">Catalogue Database ID:</span>
                    <span className="font-mono text-slate-700">#{product.id}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Price History */}
            <TabsContent value="pricing" className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Current Unit Price
                  </span>
                  <p className="text-xl font-bold font-mono text-blue-600 mt-0.5">
                    ₱{Number(product.unit_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Unit of Measure
                  </span>
                  <p className="text-base font-bold text-slate-800 mt-1 uppercase">
                    {product.uom}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    Unit Price History &amp; Inflation Tracking
                  </span>
                  {loadingHistory && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory.length > 0 ? (
                      priceHistory.map((h, i) => {
                        const isIncrease = h.price_change > 0;
                        const isDecrease = h.price_change < 0;
                        return (
                          <TableRow key={h.id || i}>
                            <TableCell className="text-xs">
                              {formatDate(h.effective_date || h.created_at)}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-blue-600">
                              ₱{Number(h.new_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {h.old_price === null ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Initial Price
                                </Badge>
                              ) : isIncrease ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  <TrendingUp className="h-3 w-3" />
                                  +₱{Number(h.price_change).toFixed(2)} (+{h.percentage_change}%)
                                </Badge>
                              ) : isDecrease ? (
                                <Badge variant="success" className="text-[10px]">
                                  <TrendingDown className="h-3 w-3" />
                                  -₱{Math.abs(Number(h.price_change)).toFixed(2)} ({h.percentage_change}%)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  <Minus className="h-3 w-3" />
                                  No change
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {h.reason || 'Price recorded'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-xs text-slate-400">
                          Current price recorded: ₱
                          {Number(product.unit_price || 0).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Tab 3: Audit Trail */}
            <TabsContent value="audit" className="space-y-3 pt-2">
              {loadingAuditLogs ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Loading audit logs...</span>
                </div>
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log) => {
                  const isCreated = log.action === 'CREATED';
                  const isUpdated = log.action === 'UPDATED';
                  const variant = isCreated ? 'success' : isUpdated ? 'blue' : 'secondary';

                  return (
                    <div
                      key={log.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={variant} className="text-[10px]">
                            {log.action}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-900">
                            {log.user_name || log.user_email || 'System'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{log.description}</p>

                      {log.new_values && Object.keys(log.new_values).length > 0 && (
                        <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Changed Fields
                          </span>
                          {Object.entries(log.new_values).map(([k, newVal]) => (
                            <div key={k} className="text-[11px] flex flex-wrap gap-1.5">
                              <span className="font-semibold text-slate-700">{k}:</span>
                              {log.old_values && log.old_values[k] !== undefined && (
                                <span className="line-through text-red-600">
                                  {String(log.old_values[k] ?? 'empty')}
                                </span>
                              )}
                              <span className="text-emerald-700 font-medium">
                                → {String(newVal ?? 'empty')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                  No activity logs recorded yet for this product.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Sticky Action Footer */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onClose();
              onEdit(product);
            }}
          >
            <Pencil className="h-4 w-4" />
            <span>Edit Product</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
