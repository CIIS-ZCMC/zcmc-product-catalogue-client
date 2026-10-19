import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CircleAlert, Loader2 } from 'lucide-react'

import { api } from '@/services/api'
import {
  applyServerErrors,
  emailSchema,
  newPasswordSchema,
  PASSWORD_HINT,
} from '@/lib/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import { PasswordChecklist, PasswordInput } from './password-input'

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
})

const registerSchema = z
  .object({
    first_name: z.string().trim().min(1, 'Enter your first name.'),
    last_name: z.string().trim().min(1, 'Enter your last name.'),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Re-type your password.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
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

export function SubmitButton({ pending, children, pendingLabel }) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </Button>
  )
}

export function SignInForm({ defaultEmail = '', onSuccess, onForgotPassword }) {
  const [formError, setFormError] = useState('')
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: defaultEmail, password: '' },
  })
  const pending = form.formState.isSubmitting

  const submit = form.handleSubmit(async (values) => {
    setFormError('')
    try {
      const res = await api.login({
        email: values.email,
        password: values.password,
      })
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
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="name@zcmc.gov.ph"
                  {...field}
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
              <div className="flex items-center justify-between gap-2">
                <FormLabel required>Password</FormLabel>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() =>
                    onForgotPassword(form.getValues('email').trim())
                  }
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

export function RegisterForm({ onSuccess }) {
  const [formError, setFormError] = useState('')
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })
  const password = useWatch({ control: form.control, name: 'password' })
  const pending = form.formState.isSubmitting

  const submit = form.handleSubmit(async (values) => {
    setFormError('')
    try {
      const res = await api.register({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email,
        password: values.password,
        password_confirmation: values.confirmPassword,
      })
      onSuccess(res.user)
    } catch (err) {
      setFormError(
        applyServerErrors(form, err, {
          password_confirmation: 'confirmPassword',
        })
      )
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormError message={formError} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>First name</FormLabel>
                <FormControl required>
                  <Input autoComplete="given-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Last name</FormLabel>
                <FormControl required>
                  <Input autoComplete="family-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Email address</FormLabel>
              <FormControl required>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="name@zcmc.gov.ph"
                  {...field}
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
              <FormLabel required>Password</FormLabel>
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
              <FormLabel required>Confirm password</FormLabel>
              <FormControl required>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton pending={pending} pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </Form>
  )
}
