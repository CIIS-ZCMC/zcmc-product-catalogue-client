import { Link } from 'react-router'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { commodityLabel, display, formatDate } from '@/lib/product'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductRowActions } from './product-row-actions'

function SortableHead({ label, field, sort, onSort, className }) {
  const active = sort.by === field
  const Icon = !active
    ? ArrowUpDown
    : sort.order === 'asc'
      ? ArrowUp
      : ArrowDown
  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="hover:text-foreground -mx-1 inline-flex items-center gap-1 rounded px-1 py-1 uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {label}
        <Icon
          className={cn('size-3.5', !active && 'opacity-50')}
          aria-hidden="true"
        />
        <span className="sr-only">
          {active
            ? `, sorted ${sort.order === 'asc' ? 'ascending' : 'descending'}`
            : ', not sorted'}
        </span>
      </button>
    </TableHead>
  )
}

/** Desktop and tablet listing (md and up). Secondary columns drop out below xl. */
export function ProductTable({
  products,
  sort,
  onSort,
  onDelete,
  linkState,
  busy,
}) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border',
        busy && 'opacity-60 transition-opacity'
      )}
    >
      <Table className="table-fixed">
        <caption className="sr-only">Catalogue products</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead
              label="ERP code"
              field="erp_item_code"
              sort={sort}
              onSort={onSort}
              className="w-44 lg:w-52"
            />
            <SortableHead
              label="Item description"
              field="item_description"
              sort={sort}
              onSort={onSort}
            />
            <TableHead className="hidden w-56 lg:table-cell xl:w-72">
              UNSPSC commodity
            </TableHead>
            <TableHead className="hidden w-32 leading-tight whitespace-normal xl:table-cell">
              Internal category
            </TableHead>
            <SortableHead
              label="UOM"
              field="uom"
              sort={sort}
              onSort={onSort}
              className="w-24"
            />
            <SortableHead
              label="Added"
              field="created_at"
              sort={sort}
              onSort={onSort}
              className="hidden w-32 xl:table-cell"
            />
            <TableHead className="w-14">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-xs break-all">
                {display(p.erp_item_code)}
              </TableCell>
              <TableCell>
                <Link
                  to={`/products/${p.id}`}
                  state={linkState}
                  className="hover:text-primary font-medium break-words underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
                >
                  {display(p.item_description)}
                </Link>
                <div className="text-muted-foreground mt-1 text-xs [overflow-wrap:anywhere]">
                  BizBox {display(p.bizbox_item_code)}
                  {p.philgeps_code && <> · PhilGEPS {p.philgeps_code}</>}
                </div>
                {/* Commodity moves under the description where its column is hidden. */}
                <div className="text-muted-foreground mt-1 text-xs break-words lg:hidden">
                  {commodityLabel(p)}
                </div>
              </TableCell>
              <TableCell className="hidden text-sm break-words lg:table-cell">
                {commodityLabel(p)}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {p.internal_category_code ? (
                  <Badge
                    variant="outline"
                    className="font-mono"
                    title={p.internal_category?.name}
                  >
                    {p.internal_category_code}
                  </Badge>
                ) : (
                  display(null)
                )}
              </TableCell>
              <TableCell className="text-sm">{display(p.uom)}</TableCell>
              <TableCell className="text-muted-foreground hidden text-sm xl:table-cell">
                {formatDate(p.created_at)}
              </TableCell>
              <TableCell className="py-2 text-right">
                <ProductRowActions
                  product={p}
                  onDelete={onDelete}
                  linkState={linkState}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
