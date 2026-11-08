import { NavLink } from 'react-router';
import { data } from '../data';
import { initials } from '../lib/format';
import { TABS } from './nav';

/** Desktop navigation (≥1024px). */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-border bg-background px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-3 pb-8">
        <img src="/favicon.svg" alt="" className="size-8" />
        <span className="text-xl font-extrabold tracking-tight">janus</span>
      </div>

      <nav className="flex flex-col gap-1">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-3 font-semibold transition-colors ${
                isActive ? 'bg-card text-foreground' : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-card p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold">
          {initials(data.company.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.company.name}</p>
          <p className="text-xs text-muted-foreground">NIF {data.company.nif}</p>
        </div>
      </div>
    </aside>
  );
}
