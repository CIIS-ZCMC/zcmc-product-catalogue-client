import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CircleAlert, LoaderCircle } from 'lucide-react'

import { api } from '@/services/api'
import { useAuth } from '@/context/auth-context'
import { display, formatDate, formatPeso } from '@/lib/product'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceChange } from './price-change'

// Server stores prices as decimal(12,2) in the history table.
const MAX_PRICE = 9999999999.99

function buildSchema(requirePassword) {
  return z
    .object({
      unit_price: z
        .string()
        .trim()
        .min(1, { message: 'Enter the new unit price.' })
        .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), { message: 'Use a number with up to 2 decimal places, for example 125.50.' })
        .refine((v) => Number(v) <= MAX_PRICE, { message: 'That price is too large.' }),
      price_change_reason: z.string().trim().max(255, { message: 'Reason must be 255 characters or fewer.' }),
      confirm_password: z.string(),
    })
    .superRefine((v, ctx) => {
      if (requirePassword && !v.confirm_password) {
        ctx.addIssue({ code: 'custom', path: ['confirm_password'], message: 'Enter your account password to save.' })
      }
    })
}

function PriceHistory({ productId }) {
  const [state, setState] = useState({ status: 'loading', rows: [] })
  const [token, setToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', rows: [] })
    api
      .getPriceHistory(productId, { signal: controller.signal })
      .then((res) => setState({ status: 'success', rows: Array.isArray(res?.history) ? res.history : [] }))
      .catch((e) => e?.name !== 'AbortError' && setState({ status: 'error', rows: [] }))
    return () => controller.abort()
  }, [productId, token])

  if (state.status === 'loading') return <Skeleton className="h-16 w-full" />
  if (state.status === 'error') {
    return (
      <p className="text-muted-foreground text-sm" role="alert">
        Price history could not be loaded.{' '}
        <button type="button" className="text-primary underline" onClick={() => setToken((n) => n + 1)}>
          Try again
        </button>
      </p>
    )
  }
  if (state.rows.length === 0) return <p className="text-muted-foreground text-sm">No price changes recorded yet.</p>
  return (
    <ol className="max-h-44 space-y-2 overflow-y-auto pr-1 text-sm">
      {state.rows.map((h) => (
        <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b pb-2 last:border-0">
          <span className="font-medium tabular-nums">{formatPeso(h.new_price)}</span>
          <span className="text-muted-foreground text-xs">{formatDate(h.effective_date)}</span>
          <span className="basis-full text-xs">
            <PriceChange entry={h} />
            {h.reason ? <span className="text-muted-foreground"> · {display(h.reason)}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Updates a product's unit price through PUT /products/:id. The server records the change in the
 * price history and requires bizbox_item_code and uom on every update, so the current values are resent.
 */
export function PriceEditDialog({ product, open, onOpenChange, onSaved }) {
  const { isAdmin } = useAuth()
  const [formError, setFormError] = useState('')
  const form = useForm({
    resolver: zodResolver(buildSchema(!isAdmin)),
    defaultValues: { unit_price: '', price_change_reason: '', confirm_password: '' },
    mode: 'onTouched',
  })

  useEffect(() => {
    if (open && product) {
      form.reset({
        unit_price: product.unit_price !== null && product.unit_price !== undefined ? Number(product.unit_price).toFixed(2) : '',
        price_change_reason: '',
        confirm_password: '',
      })
      setFormError('')
    }
  }, [open, product, form])

  const submit = form.handleSubmit(async (values) => {
    setFormError('')
    const payload = {
      bizbox_item_code: product.bizbox_item_code,
      uom: product.uom,
      unit_price: Number(values.unit_price),
      price_change_reason: values.price_change_reason || null,
    }
    if (!isAdmin) payload.confirm_password = values.confirm_password
    try {
      await api.updateProduct(product.id, payload)
      onOpenChange(false)
      onSaved?.(product, Number(values.unit_price))
    } catch (err) {
      const entries = err?.errors && typeof err.errors === 'object' ? Object.entries(err.errors) : []
      let mapped = 0
      entries.forEach(([key, msgs]) => {
        const name = key === 'password' ? 'confirm_password' : key
        if (name in values) {
          form.setError(name, { type: 'server', message: Array.isArray(msgs) ? msgs[0] : String(msgs) })
          mapped += 1
        }
      })
      if (mapped === 0 || entries.length > mapped) setFormError(err?.message || 'The price could not be saved. Try again.')
    }
  })

  const submitting = form.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update unit price</DialogTitle>
          <DialogDescription className="break-words">
            {display(product?.item_description)}
            <span className="mt-1 block font-mono text-xs break-all">{display(product?.erp_item_code)}</span>
          </DialogDescription>
        </DialogHeader>

        {product && (
          <p className="text-sm">
            Current price: <span className="font-semibold tabular-nums">{formatPeso(product.unit_price)}</span> per{' '}
            {display(product.uom)}
          </p>
        )}

        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            {formError && (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>New unit price (PHP)</FormLabel>
                  <FormControl required>
                    <Input {...field} inputMode="decimal" autoComplete="off" placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_change_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for change</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" placeholder="e.g. New supplier quotation" />
                  </FormControl>
                  <FormDescription>Optional. Saved in the price history.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isAdmin && (
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Account password</FormLabel>
                    <FormControl required>
                      <Input {...field} type="password" autoComplete="current-password" />
                    </FormControl>
                    <FormDescription>End users confirm their password to change an existing product.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {product && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Price history</h3>
                <PriceHistory productId={product.id} />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
                {submitting ? 'Saving…' : 'Save price'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
