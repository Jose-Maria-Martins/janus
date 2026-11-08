import type { ReactNode } from 'react';
import { SuccessTick } from './SuccessTick';

/** Big tick, title, a line or two, then the buttons. Used by every success screen and sheet. */
export function SuccessView({ title, lines, children }: { title: string; lines: string[]; children?: ReactNode }) {
  return (
    <div className="pt-2 text-center">
      <SuccessTick />
      <h2 className="mt-6 text-2xl font-bold">{title}</h2>
      {lines.map((line) => (
        <p key={line} className="mt-1 text-base text-muted-foreground">
          {line}
        </p>
      ))}
      {children && <div className="mt-8 flex flex-col gap-1">{children}</div>}
    </div>
  );
}
