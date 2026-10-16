import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronRight, CircleAlert, Copy, Ellipsis, ExternalLink, FileText, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/services/api'
import { useAuth } from '@/context/auth-context'
import { useProduct } from '@/hooks/use-product'
import { display, formatDate, formatPeso, internalCategoryLabel, PHILGEPS_DIRECTORY_URL, splitSpecs } from '@/lib/product'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteProductDialog } from '@/components/products/delete-product-dialog'
import { ListState } from '@/components/products/list-state'
import { PageFallback } from '../route-fallbacks'
import { useReturnTo } from '@/hooks/use-return-to'
import { BackLink } from './back-link'

function Field({ label, children, mono = false }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className={mono ? 'font-mono text-sm break-all' : 'text-sm break-words'}>{children}</dd>
    </div>
  )
}

function Section({ title, description, children, className }) {
  return (
    <Card className={className ? `gap-4 ${className}` : 'gap-4'}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function PriceChange({ entry }) {
  if (entry.old_price === null || entry.old_price === undefined) return <Badge variant="secondary">Initial price</Badge>
  const change = Number(entry.price_change) || 0
  if (change === 0) return <span className="text-muted-foreground">No change</span>
  const up = change > 0
  return (
    <span className={up ? 'text-destructive' : 'text-success'}>
      {up ? 'Up' : 'Down'} {formatPeso(Math.abs(change))} ({up ? '+' : ''}
      {entry.percentage_change}%)
    </span>
  )
}

function actorName(log) {
  const u = log.user
  if (u?.first_name) return `${u.first_name} ${u.last_name || ''}`.trim()
  return log.user_name || u?.email || log.user_email || 'System'
}

function ActivityHistory({ productId }) {
  const [state, setState] = useState({ status: 'loading', logs: [] })
  const [token, setToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', logs: [] })
    api
      .getProductActivityLogs(productId, { signal: controller.signal })
      .then((res) => setState({ status: 'success', logs: Array.isArray(res?.logs) ? res.logs : [] }))
      .catch((err) => {
        if (err?.name !== 'AbortError') setState({ status: 'error', logs: [] })
      })
    return () => controller.abort()
  }, [productId, token])

  if (state.status === 'loading') {
    return (
      <div className="space-y-3" aria-busy="true">
        <span className="sr-only">Loading activity…</span>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm" role="alert">
        <span className="text-muted-foreground">Activity history could not be loaded.</span>
        <Button variant="outline" size="sm" onClick={() => setToken((n) => n + 1)}>
          Try again
        </Button>
      </div>
    )
  }
  if (state.logs.length === 0) return <p className="text-muted-foreground text-sm">No activity recorded for this product yet.</p>

  return (
    <ol className="space-y-4">
      {state.logs.map((log) => (
        <li key={log.id} className="border-l-2 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[11px]">
              {log.action}
            </Badge>
            <time className="text-muted-foreground text-xs" dateTime={log.created_at}>
              {formatDate(log.created_at, true)}
            </time>
          </div>
          <p className="mt-1 text-sm break-words">{log.description}</p>
          <p className="text-muted-foreground text-xs">By {actorName(log)}</p>
        </li>
      ))}
    </ol>
  )
}

export default function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const { isAdmin } = useAuth()
  const { status, data, error, reload } = useProduct(id)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (status === 'loading') return <PageFallback />

  if (status === 'error') {
    const notFound = error?.status === 404
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <BackLink to={returnTo} />
        <ListState
          role="alert"
          headingLevel={1}
          icon={CircleAlert}
          title={notFound ? 'Product not found' : 'Product could not be loaded'}
          description={notFound ? 'It may have been deleted, or the link is wrong.' : error?.message}
        >
          {!notFound && (
            <Button onClick={reload}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={returnTo}>Back to products</Link>
          </Button>
        </ListState>
      </div>
    )
  }

  const product = data.product
  const hierarchy = data.category_hierarchy || product.category_hierarchy || []
  const priceHistory = data.price_history || []
  const specs = splitSpecs(product.other_specs)
  const linkState = { from: returnTo }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(product.erp_item_code)
      toast.success('ERP item code copied.')
    } catch {
      toast.error('Could not copy to the clipboard.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={display(product.item_description)}
        actions={
          <>
            <Button asChild>
              <Link to={`/products/${product.id}/edit`} state={linkState}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <Ellipsis aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {product.erp_item_code && (
                  <DropdownMenuItem onSelect={copyCode}>
                    <Copy aria-hidden="true" />
                    Copy ERP code
                  </DropdownMenuItem>
                )}
                {product.tech_specs_pdf_url && (
                  <DropdownMenuItem asChild>
                    <a href={product.tech_specs_pdf_url} target="_blank" rel="noreferrer">
                      <FileText aria-hidden="true" />
                      Open specification PDF
                    </a>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                      <Trash2 aria-hidden="true" />
                      Delete product
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        <BackLink to={returnTo} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-muted-foreground font-mono text-sm break-all">{display(product.erp_item_code)}</span>
          {product.internal_category_code && (
            <Badge variant="outline" className="font-mono">
              {product.internal_category_code}
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Section title="Standard name parts" description="The item description is built from these parts.">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Noun">{display(product.noun)}</Field>
              <Field label="Type">{display(product.type)}</Field>
              <Field label="Material / composition">{display(product.material_composition)}</Field>
              <Field label="Key attributes">{display(product.key_attributes)}</Field>
              <Field label="Size">{display(product.size)}</Field>
              <Field label="Unit of measure">{display(product.uom)}</Field>
            </dl>
          </Section>

          <Section title="Classification">
            <dl className="grid gap-4">
              <Field label="UNSPSC hierarchy">
                {hierarchy.length > 0 ? (
                  <ol className="flex flex-wrap items-center gap-x-1 gap-y-1" aria-label="UNSPSC hierarchy">
                    {hierarchy.map((h, i) => (
                      <li key={h.key ?? i} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="text-muted-foreground size-3.5" aria-hidden="true" />}
                        <span className={i === hierarchy.length - 1 ? 'font-medium' : 'text-muted-foreground'}>
                          {h.title}
                          {h.code && <span className="ml-1 font-mono text-xs">({h.code})</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  display(null)
                )}
              </Field>
              <Field label="Internal category">{internalCategoryLabel(product)}</Field>
            </dl>
          </Section>

          <Section title="Specifications">
            <dl className="grid gap-4">
              <Field label="Other specifications">
                {specs.length > 0 ? (
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {specs.map((s) => (
                      <li key={s}>
                        <Badge variant="secondary" className="whitespace-normal">
                          {s}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  display(null)
                )}
              </Field>
              <Field label="Technical specification PDF">
                {product.tech_specs_pdf_url ? (
                  <a
                    href={product.tech_specs_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary inline-flex items-center gap-1 font-medium break-all underline-offset-2 hover:underline"
                  >
                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                    {product.tech_specs_pdf_path?.split('/').pop() || 'Open PDF'}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : (
                  display(null)
                )}
              </Field>
            </dl>
          </Section>

          <Section title="Price history" description="Recorded by the server whenever the unit price changes.">
            {priceHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No price changes recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Effective</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead className="hidden sm:table-cell">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(h.effective_date)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">{formatPeso(h.new_price)}</TableCell>
                      <TableCell className="text-sm">
                        <PriceChange entry={h} />
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">{display(h.reason)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          <Section title="Activity history">
            <ActivityHistory productId={product.id} />
          </Section>
        </div>

        <aside className="order-first min-w-0 space-y-6 lg:order-none" aria-label="Codes and record details">
          <Section title="Codes">
            <dl className="grid gap-4">
              <Field label="ERP item code" mono>
                {display(product.erp_item_code)}
              </Field>
              <Field label="BizBox item code" mono>
                {display(product.bizbox_item_code)}
              </Field>
              <Field label="PhilGEPS code" mono>
                {product.philgeps_code ? (
                  <span className="inline-flex flex-wrap items-center gap-1">
                    {product.philgeps_code}
                    <a
                      href={PHILGEPS_DIRECTORY_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center rounded-sm p-0.5 font-sans"
                      aria-label="Open PS-PhilGEPS common-use items directory (new tab)"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </span>
                ) : (
                  display(null)
                )}
              </Field>
              <Field label="UNSPSC code" mono>
                {display(product.unspsc_code)}
              </Field>
            </dl>
          </Section>

          <Section title="Record">
            <dl className="grid gap-4">
              <Field label="Current unit price">{formatPeso(product.unit_price)}</Field>
              <Field label="Added">{formatDate(product.created_at, true)}</Field>
              <Field label="Last updated">{formatDate(product.updated_at, true)}</Field>
              <Field label="Catalogue ID" mono>
                #{product.id}
              </Field>
            </dl>
          </Section>
        </aside>
      </div>

      <DeleteProductDialog
        product={product}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          toast.success(`Deleted ${product.erp_item_code || 'product'}.`)
          navigate(returnTo, { replace: true })
        }}
      />
    </div>
  )
}
