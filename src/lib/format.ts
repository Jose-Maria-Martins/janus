import type { PolicyType } from '../types';

const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const formatEUR = (n: number) => eur.format(n);

export const POLICY_LABEL: Record<PolicyType, string> = {
  work_accident: 'Work accident',
  vehicles: 'Vehicles',
  multirisk: 'Multirisk',
  liability: 'Liability',
  health: 'Group health',
  cyber: 'Cyber',
  business_interruption: 'Business interruption',
  vehicles_own_damage: 'Own damage for vehicles',
  tools_equipment: 'Tools and equipment',
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
