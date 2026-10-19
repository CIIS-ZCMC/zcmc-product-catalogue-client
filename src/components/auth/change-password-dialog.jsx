import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, ShieldAlert, LogOut } from 'lucide-react'

import { api } from '@/services/api'
import { applyServerErrors, newPasswordSchema, PASSWORD_HINT } from '@/lib/auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { FormError, SubmitButton } from './auth-forms'
import { PasswordChecklist, PasswordInput } from './password-input'

const createSchema = (isFirstTime) =>
  z
    .object({
      current_password: isFirstTime ? z.string().optional() : z.string().min(1, 'Enter your current password.'),
      password: newPasswordSchema,
      confirmPassword: z.string().min(1, 'Confirm your new password.'),
    })
    .superRefine((v, ctx) => {
      if (!isFirstTime && v.current_password && v.password === v.current_password) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: 'Your new password cannot be the same as your current password.',
        })
      }
      if (v.password !== v.confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'Passwords do not match.',
        })
      }
    })

/**
 * Dialog for setting a permanent password.
 * On first-time login, the user is already authenticated via initial email password,
 * so they only need to enter and confirm their new permanent password.
 */
export function ChangePasswordDialog({
  open,
  onOpenChange,
  isFirstTime = false,
  user,
  onSuccess,
  onLogout,
}) {
  const [formError, setFormError] = useState('')
  const form = useForm({
    resolver: zodResolver(createSchema(isFirstTime)),
    defaultValues: {
      current_password: '',
      password: '',
      confirmPassword: '',
    },
  })

  const password = useWatch({ control: form.control, name: 'password' })
  const pending = form.formState.isSubmitting

  const handleOpenChange = (nextOpen) => {
    if (isFirstTime) return
    if (!pending && onOpenChange) {
      onOpenChange(nextOpen)
    }
  }

  const submit = form.handleSubmit(async (values) => {
    setFormError('')
    try {
      const payload = {
        password: values.password,
        password_confirmation: values.confirmPassword,
      }
      if (!isFirstTime && values.current_password) {
        payload.current_password = values.current_password
      }
      const res = await api.changePassword(payload)
      form.reset()
      if (onSuccess) {
        onSuccess(res?.user ?? null)
      }
      if (!isFirstTime && onOpenChange) {
        onOpenChange(false)
      }
    } catch (err) {
      setFormError(applyServerErrors(form, err, { password_confirmation: 'confirmPassword' }))
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (isFirstTime) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isFirstTime) e.preventDefault()
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <DialogTitle>
              {isFirstTime ? 'Set Your Permanent Password' : 'Change Password'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isFirstTime
              ? 'Welcome to the ZCMC Product Catalogue Portal. Please choose a new permanent password to complete your account setup.'
              : 'Choose a strong, unique password to keep your catalogue account secure.'}
          </DialogDescription>
        </DialogHeader>

        {isFirstTime && (
          <Alert className="border-teal-200 bg-teal-50/60 text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100">
            <ShieldAlert className="size-4 text-teal-600 dark:text-teal-400" />
            <AlertTitle className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              First-Time Sign-In Requirement
            </AlertTitle>
            <AlertDescription className="text-xs text-teal-800/90 dark:text-teal-200/90">
              Create your personal permanent password to activate your portal session.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <FormError message={formError} />

            {!isFirstTime && (
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Current password</FormLabel>
                    <FormControl required>
                      <PasswordInput autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>New permanent password</FormLabel>
                  <FormControl required>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  {password ? (
                    <PasswordChecklist value={password} />
                  ) : (
                    <FormDescription>{PASSWORD_HINT}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Confirm new password</FormLabel>
                  <FormControl required>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              {isFirstTime ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLogout}
                  disabled={pending}
                  className="gap-1.5"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
              )}

              <SubmitButton
                pending={pending}
                pendingLabel={isFirstTime ? 'Saving password...' : 'Updating...'}
                className="sm:w-auto"
              >
                {isFirstTime ? 'Set New Password & Continue' : 'Update Password'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
