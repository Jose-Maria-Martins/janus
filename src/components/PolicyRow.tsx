import { Link } from 'react-router';
import { Item, ItemContent, ItemDescription, ItemMedia } from '@/components/ui/item';
import { insurerById } from '@/data';
import { useStore } from '@/data/store';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { priceVsMarket } from '@/lib/market';
import { policyStatus } from '@/lib/policy';
import type { Policy } from '@/types';
import { PolicyIcon } from './PolicyIcon';
import { RowTitle } from './RowTitle';

/** A policy as a list row: coloured icon, type and insurer, price on the right. */
export function PolicyRow({ policy }: { policy: Policy }) {
  const market = priceVsMarket(policy);
  const status = policyStatus(policy, useStore().policies);
  return (
    <Item asChild>
      <Link to={`/policies/${policy.id}`}>
        <ItemMedia>
          <PolicyIcon type={policy.type} />
        </ItemMedia>
        <ItemContent>
          <RowTitle amount={formatEUR(policy.annualPremium)}>{POLICY_LABEL[policy.type]}</RowTitle>
          <ItemDescription className="line-clamp-1">
            {insurerById(policy.insurerId).name}
            {status && <span className={status.kind === 'ending' ? 'text-warning' : ''}> · {status.text}</span>}
            {market?.status === 'above' && <span className="text-destructive"> · {formatEUR(market.diff)} above market</span>}
            {market?.status === 'fair' && <span className="text-success"> · Fair price</span>}
          </ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  );
}
