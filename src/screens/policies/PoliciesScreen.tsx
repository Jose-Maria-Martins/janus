import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PolicyRow } from '@/components/PolicyRow';
import { TabScreen, Widget } from '@/components/Screen';
import { useStore } from '@/data/store';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import type { PolicyType } from '@/types';

export function PoliciesScreen() {
  const { policies } = useStore();
  const [filter, setFilter] = useState<PolicyType | 'all'>('all');

  const types = [...new Set(policies.map((p) => p.type))];
  const shown = filter === 'all' ? policies : policies.filter((p) => p.type === filter);
  const total = shown.reduce((sum, p) => sum + p.annualPremium, 0);

  return (
    <TabScreen>
      <section className="pt-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {filter === 'all' ? `${policies.length} policies` : POLICY_LABEL[filter]} · per year
        </p>
        <p className="mt-2 text-5xl leading-none font-semibold tracking-tight tabular-nums">{formatEUR(total)}</p>

        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/import">
              <Upload />
              Import a policy
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/buy?tab=add">
              <Plus />
              Add cover
            </Link>
          </Button>
        </div>
      </section>

      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as PolicyType | 'all')}
        className="no-scrollbar -mx-4 mt-7 w-auto justify-start overflow-x-auto px-4"
      >
        {(['all', ...types] as const).map((t) => (
          <ToggleGroupItem key={t} value={t}>
            {t === 'all' ? 'All' : POLICY_LABEL[t]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Widget>
        {shown.map((p) => (
          <PolicyRow key={p.id} policy={p} />
        ))}
      </Widget>
    </TabScreen>
  );
}
