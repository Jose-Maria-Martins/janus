import type { ReactNode } from 'react';
import { ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';

/** Row title with the amount beside it, as in Revolut's lists, so the line underneath gets the full width. */
export function RowTitle({ children, amount, amountClassName }: { children: ReactNode; amount?: ReactNode; amountClassName?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <ItemTitle className="block min-w-0 truncate">{children}</ItemTitle>
      {amount !== undefined && <span className={cn('shrink-0 font-medium tabular-nums', amountClassName)}>{amount}</span>}
    </div>
  );
}
