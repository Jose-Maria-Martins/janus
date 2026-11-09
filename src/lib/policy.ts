import type { Company, Payment, Policy, PolicyType } from '../types';
import { insurerById } from '../data';
import { formatDate, todayIso } from './dates';

export const FREQUENCY_LABEL: Record<Policy['paymentFrequency'], string> = {
  annual: 'Once a year',
  quarterly: 'Every 3 months',
  monthly: 'Every month',
};
export const INSTALMENTS: Record<Policy['paymentFrequency'], number> = { annual: 1, quarterly: 4, monthly: 12 };

/** Policies that carry on: a switched-away policy only runs until its end date. */
export const activePolicies = (policies: Policy[]) => policies.filter((p) => !p.replacedBy);

/** What the company pays a year from now on. */
export const annualTotal = (policies: Policy[]) => activePolicies(policies).reduce((sum, p) => sum + p.annualPremium, 0);

/** Covers the company already has. Full cover on the vans counts as own damage too. */
export function heldTypes(policies: Policy[]): Set<PolicyType> {
  const active = activePolicies(policies);
  const held = new Set(active.map((p) => p.type));
  if (active.some((p) => p.type === 'vehicles' && p.covered.some((c) => c.name.startsWith('Own damage')))) held.add('vehicles_own_damage');
  return held;
}

/** What "Make a change" offers for this type of cover, if anything. */
export function changeKind(type: PolicyType): 'employees' | 'vehicles' | undefined {
  if (type === 'vehicles') return 'vehicles';
  if (type === 'work_accident' || type === 'health') return 'employees';
}

/** Price of one more van or employee: the premium shared out evenly. */
export function unitPrice(policy: Policy, company: Company) {
  return Math.round(policy.annualPremium / (policy.vehicles?.length ?? company.employees));
}

/** Cover names like "Hospitalisation (60 employees)" follow the current headcount and fleet. */
export function coverName(name: string, policy: Policy, company: Company) {
  return name
    .replace(/\(\d+ vehicles\)/, `(${policy.vehicles?.length ?? 0} vehicles)`)
    .replace(/\(\d+ employees\)/, `(${company.employees} employees)`);
}

/** This policy's payments; upcoming ones follow the current premium. */
export function policyPayments(policy: Policy, payments: Payment[]): Payment[] {
  return payments
    .filter((p) => p.policyId === policy.id)
    .map((p) => (p.status === 'upcoming' ? { ...p, amount: Math.round(policy.annualPremium / INSTALMENTS[policy.paymentFrequency]) } : p))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** For an imported policy: the last three instalments (paid) and the next one (upcoming). */
export function generatePayments(policy: Policy): Payment[] {
  const step = 12 / INSTALMENTS[policy.paymentFrequency];
  const amount = Math.round(policy.annualPremium / INSTALMENTS[policy.paymentFrequency]);
  const today = todayIso();
  const dates: string[] = [];
  for (let d = policy.startDate; d < policy.renewalDate; d = addMonths(d, step)) dates.push(d);
  const paid = dates.filter((d) => d <= today).slice(-3);
  const next = dates.find((d) => d > today) ?? policy.renewalDate;
  return [...paid.map((d) => ({ d, status: 'paid' as const })), { d: next, status: 'upcoming' as const }].map(({ d, status }) => ({
    id: `${policy.id}-${d}`,
    policyId: policy.id,
    date: d,
    amount,
    status,
  }));
}

/** Same day of the month, n months later (clamped to the month's last day). */
function addMonths(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d, last));
  return first.toISOString().slice(0, 10);
}

/** Where a switched or bought policy stands: "Ends 26 Dec, replaced by Allianz", "Starts 26 Dec" or "Bought with Janus". */
export function policyStatus(policy: Policy, policies: Policy[]): { text: string; kind: 'ending' | 'starting' | 'bought' } | undefined {
  const short = { day: 'numeric', month: 'short' } as const;
  if (policy.replacedBy) {
    const next = policies.find((p) => p.id === policy.replacedBy);
    return { text: `Ends ${formatDate(policy.renewalDate, short)}, replaced by ${next ? insurerById(next.insurerId).name : 'a new policy'}`, kind: 'ending' };
  }
  if (policy.startDate > todayIso()) return { text: `Starts ${formatDate(policy.startDate, short)}`, kind: 'starting' };
  if (policy.boughtWithJanus) return { text: 'Bought with Janus', kind: 'bought' };
}
