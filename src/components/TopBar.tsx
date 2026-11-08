import { useState } from 'react';
import { Link } from 'react-router';
import { Bell, Search } from 'lucide-react';
import { data } from '@/data';
import { initials } from '@/lib/format';
import { useScrolled } from '@/lib/useScrolled';
import { NotificationsSheet } from './NotificationsSheet';
import { SearchOverlay } from './SearchOverlay';

/** Revolut's top row: dark see-through buttons, clear at the top, solid once you scroll. */
export function TopBar() {
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const scrolled = useScrolled();

  return (
    <header className={`sticky top-0 z-20 transition-colors duration-200 ${scrolled ? 'bg-background' : 'bg-transparent'}`}>
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <Link to="/profile" aria-label="Company profile" className="dark-glass grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold">
          {initials(data.company.name)}
        </Link>

        <button onClick={() => setSearchOpen(true)} className="dark-glass flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full px-4 text-left text-base">
          <Search className="size-5 shrink-0" strokeWidth={2.4} />
          <span className="truncate text-foreground/85">Search</span>
        </button>

        <button onClick={() => setBellOpen(true)} aria-label="Notifications" className="dark-glass relative grid size-11 shrink-0 place-items-center rounded-full">
          <Bell className="size-5" strokeWidth={2.4} fill="currentColor" />
          <span className="absolute top-0 right-0 size-2.5 rounded-full bg-destructive" />
        </button>
      </div>

      <NotificationsSheet open={bellOpen} onClose={() => setBellOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
