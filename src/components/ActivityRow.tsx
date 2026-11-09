import { Link } from 'react-router';
import { BadgeCheck, CalendarClock, FileText, PenLine, Receipt, ShieldCheck, Upload } from 'lucide-react';
import { Item, ItemContent, ItemDescription, ItemMedia } from '@/components/ui/item';
import { insurerById } from '@/data';
import { useStore } from '@/data/store';
import { dayLabel } from '@/lib/dates';
import { formatEUR } from '@/lib/format';
import type { Activity } from '@/types';
import { IconCircle } from './IconCircle';
import { InsurerLogo } from './InsurerLogo';
import { RowTitle } from './RowTitle';

const ICON = { reminder: CalendarClock, claim: FileText, certificate: BadgeCheck, payment: Receipt, change: PenLine, import: Upload, purchase: ShieldCheck };

/** A Revolut transaction row: logo, title and date, amount on the right. */
export function ActivityRow({ item }: { item: Activity }) {
  const { policies, claims } = useStore();
  const claim = item.claimId ? claims.find((c) => c.id === item.claimId) : undefined;
  const policy = policies.find((p) => p.id === (item.policyId ?? claim?.policyId));
  const insurer = policy && insurerById(policy.insurerId);
  const to = item.claimId ? `/claims/${item.claimId}` : policy ? `/policies/${policy.id}` : undefined;
  const Icon = ICON[item.type];

  const body = (
    <>
      <ItemMedia>
        {/* Payments show the insurer's logo, like a merchant logo in a bank app. */}
        {item.type === 'payment' && insurer ? (
          <InsurerLogo insurer={insurer} />
        ) : (
          <IconCircle>
            <Icon />
          </IconCircle>
        )}
      </ItemMedia>
      <ItemContent>
        <RowTitle
          amount={item.amount === undefined ? undefined : `${item.amount > 0 ? '+' : '-'}${formatEUR(Math.abs(item.amount))}`}
          amountClassName={item.amount !== undefined && item.amount > 0 ? 'text-success' : ''}
        >
          {item.text}
        </RowTitle>
        <ItemDescription className="line-clamp-1">
          {dayLabel(item.date)}
          {insurer && ` · ${insurer.name}`}
        </ItemDescription>
      </ItemContent>
    </>
  );

  return to ? (
    <Item asChild>
      <Link to={to}>{body}</Link>
    </Item>
  ) : (
    <Item>{body}</Item>
  );
}
