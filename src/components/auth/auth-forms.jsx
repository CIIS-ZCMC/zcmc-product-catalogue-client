import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CircleAlert, Loader2 } from 'lucide-react'

import { api } from '@/services/api'
import { applyServerErrors, emailSchema } from '@/lib/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from './password-input'

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
})

export function FormError({ message }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function SubmitButton({ pending, children, pendingLabel, className = 'w-full' }) {
  return (
    <Button type="submit" className={className} disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </Button>
  )
}

export function SignInForm({ defaultEmail = '', onSuccess, onForgotPassword }) {
  const [formError, setFormError] = useState('')
  const form = useForm({ resolver: zodResolver(signInSchema), defaultValues: { email: defaultEmail, password: '' } })
  const pending = form.formState.isSubmitting

  const submit = form.handleSubmit(async (values) => {
    setFormError('')
    try {
      const res = await api.login({ email: values.email, password: values.password })
      onSuccess(res.user)
    } catch (err) {
      setFormError(applyServerErrors(form, err))
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel required>Password</FormLabel>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => onForgotPassword(form.getValues('email').trim())}
                >
                  Forgot password?
                </Button>
              </div>
              <FormControl required>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton pending={pending} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </Form>
  )
}
