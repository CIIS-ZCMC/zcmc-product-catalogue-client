import { useState } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'

import { api } from '@/services/api'
import { userFullName } from '@/lib/users'
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

/** Confirms deleting an account. The server (DELETE /users/:id) refuses self-delete and the last administrator. */
export function DeleteUserDialog({ user, open, onOpenChange, onDeleted }) {
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
      await api.deleteUser(user.id)
      onOpenChange(false)
      onDeleted?.(user)
    } catch (err) {
      setError(err.message || 'The account could not be deleted. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this account?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <strong className="text-foreground">{userFullName(user)}</strong> ({user?.email}) will no longer be able
                to sign in. Their past activity stays in the activity log. To keep the account but block sign-in, set it
                to inactive instead.
              </p>
              {error && (
                <Alert variant="destructive" role="alert">
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {pending ? 'Deleting…' : 'Delete account'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
