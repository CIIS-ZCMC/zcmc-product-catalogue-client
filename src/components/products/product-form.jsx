import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  Lock,
  Plus,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { buildStandardName, PHILGEPS_DIRECTORY_URL, splitSpecs } from '@/lib/product'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useUnits } from '@/hooks/use-lookups'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CommodityCombobox } from './commodity-combobox'
import { InternalCategoryCombobox } from './internal-category-combobox'
import { UnsavedChangesGuard } from './unsaved-changes-guard'

const MAX_PDF_BYTES = 20 * 1024 * 1024

// Limits mirror StoreProductRequest / UpdateProductRequest on the server, which stays the source of truth.
function buildSchema({ requirePassword }) {
  const optional = (max, label) =>
    z.string().trim().max(max, { message: `${label} must be ${max} characters or fewer.` })

  return z
    .object({
      noun: z
        .string()
        .trim()
        .min(1, { message: 'Enter the noun, the primary item name.' })
        .max(100, { message: 'Noun must be 100 characters or fewer.' }),
      type: optional(100, 'Type'),
      material_composition: optional(255, 'Material / composition'),
      key_attributes: optional(500, 'Key attributes'),
      size: optional(100, 'Size'),
      uom: z.string().min(1, { message: 'Select a unit of measure.' }),
      commodity: z
        .object({ key: z.union([z.number(), z.string()]), code: z.string().nullish(), title: z.string().nullish() })
        .nullable()
        .refine((v) => v !== null, { message: 'Select the UNSPSC commodity.' }),
      internal_category_id: z
        .union([z.number(), z.string()])
        .nullable()
        .refine((v) => v !== null && v !== '', { message: 'Select the internal category.' }),
      bizbox_item_code: z
        .string()
        .trim()
        .min(1, { message: 'Enter the BizBox item code.' })
        .max(100, { message: 'BizBox item code must be 100 characters or fewer.' }),
      philgeps_code: optional(100, 'PhilGEPS code'),
      other_specs: z.array(z.string()),
      tech_specs_pdf_path: z.string().nullable(),
      confirm_password: z.string(),
    })
    .superRefine((v, ctx) => {
      if (requirePassword && !v.confirm_password) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirm_password'],
          message: 'Enter your account password to save changes.',
        })
      }
    })
}

// Splits a free-text name from the naming assistant ("NOUN, attribute, ...") into the structured fields.
function prefillFrom(description) {
  const [noun = '', ...rest] = (description || '').split(',').map((s) => s.trim()).filter(Boolean)
  return { noun: noun.toUpperCase(), key_attributes: rest.join(', ').toUpperCase() }
}

function defaultsFrom(product, prefill) {
  const p = product || prefill || {}
  return {
    noun: p.noun || '',
    type: p.type || '',
    material_composition: p.material_composition || '',
    key_attributes: p.key_attributes || '',
    size: p.size || '',
    uom: product?.uom || 'Piece',
    commodity: product?.category_key
      ? {
          key: p.category_key,
          code: p.unspsc_code || p.category_relation?.code || '',
          title: p.subcategory || p.category_relation?.title || '',
        }
      : null,
    internal_category_id: p.internal_category_id ?? null,
    bizbox_item_code: p.bizbox_item_code || '',
    philgeps_code: p.philgeps_code || '',
    other_specs: splitSpecs(p.other_specs),
    tech_specs_pdf_path: p.tech_specs_pdf_path || null,
    confirm_password: '',
  }
}

const upper = (s) => (s ? s.trim().toUpperCase() : null)

function toPayload(values, { includePassword }) {
  const payload = {
    noun: upper(values.noun),
    type: upper(values.type),
    material_composition: upper(values.material_composition),
    key_attributes: upper(values.key_attributes),
    size: upper(values.size),
    item_description: buildStandardName(values),
    uom: values.uom,
    category_key: values.commodity?.key ?? null,
    unspsc_code: values.commodity?.code || null,
    internal_category_id: values.internal_category_id,
    bizbox_item_code: values.bizbox_item_code.trim(),
    philgeps_code: values.philgeps_code.trim() || null,
    other_specs: values.other_specs.length ? values.other_specs.join('; ') : null,
    tech_specs_pdf_path: values.tech_specs_pdf_path || null,
  }
  if (includePassword) payload.confirm_password = values.confirm_password
  return payload
}

// Server field names → form field names.
const SERVER_FIELD_MAP = { category_key: 'commodity', password: 'confirm_password' }

