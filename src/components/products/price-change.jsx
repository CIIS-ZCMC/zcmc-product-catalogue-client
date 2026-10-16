import { Badge } from '@/components/ui/badge'
import { formatPeso } from '@/lib/product'

/** Text description of one price-history row; direction is in words so it never relies on color alone. */
export function PriceChange({ entry }) {
  if (entry.old_price === null || entry.old_price === undefined) return <Badge variant="secondary">Initial price</Badge>
  const change = Number(entry.price_change) || 0
  if (change === 0) return <span className="text-muted-foreground">No change</span>
  const up = change > 0
  return (
    <span className={up ? 'text-destructive' : 'text-success'}>
      {up ? 'Up' : 'Down'} {formatPeso(Math.abs(change))} ({up ? '+' : ''}
      {entry.percentage_change}%)
    </span>
  )
}
