import { useState } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'

import { api } from '@/services/api'
import { display } from '@/lib/product'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Confirms permanent deletion. The server (DELETE /products/:id) allows this for
 * administrators only and returns 403 otherwise; that message is shown here.
 */
export function DeleteProductDialog({ product, open, onOpenChange, onDeleted }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleOpenChange = (next) => {
    if (pending) return
    if (!next) setError('')
    onOpenChange(next)
  }

  const handleDelete = async () => {
    setPending(true)
    setError('')
    try {
      await api.deleteProduct(product.id)
      onOpenChange(false)
      onDeleted?.(product)
    } catch (err) {
      setError(err.message || 'The product could not be deleted. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this product?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This permanently removes the product from the catalogue. Its price history is deleted with it. This
                cannot be undone.
              </p>
              {product && (
                <dl className="bg-muted text-foreground grid gap-1 rounded-md p-3 text-sm">
                  <dt className="sr-only">Item description</dt>
                  <dd className="font-medium break-words">{display(product.item_description)}</dd>
                  <dt className="sr-only">ERP item code</dt>
                  <dd className="text-muted-foreground font-mono text-xs break-all">{display(product.erp_item_code)}</dd>
                </dl>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          {/* Plain Button (not AlertDialogAction) so the dialog stays open while the request runs or fails. */}
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {pending ? 'Deleting…' : 'Delete product'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