function SectionCard({ title, description, children }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function NamingField({ control, name, label, placeholder, description, required }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl required={required}>
            {/* Displayed and saved in uppercase; the typed value is left alone so the caret never jumps. */}
            <Input {...field} placeholder={placeholder} autoComplete="off" autoCapitalize="characters" className="uppercase placeholder:normal-case" />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function NamingAudit({ description, excludeId }) {
  const debounced = useDebouncedValue(description, 450)
  const [audit, setAudit] = useState({ status: 'idle', data: null })

  useEffect(() => {
    if (debounced.length < 2) {
      setAudit({ status: 'idle', data: null })
      return undefined
    }
    const controller = new AbortController()
    setAudit((prev) => ({ ...prev, status: 'loading' }))
    api
      .validateNaming(debounced, { signal: controller.signal })
      .then((data) => setAudit({ status: 'success', data }))
      .catch((err) => {
        if (err?.name !== 'AbortError') setAudit({ status: 'error', data: null })
      })
    return () => controller.abort()
  }, [debounced])

  if (audit.status === 'idle') return null
  if (audit.status === 'error') {
    return <p className="text-muted-foreground text-xs">Naming guidance is unavailable right now. You can still save.</p>
  }
  if (!audit.data) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> Checking naming standard…
      </p>
    )
  }

  const { is_valid: valid, score, feedback = [], similar_items: allSimilar = [] } = audit.data
  // In edit mode the product being edited is not a duplicate of itself.
  const similar = allSimilar.filter((item) => String(item.id) !== String(excludeId))
  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {valid ? (
          <CircleCheck className="text-success size-4" aria-hidden="true" />
        ) : (
          <TriangleAlert className="text-warning size-4" aria-hidden="true" />
        )}
        <span className="font-medium">{valid ? 'Meets the naming standard' : 'Naming can be improved'}</span>
        <Badge variant="outline">Score {score}%</Badge>
        {audit.status === 'loading' && <LoaderCircle className="text-muted-foreground size-3.5 animate-spin" aria-label="Updating" />}
      </div>
      {feedback.length > 0 && (
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
          {feedback.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      {similar.length > 0 && (
        <Alert variant="warning" role="status">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Similar items already in the catalogue</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {similar.slice(0, 5).map((item) => (
                <li key={item.id} className="break-words">
                  <a href={`/products/${item.id}`} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
                    {item.item_description}
                  </a>{' '}
                  <span className="font-mono text-xs">{item.erp_item_code}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function ErpCodePreview({ mode, product, commodity, internalCategoryId }) {
  const [state, setState] = useState({ status: 'idle', code: '' })
  const ready = mode === 'create' && commodity && internalCategoryId

  useEffect(() => {
    if (!ready) {
      setState({ status: 'idle', code: '' })
      return undefined
    }
    let active = true
    setState((prev) => ({ ...prev, status: 'loading' }))
    api
      .getNextErpCode(commodity.code, '', internalCategoryId, commodity.key)
      .then((res) => active && setState({ status: 'success', code: res?.erp_item_code || '' }))
      .catch(() => active && setState({ status: 'error', code: '' }))
    return () => {
      active = false
    }
  }, [ready, commodity, internalCategoryId])

  const value =
    mode === 'edit'
      ? product?.erp_item_code || '—'
      : state.status === 'loading'
        ? 'Generating…'
        : state.code || (ready ? 'Could not preview the code' : 'Select a commodity and internal category')

  return (
    <div className="grid gap-2">
      <Label htmlFor="erp-code">ERP item code</Label>
      <div className="relative">
        <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
        <Input id="erp-code" readOnly value={value} className="pl-9 font-mono" aria-describedby="erp-code-help" />
      </div>
      <p id="erp-code-help" className="text-muted-foreground text-xs">
        {mode === 'edit'
          ? 'Assigned when the product was created and cannot be changed.'
          : 'Generated by the server as [UNSPSC code]-[internal code]-[sequence]. The preview may change if someone saves first.'}
      </p>
    </div>
  )
}

function SpecsField({ value, onChange }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const parts = splitSpecs(draft)
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))])
    setDraft('')
  }
  return (
    <div className="grid gap-2">
      <Label htmlFor="spec-input">Other specifications</Label>
      <div className="flex gap-2">
        <Input
          id="spec-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="e.g. Sterile"
          aria-describedby="spec-help"
          autoComplete="off"
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>
      <p id="spec-help" className="text-muted-foreground text-xs">
        Optional notes such as Sterile, Heavy duty or CE certified. Press Enter to add each one. Saved separated by
        semicolons.
      </p>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Added specifications">
          {value.map((spec) => (
            <li key={spec}>
              <Badge variant="secondary" className="h-7 max-w-full gap-1 pr-1 pl-2.5">
                <span className="break-all whitespace-normal">{spec}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((s) => s !== spec))}
                  className="hover:bg-background rounded p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={`Remove ${spec}`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PdfField({ path, initialUrl, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState(() => (path ? { name: path.split('/').pop(), url: initialUrl || '' } : null))

  const handleFile = async (e) => {
    const selected = e.target.files?.[0]
    e.target.value = ''
    if (!selected) return
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Choose a PDF file.')
      return
    }
    if (selected.size > MAX_PDF_BYTES) {
      setError('The PDF is larger than 20 MB.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const res = await api.uploadSpecsPdf(selected)
      setFile({ name: res.original_filename || selected.name, url: res.file_url })
      onChange(res.file_path)
    } catch (err) {
      setError(err.message || 'The PDF could not be uploaded. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="pdf-input">Technical specification PDF</Label>
      <input
        ref={inputRef}
        id="pdf-input"
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={handleFile}
        aria-describedby="pdf-help"
      />
      {path && file ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
          <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {file.url ? (
            <a href={file.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 text-sm font-medium break-all underline-offset-2 hover:underline">
              {file.name}
            </a>
          ) : (
            <span className="min-w-0 flex-1 text-sm break-all">{file.name}</span>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            Replace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setFile(null)
              onChange(null)
            }}
            disabled={uploading}
          >
            Remove
          </Button>
        </div>
      ) : (
        <div>
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </Button>
        </div>
      )}
      <p id="pdf-help" className="text-muted-foreground text-xs">
        Optional manufacturer brochure or datasheet, up to 20 MB. It uploads immediately and is linked when you save.
      </p>
      {error && (
        <p className="text-destructive text-xs font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Create/edit form for a catalogue product.
 * `onSubmit(payload)` performs the request and should throw the API error on failure;
 * field errors from the server (err.errors) are mapped back onto the inputs.
 */
export function ProductForm({ mode, product, prefillDescription, requirePassword = false, onSubmit, onCancel }) {
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const units = useUnits()
  const errorRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(buildSchema({ requirePassword })),
    defaultValues: defaultsFrom(product, prefillDescription ? prefillFrom(prefillDescription) : null),
    mode: 'onTouched',
  })
  const { control, handleSubmit, setError, formState } = form

  const naming = useWatch({ control, name: ['noun', 'type', 'material_composition', 'key_attributes', 'size'] })
  const builtName = buildStandardName({
    noun: naming[0],
    type: naming[1],
    material_composition: naming[2],
    key_attributes: naming[3],
    size: naming[4],
  })
  const commodity = useWatch({ control, name: 'commodity' })
  const internalCategoryId = useWatch({ control, name: 'internal_category_id' })

  const unitOptions = units.some((u) => u.toLowerCase() === (product?.uom || '').toLowerCase()) || !product?.uom
    ? units
    : [product.uom, ...units]

  const submit = handleSubmit(
    async (values) => {
      setFormError('')
      try {
        setSaved(true) // lets the unsaved-changes guard allow the post-save navigation
        await onSubmit(toPayload(values, { includePassword: requirePassword }))
      } catch (err) {
        setSaved(false)
        const fieldErrors = err?.errors && typeof err.errors === 'object' ? Object.entries(err.errors) : []
        let mapped = 0
        fieldErrors.forEach(([key, messages]) => {
          const name = SERVER_FIELD_MAP[key] || key
          if (name in form.getValues()) {
            setError(name, { type: 'server', message: Array.isArray(messages) ? messages[0] : String(messages) })
            mapped += 1
          }
        })
        if (mapped === 0 || fieldErrors.length > mapped) {
          setFormError(err?.message || 'The product could not be saved. Your entries are kept; try again.')
          requestAnimationFrame(() => errorRef.current?.focus())
        }
      }
    },
    () => {
      // React Hook Form moves focus to the first invalid field; the summary is announced via role="alert".
      setFormError('Some fields need attention. Check the highlighted fields below.')
    },
  )

  return (
    <Form {...form}>
      <UnsavedChangesGuard when={formState.isDirty && !saved} />
      <form onSubmit={submit} noValidate className="space-y-6">
        {formError && (
          <Alert variant="destructive" ref={errorRef} tabIndex={-1} className="outline-none">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Not saved</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <SectionCard
          title="Standard item name"
          description="The item description is built from these parts in order and saved in uppercase."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NamingField control={control} name="noun" label="Noun" placeholder="e.g. Bleach, Paper" description="Primary item name." required />
            <NamingField control={control} name="type" label="Type" placeholder="e.g. Liquid, Bond" description="Sub-classification or form." />
            <NamingField control={control} name="material_composition" label="Material / composition" placeholder="e.g. Sodium hypochlorite 5.25%" description="Active ingredient or material." />
            <div className="sm:col-span-2 lg:col-span-3">
              <NamingField control={control} name="key_attributes" label="Key attributes" placeholder="e.g. 70 GSM, Multicopy" description="Properties, colour or mechanism. Separate several with commas." />
            </div>
            <NamingField control={control} name="size" label="Size" placeholder="e.g. A4, 6 x 9 in" description="Dimensions or size." />
            <FormField
              control={control}
              name="uom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Unit of measure</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl required>
                      <SelectTrigger onBlur={field.onBlur}>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-72">
                      {unitOptions.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Hospital inventory unit.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-muted/60 mt-5 space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase" id="built-name-label">
              Item description preview
            </p>
            <p
              className={cn('font-mono text-sm font-semibold break-words', !builtName && 'text-muted-foreground font-normal')}
              aria-labelledby="built-name-label"
            >
              {builtName || 'Fill in the noun and other parts to see the description.'}
            </p>
            <NamingAudit description={builtName} excludeId={product?.id} />
          </div>
        </SectionCard>

        <SectionCard title="Classification" description="Where the item sits in UNSPSC and in ZCMC's internal categories.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="commodity"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel required>UNSPSC commodity</FormLabel>
                  <FormControl required>
                    <CommodityCombobox
                      value={field.value}
                      onChange={(c) => {
                        field.onChange(c ? { key: c.key, code: c.code, title: c.title } : null)
                        field.onBlur()
                      }}
                    />
                  </FormControl>
                  <FormDescription>Search by name or 8-digit code. Segment, family and class follow from the commodity.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="internal_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Internal category</FormLabel>
                  <FormControl required>
                    <InternalCategoryCombobox
                      value={field.value}
                      onChange={(c) => {
                        field.onChange(c ? c.id : null)
                        field.onBlur()
                      }}
                    />
                  </FormControl>
                  <FormDescription>ZCMC institutional category, e.g. OF-SUP.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ErpCodePreview mode={mode} product={product} commodity={commodity} internalCategoryId={internalCategoryId} />
          </div>
        </SectionCard>

        <SectionCard title="System codes" description="Codes used by other hospital and government systems.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="bizbox_item_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>BizBox item code</FormLabel>
                  <FormControl required>
                    <Input {...field} placeholder="e.g. BZ-MED-001" autoComplete="off" spellCheck={false} />
                  </FormControl>
                  <FormDescription>Code from the BizBox hospital system.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="philgeps_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PhilGEPS code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 14111507-PP-M01" autoComplete="off" spellCheck={false} />
                  </FormControl>
                  <FormDescription>
                    Optional. Look it up in the{' '}
                    <a href={PHILGEPS_DIRECTORY_URL} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-0.5 font-medium underline underline-offset-2">
                      PS-PhilGEPS common-use items directory
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    .
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SectionCard>

        <SectionCard title="Specifications">
          <div className="grid gap-6">
            <FormField
              control={control}
              name="other_specs"
              render={({ field }) => <SpecsField value={field.value} onChange={field.onChange} />}
            />
            <FormField
              control={control}
              name="tech_specs_pdf_path"
              render={({ field }) => (
                <PdfField path={field.value} initialUrl={product?.tech_specs_pdf_url} onChange={(v) => field.onChange(v)} />
              )}
            />
          </div>
        </SectionCard>

        {requirePassword && (
          <SectionCard
            title="Confirm it's you"
            description="End users must enter their account password to change an existing product. The server checks it before saving."
          >
            <FormField
              control={control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem className="max-w-sm">
                  <FormLabel required>Account password</FormLabel>
                  <div className="relative">
                    <FormControl required>
                      <Input {...field} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-10" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1/2 right-0.5 -translate-y-1/2"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>
        )}

        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-lg sm:border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={formState.isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {formState.isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save product' : 'Create product'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
