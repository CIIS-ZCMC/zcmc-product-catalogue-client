import { z } from 'zod'

import { emailSchema, newPasswordSchema } from '@/lib/auth'

// Contract: docs/ADMIN_USERS_API.md. The server stays authoritative for every rule below.
export const ROLES = [
  { value: 'encoder', label: 'Encoder', description: 'Registers and edits products in assigned internal categories.' },
  { value: 'admin', label: 'Administrator', description: 'Full access, including all categories, deletion and user management.' },
]

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export function userFullName(user) {
  return user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Unknown user'
}

/** Category ids assigned to a user resource, from either `internal_category_ids` or `internal_categories`. */
export function assignedIds(user) {
  if (Array.isArray(user?.internal_category_ids)) return user.internal_category_ids.map(Number)
  if (Array.isArray(user?.internal_categories)) return user.internal_categories.map((c) => Number(c.id))
  return []
}

export function buildUserSchema({ isEdit }) {
  return z
    .object({
      first_name: z.string().trim().min(1, 'Enter a first name.').max(255),
      last_name: z.string().trim().min(1, 'Enter a last name.').max(255),
      email: emailSchema,
      role: z.enum(['admin', 'encoder']),
      is_active: z.boolean(),
      internal_category_ids: z.array(z.number()),
      // Required when creating; when editing, blank keeps the current password.
      password: isEdit ? z.string() : newPasswordSchema,
      confirmPassword: z.string(),
    })
    .superRefine((v, ctx) => {
      if (v.role === 'encoder' && v.internal_category_ids.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['internal_category_ids'], message: 'Assign at least one internal category.' })
      }
      if (isEdit && v.password) {
        const parsed = newPasswordSchema.safeParse(v.password)
        if (!parsed.success) ctx.addIssue({ code: 'custom', path: ['password'], message: parsed.error.issues[0].message })
      }
      if (v.password !== v.confirmPassword) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' })
      }
    })
}

export function userDefaults(user) {
  return {
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    role: user?.is_admin ? 'admin' : 'encoder',
    is_active: user ? user.is_active !== false : true,
    internal_category_ids: assignedIds(user),
    password: '',
    confirmPassword: '',
  }
}

export function toUserPayload(values) {
  const isAdmin = values.role === 'admin'
  const payload = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim(),
    is_admin: isAdmin,
    is_active: values.is_active,
    // Administrators reach every category, so no assignment is stored for them.
    internal_category_ids: isAdmin ? [] : values.internal_category_ids,
  }
  if (values.password) {
    payload.password = values.password
    payload.password_confirmation = values.confirmPassword
  }
  return payload
}
