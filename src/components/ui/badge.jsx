import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-600 text-white shadow-2xs',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-700',
        destructive:
          'border-red-200 bg-red-50 text-red-700',
        outline:
          'border-slate-200 text-slate-700 bg-white',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800',
        info:
          'border-sky-200 bg-sky-50 text-sky-700',
        blue:
          'border-blue-200 bg-blue-50 text-blue-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
