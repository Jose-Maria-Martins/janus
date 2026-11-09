import { insurerById } from '../data';
import type { Claim, Policy, PolicyType } from '../types';
import { formatDate, todayIso } from './dates';

/**
 * One answer to "What happened?". `cover` is the start of the cover's name in the policy: found among
 * what's covered means yes, among what's not covered (or missing) means no. No `cover`: the insurer decides.
 */
export type Category = { id: string; label: string; title: string; cover?: string; gap?: PolicyType };

const CATEGORIES: Partial<Record<PolicyType, Category[]>> = {
  work_accident: [
    { id: 'injury', label: 'Someone got hurt at work', title: 'Worker hurt at work', cover: 'Medical' },
    { id: 'commute', label: 'Someone got hurt on the way to or from work', title: 'Worker hurt on the way to work', cover: 'Accidents on the way' },
  ],
  vehicles: [
    { id: 'glass', label: 'Broken windscreen or window', title: 'Broken glass on {van}', cover: 'Glass' },
    { id: 'collision', label: 'We hit another car or property', title: 'Accident with {van}', cover: 'Mandatory third-party' },
    { id: 'damage', label: 'Our van was damaged in a crash', title: 'Damage to {van}', cover: 'Own damage', gap: 'vehicles_own_damage' },
    { id: 'theft', label: 'Van stolen or broken into', title: '{van} stolen', cover: 'Own damage', gap: 'vehicles_own_damage' },
    { id: 'breakdown', label: 'Breakdown, we need a tow', title: 'Breakdown of {van}', cover: 'Roadside' },
    { id: 'goods', label: 'Tools or goods in the van damaged or stolen', title: 'Goods lost from {van}', cover: 'Goods carried', gap: 'tools_equipment' },
  ],
  multirisk: [
    { id: 'fire', label: 'Fire or explosion', title: 'Fire at the warehouse', cover: 'Fire' },
    { id: 'flood', label: 'Storm or flood', title: 'Storm damage at the warehouse', cover: 'Storms' },
    { id: 'theft', label: 'Break-in at the warehouse', title: 'Break-in at the warehouse', cover: 'Theft with forced entry' },
    { id: 'electrical', label: 'Power surge or electrical damage', title: 'Electrical damage at the warehouse', cover: 'Electrical' },
    { id: 'site', label: 'Equipment stolen from a building site', title: 'Equipment stolen from a site', cover: 'Equipment kept outside', gap: 'tools_equipment' },
  ],
  liability: [
    { id: 'third_party', label: "We damaged someone's property or hurt someone", title: 'Damage to a third party', cover: 'Damage to third parties' },
    { id: 'neighbour', label: 'Damage to a neighbouring building', title: 'Damage to a neighbouring building', cover: 'Damage to neighbouring' },
    { id: 'defect', label: 'A client complains about our work', title: 'Client complaint about our work', cover: 'Defects in the work' },
    { id: 'subcontractor', label: 'A subcontractor caused damage', title: 'Damage caused by a subcontractor', cover: 'Damage caused by subcontractors' },
  ],
};

const OTHER: Category = { id: 'other', label: 'Something else', title: 'Claim' };

/** The choices for this policy; covers without a list offer each thing the policy covers. */
export function categories(policy: Policy): Category[] {
  const list = CATEGORIES[policy.type] ?? policy.covered.map((c, i) => ({ id: `c${i}`, label: c.name, title: c.name, cover: c.name }));
  return [...list, OTHER];
}

export type CoverCheck =
  | { result: 'yes'; cover: Policy['covered'][number] }
  | { result: 'no'; reason?: string }
  | { result: 'unsure' };

/** Is this covered? Answered from the policy's own lists. */
export function checkCover(policy: Policy, category: Category): CoverCheck {
  if (!category.cover) return { result: 'unsure' };
  const prefix = category.cover.toLowerCase();
  const cover = policy.covered.find((c) => c.name.toLowerCase().startsWith(prefix));
  if (cover) return { result: 'yes', cover };
  return { result: 'no', reason: policy.notCovered.find((n) => n.toLowerCase().startsWith(prefix)) };
}

/** Policies a claim can be made on today: started, and not ended yet. */
export const claimablePolicies = (policies: Policy[]) => policies.filter((p) => p.startDate <= todayIso());

export const COSTS = ['Under €500', '€500 to €2,000', '€2,000 to €10,000', 'Over €10,000', "I don't know yet"];

export type Answers = {
  policy: Policy;
  category: Category;
  vehicle?: string;
  injured?: string;
  date: string;
  place: string;
  cost?: string;
  photos: string[];
};

export const claimTitle = (a: Pick<Answers, 'category' | 'vehicle'>) => a.category.title.replace('{van}', a.vehicle ?? 'a van');

/** A first draft of the description from the answers, for the user to correct. */
export function draftDescription(a: Answers): string {
  const when = formatDate(a.date, { day: 'numeric', month: 'long' });
  const lower = a.category.label.charAt(0).toLowerCase() + a.category.label.slice(1);
  // "Someone got hurt at work" → "Rui Ribeiro got hurt at work"
  const named = a.injured && a.category.label.startsWith('Someone');
  const what = a.category.id === 'other' ? 'something happened that we need to claim for' : named ? a.category.label.replace('Someone', a.injured!) : lower;
  // "Our warehouse" → "at our warehouse", "On the road" → "on the road"; typed addresses stay as they are.
  const place = /^(our|a|on|in|at) /i.test(a.place) ? a.place.charAt(0).toLowerCase() + a.place.slice(1) : a.place;
  const where = /^(on|in|at) /.test(place) ? place : `at ${place}`;
  const lines = [
    `On ${when}${a.place ? `, ${where}` : ''}: ${what}.`,
    a.vehicle && `The van is ${a.vehicle}.`,
    a.injured && !named && `${a.injured} was hurt.`,
    a.cost && a.cost !== "I don't know yet" && `We think the cost is ${a.cost.charAt(0).toLowerCase() + a.cost.slice(1)}.`,
    a.photos.length > 0 && `${a.photos.length} photo${a.photos.length > 1 ? 's' : ''} attached.`,
  ];
  return lines.filter(Boolean).join(' ');
}

/** The claim as sent: reported and passed to the insurer today, the rest still to come. */
export function buildClaim(a: Answers, description: string): Claim {
  const today = todayIso();
  const insurer = insurerById(a.policy.insurerId).name;
  return {
    id: `c${Date.now().toString(36)}`,
    number: `SIN-${today.slice(0, 4)}-${String(Math.floor(10000 + Math.random() * 90000))}`,
    policyId: a.policy.id,
    title: claimTitle(a),
    date: a.date,
    status: 'in_progress',
    steps: [
      { label: 'Reported', date: today, done: true },
      { label: `Sent to ${insurer}`, date: today, done: true },
      { label: `${insurer} reviews the claim`, done: false },
      { label: 'Paid or closed', done: false },
    ],
    category: a.category.id,
    place: a.place || undefined,
    vehicle: a.vehicle,
    injured: a.injured,
    cost: a.cost,
    description,
    photos: a.photos,
  };
}
