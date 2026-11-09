import { data } from '../data';
import type { Policy, PolicyType } from '../types';

/** Average of the quotes we have for this type of cover (the "market price"). */
export function marketAverage(type: PolicyType): number | undefined {
  const prices = data.quotes.filter((q) => q.policyType === type).map((q) => q.annualPremium);
  return prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : undefined;
}

/** More than 5% above the market average counts as overpaying. Not shown for policies bought with Janus. */
export function priceVsMarket(policy: Policy): { status: 'above' | 'fair'; diff: number } | undefined {
  // Bought here at the best price, or on its way out: no badge.
  if (policy.boughtWithJanus || policy.replacedBy) return undefined;
  const avg = marketAverage(policy.type);
  if (avg === undefined) return undefined;
  const diff = policy.annualPremium - avg;
  return { status: diff > avg * 0.05 ? 'above' : 'fair', diff };
}
