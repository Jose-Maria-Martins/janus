import { NavLink, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { TABS } from './nav';

/** Floating liquid-glass tab bar (mobile only); a glass lens slides to the active tab. */
export function BottomTabs() {
  const { pathname } = useLocation();

  return (
    <motion.nav
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      exit={{ y: 120 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="liquid-glass pointer-events-auto mx-auto flex max-w-[480px] rounded-full p-1">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="relative flex-1">
              {active && (
                <motion.span
                  layoutId="tab-lens"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-white/12 shadow-[inset_0_1px_0.5px_rgb(255_255_255/0.25)]"
                />
              )}
              <NavLink
                to={to}
                end
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors active:scale-95 ${
                  active ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                <Icon size={24} strokeWidth={2.1} />
                {label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
