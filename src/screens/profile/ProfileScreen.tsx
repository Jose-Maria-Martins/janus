import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, FileText, Headset, Receipt, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import { BottomSheet } from '@/components/BottomSheet';
import { IconCircle } from '@/components/IconCircle';
import { TabScreen, Widget } from '@/components/Screen';
import { resetDemo, setState, useStore, type NotificationKind } from '@/data/store';
import { RENEWAL_WINDOW_DAYS } from '@/lib/attention';
import { formatDate } from '@/lib/dates';
import { formatEUR, formatNif, initials } from '@/lib/format';
import { companyPayments } from '@/lib/policy';

const NOTIFICATIONS: { kind: NotificationKind; title: string; detail: string }[] = [
  { kind: 'renewals', title: 'Renewals', detail: `${RENEWAL_WINDOW_DAYS} days before a policy renews` },
  { kind: 'payments', title: 'Payments', detail: 'A week before a payment is taken' },
  { kind: 'claims', title: 'Claim updates', detail: 'When a claim moves to the next step' },
];

/** The company, its team, money and documents, notification settings and help. */
export function ProfileScreen() {
  const navigate = useNavigate();
  const { company, team, policies, payments, notifications } = useStore();
  const [resetOpen, setResetOpen] = useState(false);
  const next = companyPayments(policies, payments)
    .filter(({ payment }) => payment.status === 'upcoming')
    .sort((a, b) => a.payment.date.localeCompare(b.payment.date))[0]?.payment;

  const reset = () => {
    resetDemo();
    navigate('/welcome', { replace: true });
  };

  return (
    <TabScreen>
      <section className="pt-6 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-2xl font-bold">{initials(company.name)}</span>
        <h1 className="mt-4 text-2xl font-bold">{company.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">NIF {formatNif(company.nif)}</p>
      </section>

      <Widget title="Company">
        <LinkRow to="/profile/company" icon={<Building2 />} title="Company details" subtitle={`${company.sector} · ${company.city}`} />
        <LinkRow to="/profile/team" icon={<Users />} title="Team" subtitle={`${team.length} people`} />
      </Widget>

      <Widget title="Money">
        <LinkRow
          to="/profile/payments"
          icon={<Receipt />}
          title="Payments"
          subtitle={next ? `Next: ${formatEUR(next.amount)} on ${formatDate(next.date, { day: 'numeric', month: 'short' })}` : 'Nothing due'}
        />
        <LinkRow to="/profile/documents" icon={<FileText />} title="Documents" subtitle="Policies and certificates" />
      </Widget>

      <Widget title="Notifications">
        {NOTIFICATIONS.map((n) => (
          <Item key={n.kind} asChild>
            <label>
              <ItemContent>
                <ItemTitle>{n.title}</ItemTitle>
                <ItemDescription>{n.detail}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  checked={notifications[n.kind]}
                  onCheckedChange={(on) => setState((s) => ({ ...s, notifications: { ...s.notifications, [n.kind]: on } }))}
                />
              </ItemActions>
            </label>
          </Item>
        ))}
      </Widget>

      <Widget title="Help">
        <LinkRow to="/ask?with=person" icon={<Headset />} title="Chat with us" subtitle="Our team replies within the hour" />
      </Widget>

      <Button variant="link" className="mt-6 w-full text-destructive" onClick={() => setResetOpen(true)}>
        Reset demo
      </Button>

      <BottomSheet open={resetOpen} onClose={() => setResetOpen(false)} title="Reset the demo?">
        <p className="text-muted-foreground">Everything you changed is cleared and the demo starts again from the welcome screen.</p>
        <div className="mt-6 flex flex-col gap-1">
          <Button size="lg" variant="destructive" className="w-full" onClick={reset}>
            Reset demo
          </Button>
          <Button size="lg" variant="link" className="w-full" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
        </div>
      </BottomSheet>
    </TabScreen>
  );
}

function LinkRow({ to, icon, title, subtitle }: { to: string; icon: ReactNode; title: string; subtitle: string }) {
  return (
    <Item asChild>
      <Link to={to}>
        <ItemMedia>
          <IconCircle>{icon}</IconCircle>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription className="line-clamp-1">{subtitle}</ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  );
}
