import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** The neutral round icon used at the start of rows. */
export function IconCircle({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-secondary [&_svg]:size-5', className)}>{children}</span>;
}
