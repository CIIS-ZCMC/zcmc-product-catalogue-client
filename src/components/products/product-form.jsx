import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronDown,
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
import {
  buildStandardName,
  PHILGEPS_DIRECTORY_URL,
  splitSpecs,
} from '@/lib/product'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useUnits } from '@/hooks/use-lookups'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { InternalCategoryCombobox } from './internal-category-combobox'
import { UnitSelect } from './unit-select'
import { UnspscClassifier } from './unspsc-classifier'
import { UnsavedChangesGuard } from './unsaved-changes-guard'

const MAX_PDF_BYTES = 20 * 1024 * 1024

// Limits mirror StoreProductRequest / UpdateProductRequest on the server, which stays the source of truth.
function buildSchema({ requirePassword }) {
  const optional = (max, label) =>
    z
      .string()
      .trim()
      .max(max, { message: `${label} must be ${max} characters or fewer.` })

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
        .object({
          key: z.union([z.number(), z.string()]),
          code: z.string().nullish(),
          title: z.string().nullish(),
        })
        .nullable()
        .refine((v) => v !== null, { message: 'Select the UNSPSC commodity.' }),
      internal_category_id: z
        .union([z.number(), z.string()])
        .nullable()
        .refine((v) => v !== null && v !== '', {
          message: 'Select the internal category.',
        }),
      bizbox_item_code: z
        .string()
        .trim()
        .min(1, { message: 'Enter the BizBox item code.' })
        .max(100, {
          message: 'BizBox item code must be 100 characters or fewer.',
        }),
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
  const [noun = '', ...rest] = (description || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return {
    noun: noun.toUpperCase(),
    key_attributes: rest.join(', ').toUpperCase(),
  }
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
    other_specs: values.other_specs.length
      ? values.other_specs.join('; ')
      : null,
    tech_specs_pdf_path: values.tech_specs_pdf_path || null,
  }
  if (includePassword) payload.confirm_password = values.confirm_password
  return payload
}

// Server field names → form field names.
const SERVER_FIELD_MAP = {
  category_key: 'commodity',
  password: 'confirm_password',
}

// Order and wording used by the error summary; matches the order fields appear on screen.
const FIELD_LABELS = {
  noun: 'Noun',
  type: 'Type',
  material_composition: 'Material / composition',
  key_attributes: 'Key attributes',
  size: 'Size',
  uom: 'Unit of measure',
  commodity: 'UNSPSC commodity',
  internal_category_id: 'Internal category',
  bizbox_item_code: 'BizBox item code',
  philgeps_code: 'PhilGEPS code',
  other_specs: 'Other specifications',
  tech_specs_pdf_path: 'Technical specification PDF',
  confirm_password: 'Account password',
}
const FIELD_ORDER = Object.keys(FIELD_LABELS)

/** Moves focus to the first control inside the field wrapper marked data-field={name}. */
function focusField(name) {
  const wrapper = document.querySelector(`[data-field="${name}"]`)
  // FormControl gives the labelled control an id ending in -form-item; fall back to the first focusable element.
  const target =
    wrapper?.querySelector('[id$="-form-item"]') ||
    wrapper?.querySelector(
      'input:not([type=hidden]):not(.sr-only), button, textarea, [tabindex]:not([tabindex="-1"])'
    )
  wrapper?.scrollIntoView({ block: 'center' })
  target?.focus({ preventScroll: true })
}

