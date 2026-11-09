import { data } from '../data';
import type { Company, Payment, Policy, PolicyType, Quote, Vehicle } from '../types';
import { addYear, todayIso } from './dates';
import { activePolicies, INSTALMENTS } from './policy';

export type VanCover = 'third_party' | 'glass_roadside' | 'full';

/** The three levels of van cover. Quotes in the mock data are for the middle one, which the company has today. */
export const VAN_COVER: Record<VanCover, { label: string; description: string; factor: number }> = {
  third_party: { label: 'Third party only', description: 'What the law requires: damage you cause to others.', factor: 0.8 },
  glass_roadside: { label: 'Third party + glass and roadside', description: 'Adds broken glass and 24/7 roadside help.', factor: 1 },
  full: { label: 'Full cover', description: 'Adds theft, fire and damage to your own vans.', factor: 1.8 },
};

/** What the price depends on. */
export type Details = { employees: number; payroll: number; vans: Vehicle[]; cover: VanCover };

/** The details to quote with: the policy being replaced, else the company and its vans. */
export function detailsFor(company: Company, policies: Policy[], replacing?: Policy): Details {
  const vansPolicy = replacing?.vehicles ? replacing : activePolicies(policies).find((p) => p.type === 'vehicles');
  return {
    employees: company.employees,
    payroll: company.annualPayroll,
    vans: vansPolicy?.vehicles ?? [],
    cover: vansPolicy?.covered.some((c) => c.name.startsWith('Own damage')) ? 'full' : 'glass_roadside',
  };
}

/** Quotes in the mock data are for the original 60 employees, payroll and 14 vans; prices scale from there. */
function priceFactor(type: PolicyType, d: Details) {
  const baseVans = data.policies.find((p) => p.type === 'vehicles')?.vehicles?.length ?? 1;
  switch (type) {
    case 'work_accident':
      return d.payroll / data.company.annualPayroll;
    case 'health':
      return d.employees / data.company.employees;
    case 'vehicles':
      return (d.vans.length / baseVans) * VAN_COVER[d.cover].factor;
    case 'vehicles_own_damage':
      return d.vans.length / baseVans;
    default:
      return 1;
  }
}

export type Offer = Quote & { price: number };

/** Offers for this cover, cheapest first, leaving out the insurer the company already uses. "All 14 vans" follows the vans picked. */
export function offers(type: PolicyType, details: Details, currentInsurerId?: string): Offer[] {
  const factor = priceFactor(type, details);
  return data.quotes
    .filter((q) => q.policyType === type && q.insurerId !== currentInsurerId)
    .map((q) => ({
      ...q,
      price: Math.round((q.annualPremium * factor) / 10) * 10,
      highlights: q.highlights.map((h) => h.replace(/\b\d+ vans\b/, `${details.vans.length} vans`)),
    }))
    .sort((a, b) => a.price - b.price);
}

/** How much switching this policy to the cheapest offer saves a year (0 if it is already the cheapest). */
export function bestSaving(policy: Policy, company: Company, policies: Policy[]) {
  const best = offers(policy.type, detailsFor(company, policies, policy), policy.insurerId)[0];
  return best ? Math.max(0, policy.annualPremium - best.price) : 0;
}

const PREFIX: Record<PolicyType, string> = {
  work_accident: 'AT',
  vehicles: 'AU',
  multirisk: 'MR',
  liability: 'RC',
  health: 'SA',
  cyber: 'CY',
  business_interruption: 'PE',
  vehicles_own_damage: 'DP',
  tools_equipment: 'EQ',
};

/**
 * The new policy. A switch keeps today's cover (for vans, at the level picked) and starts when the old
 * policy ends; new cover starts today and lists what the offer includes.
 */
export function buildPolicy(o: { offer: Offer; details: Details; frequency: Policy['paymentFrequency']; replacing?: Policy }): Policy {
  const { offer, details, frequency, replacing } = o;
  const type = offer.policyType;
  const start = replacing?.renewalDate ?? todayIso();
  let covered: Policy['covered'] = replacing ? replacing.covered : offer.highlights.map((name) => ({ name }));
  if (type === 'vehicles' && replacing) {
    covered = covered.filter((c) => !c.name.startsWith('Own damage'));
    if (details.cover === 'third_party') covered = covered.slice(0, 1);
    if (details.cover === 'full') covered = [...covered, { name: 'Own damage: theft, fire and collision', deductible: '€500' }];
  }
  return {
    id: `j${Date.now().toString(36)}`,
    type,
    insurerId: offer.insurerId,
    policyNumber: `${PREFIX[type]}-${start.slice(0, 4)}-${String(Math.floor(100000 + Math.random() * 900000))}`,
    annualPremium: offer.price,
    paymentFrequency: frequency,
    startDate: start,
    renewalDate: addYear(start),
    covered,
    notCovered: replacing && type !== 'vehicles' ? replacing.notCovered : [],
    questions: [],
    ...((type === 'vehicles' || type === 'vehicles_own_damage') && { vehicles: details.vans }),
    boughtWithJanus: true,
  };
}

/** The first instalment: taken today for cover that starts today, else due on the start date. */
export function firstPayment(policy: Policy): Payment {
  return {
    id: `${policy.id}-${policy.startDate}`,
    policyId: policy.id,
    date: policy.startDate,
    amount: Math.round(policy.annualPremium / INSTALMENTS[policy.paymentFrequency]),
    status: policy.startDate <= todayIso() ? 'paid' : 'upcoming',
  };
}
