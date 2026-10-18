import { Ellipsis, Pencil, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { display, formatDate } from '@/lib/product'
import { userFullName } from '@/lib/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const MAX_BADGES = 3

function RoleBadge({ user }) {
  return <Badge variant={user.is_admin ? 'accent' : 'secondary'}>{user.is_admin ? 'Administrator' : 'Encoder'}</Badge>
}

function StatusBadge({ user }) {
  const active = user.is_active !== false
  return (
    <Badge variant="outline" className={active ? 'text-success' : 'text-muted-foreground'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}

function CategoryBadges({ user }) {
  if (user.is_admin) return <span className="text-muted-foreground text-sm">All categories</span>
  const categories = Array.isArray(user.internal_categories) ? user.internal_categories : []
  if (categories.length === 0) {
    return <span className="text-warning text-sm font-medium">None assigned</span>
  }
  const shown = categories.slice(0, MAX_BADGES)
  const rest = categories.slice(MAX_BADGES)
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Assigned internal categories">
      {shown.map((c) => (
        <li key={c.id}>
          <Badge variant="outline" className="font-mono" title={c.name}>
            {c.code}
          </Badge>
        </li>
      ))}
      {rest.length > 0 && (
        <li>
          <Badge variant="secondary" title={rest.map((c) => `${c.name} (${c.code})`).join(', ')}>
            +{rest.length} more
          </Badge>
        </li>
      )}
    </ul>
  )
}

function UserActions({ user, isSelf, onEdit, onDelete }) {
  const name = userFullName(user)
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(user)}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        {!isSelf && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(user)}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function YouBadge() {
  return (
    <Badge variant="outline" className="ml-2 align-middle">
      You
    </Badge>
  )
}

/** Table from md up, stacked cards below. */
export function UserList({ users, currentUserId, onEdit, onDelete, busy }) {
  return (
    <>
      <div className={cn('bg-card hidden rounded-xl border md:block', busy && 'opacity-60 transition-opacity')}>
        <Table>
          <caption className="sr-only">User accounts</caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead className="w-36">Role</TableHead>
              <TableHead className="w-64">Internal categories</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="hidden w-32 xl:table-cell">Added</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="whitespace-normal">
                  <span className="font-medium break-words">{userFullName(u)}</span>
                  {u.id === currentUserId && <YouBadge />}
                  <span className="text-muted-foreground block text-xs break-all">{display(u.email)}</span>
                </TableCell>
                <TableCell>
                  <RoleBadge user={u} />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <CategoryBadges user={u} />
                </TableCell>
                <TableCell>
                  <StatusBadge user={u} />
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm xl:table-cell">{formatDate(u.created_at)}</TableCell>
                <TableCell>
                  <UserActions user={u} isSelf={u.id === currentUserId} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className={cn('grid gap-3 md:hidden', busy && 'opacity-60 transition-opacity')} aria-label="User accounts">
        {users.map((u) => (
          <li key={u.id} className="bg-card grid gap-3 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium break-words">
                  {userFullName(u)}
                  {u.id === currentUserId && <YouBadge />}
                </p>
                <p className="text-muted-foreground text-xs break-all">{display(u.email)}</p>
              </div>
              <UserActions user={u} isSelf={u.id === currentUserId} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge user={u} />
              <StatusBadge user={u} />
            </div>
            <CategoryBadges user={u} />
          </li>
        ))}
      </ul>
    </>
  )
}