function SectionCard({ title, description, optional, children, headingId }) {
  return (
    <Card className="gap-4" role="group" aria-labelledby={headingId}>
      <CardHeader>
        <CardTitle
          className="flex flex-wrap items-center gap-2 text-base"
          id={headingId}
        >
          {title}
          {optional && (
            <Badge variant="secondary" className="font-normal">
              Optional
            </Badge>
          )}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function NamingField({
  control,
  name,
  label,
  placeholder,
  description,
  required,
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem data-field={name}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl required={required}>
            {/* Displayed and saved in uppercase; the typed value is left alone so the caret never jumps. */}
            <Input
              {...field}
              placeholder={placeholder}
              autoComplete="off"
              autoCapitalize="characters"
              className="uppercase placeholder:normal-case"
            />
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
        if (err?.name !== 'AbortError')
          setAudit({ status: 'error', data: null })
      })
    return () => controller.abort()
  }, [debounced])

  if (audit.status === 'idle') return null
  if (audit.status === 'error') {
    return (
      <p className="text-muted-foreground text-xs">
        Naming guidance is unavailable right now. You can still save.
      </p>
    )
  }
  if (!audit.data) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />{' '}
        Checking naming standard…
      </p>
    )
  }

  const {
    is_valid: valid,
    score,
    feedback = [],
    similar_items: allSimilar = [],
  } = audit.data
  // In edit mode the product being edited is not a duplicate of itself.
  const similar = allSimilar.filter(
    (item) => String(item.id) !== String(excludeId)
  )
  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {valid ? (
          <CircleCheck className="text-success size-4" aria-hidden="true" />
        ) : (
          <TriangleAlert className="text-warning size-4" aria-hidden="true" />
        )}
        <span className="font-medium">
          {valid ? 'Meets the naming standard' : 'Naming can be improved'}
        </span>
        <Badge variant="outline">Score {score}%</Badge>
        {audit.status === 'loading' && (
          <LoaderCircle
            className="text-muted-foreground size-3.5 animate-spin"
            aria-label="Updating"
          />
        )}
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
                  <a
                    href={`/products/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-2"
                  >
                    {item.item_description}
                  </a>{' '}
                  <span className="font-mono text-xs">
                    {item.erp_item_code}
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Warns when another product already uses this BizBox code. The server does not enforce
 * uniqueness, so this is advice, not a block. Uses the existing list search (GET /products?search=).
 */
function BizboxDuplicateCheck({ code, excludeId }) {
  const term = useDebouncedValue(code.trim(), 500)
  const [state, setState] = useState({ term: null, matches: [] })

  useEffect(() => {
    if (term.length < 3) return undefined
    const controller = new AbortController()
    api
      .getProducts(
        { search: term, per_page: 10 },
        { signal: controller.signal }
      )
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : []
        const matches = rows.filter(
          (p) =>
            (p.bizbox_item_code || '').trim().toLowerCase() ===
              term.toLowerCase() && String(p.id) !== String(excludeId)
        )
        setState({ term, matches })
      })
      .catch(() => {
        // Advisory only: a failed check never blocks saving.
      })
    return () => controller.abort()
  }, [term, excludeId])

  if (term.length < 3 || state.term !== term || state.matches.length === 0)
    return null
  return (
    <Alert variant="warning" role="status" className="mt-2">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>BizBox code already in use</AlertTitle>
      <AlertDescription>
        <ul className="space-y-1">
          {state.matches.slice(0, 3).map((p) => (
            <li key={p.id} className="break-words">
              <a
                href={`/products/${p.id}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-2"
              >
                {p.item_description}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>{' '}
              <span className="font-mono text-xs">{p.erp_item_code}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1">Check this is not the same item before saving.</p>
      </AlertDescription>
    </Alert>
  )
}

