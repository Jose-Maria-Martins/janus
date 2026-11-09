import { data } from '../data';
import { getState } from '../data/store';
import type { PolicyType } from '../types';
import { daysUntil } from './dates';
import { POLICY_LABEL } from './format';
import { activePolicies, heldTypes } from './policy';

export type AttentionItem = { kind: 'renewal' | 'gap'; type: PolicyType; title: string; message: string; cta: string; to: string };

export const RENEWAL_WINDOW_DAYS = 60;

export const nextRenewal = () => [...activePolicies(getState().policies)].sort((a, b) => a.renewalDate.localeCompare(b.renewalDate))[0];

/** The next renewal (if within 60 days) followed by one item per gap the company hasn't covered. */
export function attentionItems(): AttentionItem[] {
  const next = nextRenewal();
  const days = daysUntil(next.renewalDate);
  const held = heldTypes(getState().policies);
  const renewal: AttentionItem[] =
    days <= RENEWAL_WINDOW_DAYS
      ? [
          {
            kind: 'renewal',
            type: next.type,
            title: `${POLICY_LABEL[next.type]} renews in ${days} days`,
            message: 'See if another insurer offers the same cover for less.',
            cta: 'Compare prices',
            to: `/buy/switch/${next.id}`,
          },
        ]
      : [];

  return [
    ...renewal,
    ...data.gaps
      .filter((g) => !held.has(g.type))
      .map<AttentionItem>((g) => ({ kind: 'gap', type: g.type, title: g.title, message: g.message, cta: 'Get covered', to: `/buy/add/${g.type}` })),
  ];
}
