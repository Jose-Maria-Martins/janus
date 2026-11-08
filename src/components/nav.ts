import { CircleUser, ClipboardList, CirclePlus, House, ShieldCheck } from 'lucide-react';

export const TABS = [
  { to: '/', label: 'Home', icon: House },
  { to: '/policies', label: 'Policies', icon: ShieldCheck },
  { to: '/buy', label: 'Buy', icon: CirclePlus },
  { to: '/claims', label: 'Claims', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: CircleUser },
];

/** Tab screens show the top bar and bottom tabs; every other route slides in from the right. */
export const isTabRoute = (pathname: string) => TABS.some((t) => t.to === pathname);