function ErrorSummary({ errors, message, errorRef }) {
  const entries = FIELD_ORDER.filter((name) => errors[name])
  if (!message && entries.length === 0) return null
  return (
    <Alert
      variant="destructive"
      ref={errorRef}
      tabIndex={-1}
      className="outline-none"
    >
      <CircleAlert aria-hidden="true" />
      <AlertTitle>
        {entries.length
          ? `Not saved: ${entries.length} ${entries.length === 1 ? 'field needs' : 'fields need'} attention`
          : 'Not saved'}
      </AlertTitle>
      <AlertDescription>
        {message && <p>{message}</p>}
        {entries.length > 0 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {entries.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="text-left underline underline-offset-2"
                  onClick={() => focusField(name)}
                >
                  {FIELD_LABELS[name]}
                </button>
                : {errors[name]?.message}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
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
      .then(
        (res) =>
          active &&
          setState({ status: 'success', code: res?.erp_item_code || '' })
      )
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
        : state.code ||
          (ready
            ? 'Could not preview the code'
            : 'Select a commodity and internal category')

  return (
    <div className="grid gap-2">
      <Label htmlFor="erp-code">ERP item code</Label>
      <div className="relative">
        <Lock
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          id="erp-code"
          readOnly
          value={value}
          className="pl-9 font-mono"
          aria-describedby="erp-code-help"
        />
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
    if (parts.length)
      onChange([...value, ...parts.filter((p) => !value.includes(p))])
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
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={!draft.trim()}
        >
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>
      <p id="spec-help" className="text-muted-foreground text-xs">
        Optional notes such as Sterile, Heavy duty or CE certified. Press Enter
        to add each one. Saved separated by semicolons.
      </p>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Added specifications">
          {value.map((spec) => (
            <li key={spec}>
              <Badge
                variant="secondary"
                className="h-7 max-w-full gap-1 pr-1 pl-2.5"
              >
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
  const [file, setFile] = useState(() =>
    path ? { name: path.split('/').pop(), url: initialUrl || '' } : null
  )

  const handleFile = async (e) => {
    const selected = e.target.files?.[0]
    e.target.value = ''
    if (!selected) return
    if (
      selected.type !== 'application/pdf' &&
      !selected.name.toLowerCase().endsWith('.pdf')
    ) {
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
      setFile({
        name: res.original_filename || selected.name,
        url: res.file_url,
      })
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
          <FileText
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
          {file.url ? (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 text-sm font-medium break-all underline-offset-2 hover:underline"
            >
              {file.name}
            </a>
          ) : (
            <span className="min-w-0 flex-1 text-sm break-all">
              {file.name}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
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
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Upload aria-hidden="true" />
            )}
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </Button>
        </div>
      )}
      <p id="pdf-help" className="text-muted-foreground text-xs">
        Optional manufacturer brochure or datasheet, up to 20 MB. It uploads
        immediately and is linked when you save.
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
export function ProductForm({
  mode,
  product,
  prefillDescription,
  requirePassword = false,
  onSubmit,
  onCancel,
}) {
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const units = useUnits()
  const errorRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(buildSchema({ requirePassword })),
    defaultValues: defaultsFrom(
      product,
      prefillDescription ? prefillFrom(prefillDescription) : null
    ),
    mode: 'onTouched',
    // Focus goes to the error summary instead, which links to each invalid field.
    shouldFocusError: false,
  })
  const { control, handleSubmit, setError, formState } = form

  const naming = useWatch({
    control,
    name: ['noun', 'type', 'material_composition', 'key_attributes', 'size'],
  })
  const builtName = buildStandardName({
    noun: naming[0],
    type: naming[1],
    material_composition: naming[2],
    key_attributes: naming[3],
    size: naming[4],
  })
  const [
    commodity,
    internalCategoryId,
    uom,
    bizboxCode,
    otherSpecs,
    pdfPath,
    password,
  ] = useWatch({
    control,
    name: [
      'commodity',
      'internal_category_id',
      'uom',
      'bizbox_item_code',
      'other_specs',
      'tech_specs_pdf_path',
      'confirm_password',
    ],
  })

  // Required-field progress shown next to the save button.
  const required = [
    naming[0]?.trim(),
    uom,
    commodity,
    internalCategoryId !== null && internalCategoryId !== '',
    bizboxCode?.trim(),
    ...(requirePassword ? [password] : []),
  ]
  const remaining = required.filter((v) => !v).length

  const unitOptions =
    units.some((u) => u.toLowerCase() === (product?.uom || '').toLowerCase()) ||
    !product?.uom
      ? units
      : [product.uom, ...units]

  const showSummary = formState.submitCount > 0 && !formState.isSubmitting
  // Each failed submit ends with showSummary turning true; move focus to the summary then.
  useEffect(() => {
    if (showSummary) errorRef.current?.focus()
  }, [showSummary])

  const submit = handleSubmit(
    async (values) => {
      setFormError('')
      try {
        setSaved(true) // lets the unsaved-changes guard allow the post-save navigation
        await onSubmit(toPayload(values, { includePassword: requirePassword }))
      } catch (err) {
        setSaved(false)
        const fieldErrors =
          err?.errors && typeof err.errors === 'object'
            ? Object.entries(err.errors)
            : []
        let mapped = 0
        fieldErrors.forEach(([key, messages]) => {
          const name = SERVER_FIELD_MAP[key] || key
          if (name in form.getValues()) {
            setError(name, {
              type: 'server',
              message: Array.isArray(messages) ? messages[0] : String(messages),
            })
            mapped += 1
          }
        })
        if (mapped === 0 || fieldErrors.length > mapped) {
          setFormError(
            err?.status === 0 || err instanceof TypeError
              ? 'The catalogue server could not be reached. Your entries are kept; check the connection and try again.'
              : err?.status >= 500
                ? `The server could not save the product (${err.message || `error ${err.status}`}). Your entries are kept; try again.`
                : err?.message ||
                  'The product could not be saved. Your entries are kept; try again.'
          )
        }
      }
    },
    // Invalid: the error summary lists each field with a link to it.
    () => setFormError('')
  )

  return (
    <Form {...form}>
      <UnsavedChangesGuard when={formState.isDirty && !saved} />
      <form
        onSubmit={submit}
        noValidate
        className="space-y-6"
        aria-busy={formState.isSubmitting}
      >
        {showSummary && (
          <ErrorSummary
            errors={formState.errors}
            message={formError}
            errorRef={errorRef}
          />
        )}

        <SectionCard
          headingId="section-name"
          title="1. Standard item name"
          description="Built from these parts in order and saved in uppercase. Only the noun is required."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NamingField
              control={control}
              name="noun"
              label="Noun"
              placeholder="e.g. Gloves, Paper"
              description="The generic item name, e.g. GLOVES."
              required
            />
            <NamingField
              control={control}
              name="type"
              label="Type"
              placeholder="e.g. Examination, Bond"
              description="Sub-classification or form."
            />
            <NamingField
              control={control}
              name="material_composition"
              label="Material / composition"
              placeholder="e.g. Nitrile"
              description="Active ingredient or material."
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <NamingField
                control={control}
                name="key_attributes"
                label="Key attributes"
                placeholder="e.g. Powder-free, Non-sterile"
                description="Properties, colour or mechanism. Separate several with commas."
              />
            </div>
            <NamingField
              control={control}
              name="size"
              label="Size"
              placeholder="e.g. Medium, A4"
              description="Dimensions or size."
            />
            <FormField
              control={control}
              name="uom"
              render={({ field }) => (
                <FormItem data-field="uom">
                  <FormLabel required>Unit of measure</FormLabel>
                  <FormControl required>
                    <UnitSelect
                      units={unitOptions}
                      value={field.value}
                      onChange={(u) => {
                        field.onChange(u)
                        field.onBlur()
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Hospital inventory unit. Type to search, e.g. box.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-muted/60 mt-5 space-y-3 rounded-lg border p-4">
            <p
              className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              id="built-name-label"
            >
              Item description preview
            </p>
            <p
              className={cn(
                'font-mono text-sm font-semibold break-words',
                !builtName && 'text-muted-foreground font-normal'
              )}
              aria-labelledby="built-name-label"
            >
              {builtName ||
                'Fill in the noun and other parts to see the description.'}
            </p>
            <NamingAudit description={builtName} excludeId={product?.id} />
          </div>
        </SectionCard>

        <SectionCard
          headingId="section-classification"
          title="2. Classification"
          description="Choose the UNSPSC commodity that describes the item, then ZCMC's internal category. Both are required and together set the ERP code."
        >
          <div className="grid gap-5">
            <FormField
              control={control}
              name="commodity"
              render={({ field }) => (
                <FormItem data-field="commodity">
                  <FormLabel required>UNSPSC commodity</FormLabel>
                  <FormDescription>
                    Search by words, the item name or the 8-digit code, or
                    browse Segment → Family → Class. Results are ranked by
                    matching rules and show why they matched; you make the final
                    choice.
                  </FormDescription>
                  <FormControl required>
                    <UnspscClassifier
                      value={field.value}
                      hint={builtName || naming[0]}
                      excludeProductId={product?.id}
                      onChange={(c) => {
                        field.onChange(c)
                        field.onBlur()
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="internal_category_id"
                render={({ field }) => (
                  <FormItem data-field="internal_category_id">
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
                    <FormDescription>
                      ZCMC institutional category, e.g. OF-SUP.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ErpCodePreview
                mode={mode}
                product={product}
                commodity={commodity}
                internalCategoryId={internalCategoryId}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          headingId="section-codes"
          title="3. System codes"
          description="Codes used by other hospital and government systems."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="bizbox_item_code"
              render={({ field }) => (
                <FormItem data-field="bizbox_item_code">
                  <FormLabel required>BizBox item code</FormLabel>
                  <FormControl required>
                    <Input
                      {...field}
                      placeholder="e.g. BZ-MED-001"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormDescription>
                    Code from the BizBox hospital system.
                  </FormDescription>
                  <FormMessage />
                  <BizboxDuplicateCheck
                    code={field.value || ''}
                    excludeId={product?.id}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="philgeps_code"
              render={({ field }) => (
                <FormItem data-field="philgeps_code">
                  <FormLabel>PhilGEPS code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 14111507-PP-M01"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Look it up in the{' '}
                    <a
                      href={PHILGEPS_DIRECTORY_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center gap-0.5 font-medium underline underline-offset-2"
                    >
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

        <Collapsible
          defaultOpen={Boolean(
            product?.other_specs || product?.tech_specs_pdf_path
          )}
        >
          <Card className="gap-0 py-0">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group flex w-full items-center justify-between gap-3 rounded-xl px-6 py-5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span>
                  <span className="flex flex-wrap items-center gap-2 text-base font-semibold">
                    4. Specifications
                    <Badge variant="secondary" className="font-normal">
                      Optional
                    </Badge>
                  </span>
                  <span className="text-muted-foreground block text-sm">
                    {otherSpecs.length || pdfPath
                      ? [
                          otherSpecs.length &&
                            `${otherSpecs.length} specification${otherSpecs.length === 1 ? '' : 's'}`,
                          pdfPath && 'PDF attached',
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : 'Extra notes and a manufacturer datasheet.'}
                  </span>
                </span>
                <ChevronDown
                  className="text-muted-foreground size-5 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-6 px-6 pb-6">
                <FormField
                  control={control}
                  name="other_specs"
                  render={({ field }) => (
                    <div data-field="other_specs">
                      <SpecsField
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  )}
                />
                <FormField
                  control={control}
                  name="tech_specs_pdf_path"
                  render={({ field }) => (
                    <div data-field="tech_specs_pdf_path">
                      <PdfField
                        path={field.value}
                        initialUrl={product?.tech_specs_pdf_url}
                        onChange={(v) => field.onChange(v)}
                      />
                    </div>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {requirePassword && (
          <SectionCard
            headingId="section-confirm"
            title="Confirm it's you"
            description="End users must enter their account password to change an existing product. The server checks it before saving."
          >
            <FormField
              control={control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem className="max-w-sm" data-field="confirm_password">
                  <FormLabel required>Account password</FormLabel>
                  <div className="relative">
                    <FormControl required>
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className="pr-10"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1/2 right-0.5 -translate-y-1/2"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" />
                      ) : (
                        <Eye aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>
        )}

        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t px-4 py-2.5 sm:py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-lg sm:border">
          <p
            className="text-muted-foreground text-xs sm:text-sm"
            aria-live="polite"
          >
            {remaining === 0 ? (
              <span className="text-success inline-flex items-center gap-1.5">
                <CircleCheck className="size-4" aria-hidden="true" /> All
                required fields are filled.
              </span>
            ) : (
              `${remaining} required ${remaining === 1 ? 'field' : 'fields'} left`
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {formState.isSubmitting
                ? 'Saving…'
                : mode === 'edit'
                  ? 'Save product'
                  : 'Create product'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
