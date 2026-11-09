import { Link, useSearchParams } from 'react-router';
import { Item, ItemContent, ItemDescription, ItemMedia } from '@/components/ui/item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PolicyIcon } from '@/components/PolicyIcon';
import { RowTitle } from '@/components/RowTitle';
import { TabScreen, Widget } from '@/components/Screen';
import { data, insurerById } from '@/data';
import { useStore } from '@/data/store';
import { bestSaving, detailsFor, offers } from '@/lib/buy';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { activePolicies, heldTypes } from '@/lib/policy';
import type { PolicyType } from '@/types';

/** Switch a policy for a cheaper one, or add cover the company doesn't have. */
export function BuyScreen() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'add' ? 'add' : 'switch';
  const { policies, company } = useStore();

  const active = activePolicies(policies);
  const switchable = active
    .filter((p) => data.quotes.some((q) => q.policyType === p.type))
    .map((p) => ({ policy: p, saving: bestSaving(p, company, policies) }))
    .sort((a, b) => b.saving - a.saving);
  const totalSaving = switchable.reduce((sum, s) => sum + s.saving, 0);

  const held = heldTypes(policies);
  const gaps = data.gaps.filter((g) => !held.has(g.type));
  const others = (Object.keys(POLICY_LABEL) as PolicyType[]).filter((t) => !gaps.some((g) => g.type === t));
  const fromPrice = (type: PolicyType) => offers(type, detailsFor(company, policies))[0]?.price;
  /** The policy to compare instead of buying a cover the company already has. */
  const heldPolicy = (type: PolicyType) => active.find((p) => p.type === (type === 'vehicles_own_damage' ? 'vehicles' : type));

  return (
    <TabScreen>
      <section className="pt-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">{totalSaving ? 'You could save' : 'Your prices are fair'}</p>
        <p className="mt-2 text-5xl leading-none font-semibold tracking-tight tabular-nums">
          {formatEUR(totalSaving)}
          <span className="ml-1.5 text-lg font-medium tracking-normal text-muted-foreground">/ year</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">by switching each policy to its best offer</p>
      </section>

      <Tabs value={tab} onValueChange={(v) => setParams(v === 'add' ? { tab: 'add' } : {}, { replace: true })} className="mt-7">
        <TabsList className="w-full">
          <TabsTrigger value="switch">Switch</TabsTrigger>
          <TabsTrigger value="add">Add new cover</TabsTrigger>
        </TabsList>

        <TabsContent value="switch">
          <Widget>
            {switchable.map(({ policy, saving }) => (
              <Item key={policy.id} asChild>
                <Link to={`/buy/switch/${policy.id}`}>
                  <ItemMedia>
                    <PolicyIcon type={policy.type} />
                  </ItemMedia>
                  <ItemContent>
                    <RowTitle amount={saving ? `Save ${formatEUR(saving)}` : undefined} amountClassName="text-success">
                      {POLICY_LABEL[policy.type]}
                    </RowTitle>
                    <ItemDescription className="line-clamp-1">
                      {insurerById(policy.insurerId).name} · {saving ? `${formatEUR(policy.annualPremium)} a year` : 'Best price already'}
                    </ItemDescription>
                  </ItemContent>
                </Link>
              </Item>
            ))}
          </Widget>
          <p className="mt-3 px-1 text-sm text-muted-foreground">
            Same cover from other insurers. A switch starts the day your current policy ends, so you're never without cover.
          </p>
        </TabsContent>

        <TabsContent value="add">
          {gaps.length > 0 && (
            <Widget title="Gaps we found">
              {gaps.map((g) => (
                <Item key={g.type} asChild>
                  <Link to={`/buy/add/${g.type}`}>
                    <ItemMedia>
                      <PolicyIcon type={g.type} />
                    </ItemMedia>
                    <ItemContent>
                      <RowTitle>{g.title}</RowTitle>
                      <ItemDescription className="line-clamp-2">{g.message}</ItemDescription>
                      <ItemDescription className="text-link">From {formatEUR(fromPrice(g.type))} a year</ItemDescription>
                    </ItemContent>
                  </Link>
                </Item>
              ))}
            </Widget>
          )}

          <Widget title="All covers">
            {others.map((type) => {
              const policy = held.has(type) ? heldPolicy(type) : undefined;
              return (
                <Item key={type} asChild>
                  <Link to={policy ? `/buy/switch/${policy.id}` : `/buy/add/${type}`}>
                    <ItemMedia>
                      <PolicyIcon type={type} />
                    </ItemMedia>
                    <ItemContent>
                      <RowTitle>{POLICY_LABEL[type]}</RowTitle>
                      <ItemDescription className="line-clamp-1">
                        {policy ? 'You have this — compare instead' : `From ${formatEUR(fromPrice(type))} a year`}
                      </ItemDescription>
                    </ItemContent>
                  </Link>
                </Item>
              );
            })}
          </Widget>
        </TabsContent>
      </Tabs>
    </TabScreen>
  );
}
