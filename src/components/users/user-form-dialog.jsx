import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { api } from '@/services/api'
import { applyServerErrors } from '@/lib/auth'
import { buildUserSchema, ROLES, toUserPayload, userDefaults, userFullName } from '@/lib/users'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormError, SubmitButton } from '@/components/auth/auth-forms'
import { CategoryChecklist } from './category-checklist'

const FIELD_MAP = {
  is_admin: 'role',
}

/**
 * Add / Edit user dialog.
 * When adding a user, the initial password is automatically generated on the backend and emailed to the user.
 * Users manage their own passwords upon login.
 */
export function UserFormDialog({ open, onOpenChange, user = null, isSelf = false, onSaved }) {
  const isEdit = Boolean(user)
  const [formError, setFormError] = useState('')

  const form = useForm({ resolver: zodResolver(buildUserSchema()), defaultValues: userDefaults(user) })
  const role = useWatch({ control: form.control, name: 'role' })
  const pending = form.formState.isSubmitting

  const submit = form.handleSubmit(async (values) => {
    setFormError('')
    try {
      const payload = toUserPayload(values)
      const res = isEdit ? await api.updateUser(user.id, payload) : await api.createUser(payload)
      onSaved(res?.data ?? null, isEdit)
    } catch (err) {
      setFormError(applyServerErrors(form, err, FIELD_MAP))
    }
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${userFullName(user)}` : 'Add user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Change the account details, role or assigned internal categories.'
              : 'Create an account and assign privileges. An initial password will be automatically generated and emailed to the user.'}
          </DialogDescription>
        </DialogHeader>

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
                      <Input autoComplete="off" {...field} />
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
                      <Input autoComplete="off" {...field} />
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
                    <Input type="email" autoComplete="off" placeholder="name@zcmc.gov.ph" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                    <FormControl required>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isSelf
                      ? 'You cannot change your own role.'
                      : ROLES.find((r) => r.value === field.value)?.description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === 'encoder' ? (
              <FormField
                control={form.control}
                name="internal_category_ids"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel required>Assigned internal categories</FormLabel>
                    <FormControl required>
                      <CategoryChecklist value={field.value} onChange={field.onChange} invalid={Boolean(fieldState.error)} />
                    </FormControl>
                    <FormDescription>
                      The encoder can create and edit products only in these categories. They can still view all products.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
                Administrators can work in every internal category, so no assignment is needed.
              </p>
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} disabled={isSelf} />
                    </FormControl>
                    <div className="grid gap-1">
                      <FormLabel>Account is active</FormLabel>
                      <FormDescription>
                        {isSelf ? 'You cannot deactivate your own account.' : 'Inactive accounts cannot sign in.'}
                      </FormDescription>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <SubmitButton pending={pending} pendingLabel="Saving…" className="sm:w-auto">
                {isEdit ? 'Save changes' : 'Create user'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
