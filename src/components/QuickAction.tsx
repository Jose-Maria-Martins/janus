import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';

type Props = { label: string; icon: LucideIcon } & ({ to: string; onClick?: never } | { onClick: () => void; to?: never });

/** Revolut's round see-through button with a label underneath; a link or a button. */
export function QuickAction({ to, onClick, label, icon: Icon }: Props) {
  const body = (
    <>
      <span className="grid size-12 place-items-center rounded-full bg-white/20 transition-transform group-active:scale-90">
        <Icon className="size-6" strokeWidth={2.2} />
      </span>
      <span className="text-sm leading-tight font-medium">{label}</span>
    </>
  );
  const className = 'group flex w-20 flex-col items-center gap-2';
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <button onClick={onClick} className={className}>
      {body}
    </button>
  );
}
