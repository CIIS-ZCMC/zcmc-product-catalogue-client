import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CircleCheck } from 'lucide-react'

import { api } from '@/services/api'
import { applyServerErrors, emailSchema, newPasswordSchema, PASSWORD_HINT } from '@/lib/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormError, SubmitButton } from './auth-forms'
import { PasswordChecklist, PasswordInput } from './password-input'

const requestSchema = z.object({ email: emailSchema })

const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from the email.'),
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Re-type the new password.'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })

/**
 * Two steps: request a 6-digit code by email, then set a new password with it.
 * Mount with a fresh `key` each time it opens so it starts at step 1.
 */
export function ResetPasswordDialog({ open, onOpenChange, defaultEmail = '', onReset }) {
  const [email, setEmail] = useState(null) // set once a code has been sent
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {email ? (
              <>
                Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong>, then choose a new
                password.
              </>
            ) : (
              'Enter your registered email address and we will email you a 6-digit code.'
            )}
          </DialogDescription>
        </DialogHeader>

        {notice && (
          <Alert>
            <CircleCheck className="text-success" aria-hidden="true" />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        {email ? (
          <ResetStep
            email={email}
            onBusyChange={setBusy}
            onResend={(message) => setNotice(message)}
            onChangeEmail={() => {
              setNotice('')
              setEmail(null)
            }}
            onDone={onReset}
          />
        ) : (
          <RequestStep
            defaultEmail={defaultEmail}
            onBusyChange={setBusy}
            onSent={(sentTo, message) => {
              setNotice(message)
              setEmail(sentTo)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RequestStep({ defaultEmail, onBusyChange, onSent }) {
  const [formError, setFormError] = useState('')
  const form = useForm({ resolver: zodResolver(requestSchema), defaultValues: { email: defaultEmail } })

  const submit = form.handleSubmit(async ({ email }) => {
    setFormError('')
    onBusyChange(true)
    try {
      const res = await api.forgotPassword(email)
      onSent(email, res?.message || 'A verification code was sent to your email.')
    } catch (err) {
      setFormError(applyServerErrors(form, err))
    } finally {
      onBusyChange(false)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormError message={formError} />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Email address</FormLabel>
              <FormControl required>
                <Input type="email" autoComplete="email" placeholder="name@zcmc.gov.ph" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Sending code…">
          Send code
        </SubmitButton>
      </form>
    </Form>
  )
}

function ResetStep({ email, onBusyChange, onResend, onChangeEmail, onDone }) {
  const [formError, setFormError] = useState('')
  const [resending, setResending] = useState(false)
  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  })
  const password = useWatch({ control: form.control, name: 'password' })
  const pending = form.formState.isSubmitting

  const submit = form.handleSubmit(async (values) => {
    setFormError('')
    onBusyChange(true)
    try {
      await api.resetPassword({
        email,
        code: values.code,
        password: values.password,
        password_confirmation: values.confirmPassword,
      })
      onDone(email)
    } catch (err) {
      setFormError(applyServerErrors(form, err, { password_confirmation: 'confirmPassword' }))
    } finally {
      onBusyChange(false)
    }
  })

  const resend = async () => {
    setFormError('')
    setResending(true)
    try {
      const res = await api.forgotPassword(email)
      onResend(res?.message || 'A new verification code was sent.')
    } catch (err) {
      setFormError(err?.message || 'The code could not be resent. Try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormError message={formError} />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Verification code</FormLabel>
              <FormControl required>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-[0.3em]"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>New password</FormLabel>
              <FormControl required>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              {password ? <PasswordChecklist value={password} /> : <FormDescription>{PASSWORD_HINT}</FormDescription>}
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

        <div className="flex items-center justify-between gap-2 text-sm">
          <Button type="button" variant="link" className="h-auto p-0" onClick={resend} disabled={resending || pending}>
            {resending ? 'Sending…' : 'Resend code'}
          </Button>
          <Button
            type="button"
            variant="link"
            className="text-muted-foreground h-auto p-0"
            onClick={onChangeEmail}
            disabled={resending || pending}
          >
            Use a different email
          </Button>
        </div>

        <SubmitButton pending={pending} pendingLabel="Resetting…">
          Reset password
        </SubmitButton>
      </form>
    </Form>
  )
}
