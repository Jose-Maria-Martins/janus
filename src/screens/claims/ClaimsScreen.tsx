import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { PolicyIcon } from '@/components/PolicyIcon';
import { TabScreen, Widget } from '@/components/Screen';
import { useStore } from '@/data/store';
import { dayLabel, todayIso } from '@/lib/dates';
import { formatEUR } from '@/lib/format';
import type { Claim } from '@/types';

/** Open claims first, then closed ones, with what has been paid out this year on top. */
export function ClaimsScreen() {
  const { claims } = useStore();
  const sorted = [...claims].sort((a, b) => b.date.localeCompare(a.date));
  const open = sorted.filter((c) => c.status === 'in_progress');
  const closed = sorted.filter((c) => c.status !== 'in_progress');
  const year = todayIso().slice(0, 4);
  const paid = claims.filter((c) => c.status === 'paid' && c.date.startsWith(year)).reduce((sum, c) => sum + (c.amount ?? 0), 0);

  return (
    <TabScreen>
      <section className="pt-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">Paid out in {year}</p>
        <p className="mt-2 text-5xl leading-none font-semibold tracking-tight tabular-nums">{formatEUR(paid)}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {open.length ? `${open.length} open claim${open.length > 1 ? 's' : ''}` : 'No open claims'}
        </p>
        <Button asChild className="mt-6">
          <Link to="/claims/new">
            <Plus />
            Report a claim
          </Link>
        </Button>
      </section>

      {open.length > 0 && (
        <Widget title="Open">
          {open.map((c) => (
            <ClaimRow key={c.id} claim={c} />
          ))}
        </Widget>
      )}
      {closed.length > 0 && (
        <Widget title="Closed">
          {closed.map((c) => (
            <ClaimRow key={c.id} claim={c} />
          ))}
        </Widget>
      )}
    </TabScreen>
  );
}

function ClaimRow({ claim }: { claim: Claim }) {
  const policy = useStore().policies.find((p) => p.id === claim.policyId);
  return (
    <Item asChild>
      <Link to={`/claims/${claim.id}`}>
        <ItemMedia>{policy && <PolicyIcon type={policy.type} />}</ItemMedia>
        <ItemContent>
          <ItemTitle className="block w-full truncate">{claim.title}</ItemTitle>
          <ItemDescription className="line-clamp-1">
            {dayLabel(claim.date)} · {claim.number}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ClaimStatus claim={claim} />
        </ItemActions>
      </Link>
    </Item>
  );
}

export function ClaimStatus({ claim }: { claim: Claim }) {
  return claim.status === 'paid' ? (
    <Badge variant="success">{claim.amount ? `Paid ${formatEUR(claim.amount)}` : 'Paid'}</Badge>
  ) : (
    <Badge variant="warning">In progress</Badge>
  );
}
