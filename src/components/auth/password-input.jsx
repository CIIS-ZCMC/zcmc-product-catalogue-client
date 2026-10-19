import { useState } from 'react'
import { Check, Eye, EyeOff, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PASSWORD_RULES } from '@/lib/auth'
import { Input } from '@/components/ui/input'

/** Input with a show/hide toggle. Extra props (id, aria-*, field props) go to the input. */
export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md outline-none focus-visible:ring-[3px]"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

/** Live checklist of the password policy. */
export function PasswordChecklist({ value = '' }) {
  return (
    <ul className="grid gap-1 text-xs" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value)
        const Icon = met ? Check : X
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5',
              met ? 'text-success' : 'text-muted-foreground'
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {rule.label}
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
