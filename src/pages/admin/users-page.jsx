import { useId, useState } from 'react'
import { CircleAlert, Lock, RefreshCw, Search, SearchX, UserPlus, UsersRound, X } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/context/auth-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useUsers } from '@/hooks/use-users'
import { STATUS_OPTIONS, ROLES, userFullName } from '@/lib/users'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InternalCategoryCombobox } from '@/components/products/internal-category-combobox'
import { ListPagination } from '@/components/products/list-pagination'
import { ListState } from '@/components/products/list-state'
import { DeleteUserDialog } from '@/components/users/delete-user-dialog'
import { UserFormDialog } from '@/components/users/user-form-dialog'
import { UserList } from '@/components/users/user-list'
import { PageFallback } from '../route-fallbacks'

const ALL = 'all'
const DEFAULT_QUERY = { search: '', role: ALL, status: ALL, internal_category_id: '', page: 1, per_page: 15 }

/** Administrator screen: create accounts and manage roles and the internal categories each encoder may work in. */
export default function UsersPage() {
  const { isAdmin, currentUser } = useAuth()
  const id = useId()
  const [filters, setFilters] = useState(DEFAULT_QUERY)
  const search = useDebouncedValue(filters.search.trim(), 300)
  const [editor, setEditor] = useState({ open: false, user: null, key: 0 })
  const [deleting, setDeleting] = useState(null)

  const query = {
    search,
    role: filters.role === ALL ? '' : filters.role,
    status: filters.status === ALL ? '' : filters.status,
    internal_category_id: filters.internal_category_id,
    page: filters.page,
    per_page: filters.per_page,
  }
  const { status, users, meta, error, reload } = useUsers(isAdmin ? query : null)

  const update = (patch) => setFilters((f) => ({ ...f, page: 1, ...patch }))
  const hasFilters =
    filters.search !== '' || filters.role !== ALL || filters.status !== ALL || filters.internal_category_id !== ''

  const openEditor = (user = null) => setEditor((e) => ({ open: true, user, key: e.key + 1 }))

  // The server rejects non-administrators too; this only avoids showing a screen they cannot use.
  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <ListState
          role="alert"
          headingLevel={1}
          icon={Lock}
          title="Administrators only"
          description="Managing accounts and access is limited to system administrators."
        />
      </div>
    )
  }

  const busy = status === 'refreshing'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <PageHeader
        title="Users & access"
        description="Create accounts and choose which internal categories each encoder can register and edit products in."
        actions={
          <Button onClick={() => openEditor()}>
            <UserPlus aria-hidden="true" />
            Add user
          </Button>
        }
      />

      <section aria-label="Filter users" className="bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1.5fr_auto]">
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-search`}>Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input
              id={`${id}-search`}
              type="search"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Name or email"
              className="pl-8"
            />
          </div>
        </div>
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-role`}>Role</Label>
          <Select value={filters.role} onValueChange={(v) => update({ role: v })}>
            <SelectTrigger id={`${id}-role`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-status`}>Status</Label>
          <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger id={`${id}-status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-category`}>Internal category</Label>
          <InternalCategoryCombobox
            id={`${id}-category`}
            value={filters.internal_category_id || null}
            onChange={(c) => update({ internal_category_id: c ? String(c.id) : '' })}
            placeholder="All internal categories"
          />
        </div>
        <div className="flex items-end">
          <Button variant="ghost" onClick={() => setFilters(DEFAULT_QUERY)} disabled={!hasFilters}>
            <X aria-hidden="true" />
            Clear
          </Button>
        </div>
      </section>

      {status === 'loading' && <PageFallback />}

      {status === 'error' && (
        <ListState
          role="alert"
          icon={CircleAlert}
          title={error?.status === 403 ? 'Access denied' : 'Users could not be loaded'}
          description={
            error?.status === 404
              ? 'The server does not provide the user management endpoints yet. See docs/ADMIN_USERS_API.md.'
              : error instanceof TypeError
                ? 'The catalogue server could not be reached. Check the connection and try again.'
                : error?.message
          }
        >
          {error?.status !== 403 && (
            <Button onClick={reload}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          )}
        </ListState>
      )}

      {(status === 'success' || status === 'refreshing') && users.length === 0 && (
        <ListState
          icon={hasFilters ? SearchX : UsersRound}
          title={hasFilters ? 'No users match these filters' : 'No users yet'}
          description={hasFilters ? 'Try a different search or clear the filters.' : 'Add the first account to get started.'}
        >
          {hasFilters ? (
            <Button variant="outline" onClick={() => setFilters(DEFAULT_QUERY)}>
              Clear filters
            </Button>
          ) : (
            <Button onClick={() => openEditor()}>
              <UserPlus aria-hidden="true" />
              Add user
            </Button>
          )}
        </ListState>
      )}

      {(status === 'success' || status === 'refreshing') && users.length > 0 && (
        <>
          <UserList users={users} currentUserId={currentUser?.id} busy={busy} onEdit={openEditor} onDelete={setDeleting} />
          <ListPagination
            meta={meta}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            onPerPageChange={(per_page) => setFilters((f) => ({ ...f, per_page, page: 1 }))}
          />
        </>
      )}

      <UserFormDialog
        key={editor.key}
        open={editor.open}
        user={editor.user}
        isSelf={Boolean(editor.user) && editor.user.id === currentUser?.id}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        onSaved={(saved, wasEdit) => {
          setEditor((e) => ({ ...e, open: false }))
          toast.success(wasEdit ? 'Account updated.' : 'Account created.')
          reload()
        }}
      />

      <DeleteUserDialog
        user={deleting}
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={(user) => {
          toast.success(`${userFullName(user)} was deleted.`)
          // Step back a page if the last row on this page was removed.
          if (users.length === 1 && filters.page > 1) setFilters((f) => ({ ...f, page: f.page - 1 }))
          else reload()
        }}
      />
    </div>
  )
}
