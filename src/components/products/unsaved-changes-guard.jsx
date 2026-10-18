import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Asks before in-app navigation or a tab close would discard unsaved form input.
 * With `draftSaved` the wording says the entries are kept as a draft on this device.
 */
export function UnsavedChangesGuard({ when, draftSaved = false }) {
  const leavingRef = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!when) return undefined
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [when])

  return (
    <AlertDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        // Closing via "Discard changes" must not cancel the navigation it just started.
        if (!open && !leavingRef.current) blocker.reset?.()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{draftSaved ? 'Leave this form?' : 'Discard unsaved changes?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {draftSaved
              ? 'Your entries are not saved to the catalogue yet. They are kept as a draft on this device, and will be restored when you open this form again.'
              : 'You have entries on this form that are not saved. If you leave now, they will be lost.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              leavingRef.current = true
              blocker.proceed?.()
            }}
          >
            {draftSaved ? 'Leave, keep draft' : 'Discard changes'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
