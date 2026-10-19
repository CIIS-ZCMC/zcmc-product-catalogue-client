import { z } from 'zod'

// Mirrors the server's password policy; the server stays authoritative.
const SPECIAL_CHAR = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (value) => value.length >= 8,
  },
  {
    id: 'number',
    label: 'At least 1 number (0–9)',
    test: (value) => /\d/.test(value),
  },
  {
    id: 'special',
    label: 'At least 1 special character (!@#$%^&*…)',
    test: (value) => SPECIAL_CHAR.test(value),
  },
]

export const PASSWORD_HINT =
  'At least 8 characters, with 1 number and 1 special character.'

export const newPasswordSchema = z
  .string()
  .min(1, 'Enter a password.')
  .refine(
    (value) => PASSWORD_RULES.every((rule) => rule.test(value)),
    PASSWORD_HINT
  )

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .pipe(z.email('Enter a valid email address.'))

/**
 * Maps Laravel 422 field errors (err.errors) onto react-hook-form fields.
 * `fieldMap` renames server keys (e.g. password_confirmation -> confirmPassword).
 * Returns the message to show above the form, or '' when every error landed on a field.
 */
export function applyServerErrors(form, err, fieldMap = {}) {
  const entries =
    err?.errors && typeof err.errors === 'object'
      ? Object.entries(err.errors)
      : []
  const values = form.getValues()
  let mapped = 0

  entries.forEach(([key, messages], index) => {
    const name = fieldMap[key] || key
    if (!(name in values)) return
    form.setError(
      name,
      {
        type: 'server',
        message: Array.isArray(messages) ? messages[0] : String(messages),
      },
      { shouldFocus: index === 0 }
    )
    mapped += 1
  })

  if (entries.length > 0 && mapped === entries.length) return ''
  if (err instanceof TypeError)
    return 'The catalogue server could not be reached. Check the connection and try again.'
  return err?.message || 'Something went wrong. Try again.'
}
