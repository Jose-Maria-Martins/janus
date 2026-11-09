import { Link } from 'react-router';
import { Landmark } from 'lucide-react';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { IconCircle } from '@/components/IconCircle';
import { InsurerLogo } from '@/components/InsurerLogo';
import { RowTitle } from '@/components/RowTitle';
import { PushScreen, Widget } from '@/components/Screen';
import { data, insurerById } from '@/data';
import { useStore } from '@/data/store';
import { formatDate } from '@/lib/dates';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { annualTotal, companyPayments } from '@/lib/policy';
import type { Payment, Policy } from '@/types';

/** Every premium across the policies: what's coming up, then what has been paid, and how. */
export function PaymentsScreen() {
  const { policies, payments } = useStore();
  const all = companyPayments(policies, payments);
  const upcoming = all.filter(({ payment }) => payment.status === 'upcoming').sort((a, b) => a.payment.date.localeCompare(b.payment.date));
  const paid = all.filter(({ payment }) => payment.status === 'paid').sort((a, b) => b.payment.date.localeCompare(a.payment.date));

  return (
    <PushScreen title="Payments">
      <section className="pt-4 pb-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">You pay a year</p>
        <p className="mt-2 text-5xl leading-none font-semibold tracking-tight tabular-nums">{formatEUR(annualTotal(policies))}</p>
      </section>

      <Widget title="Pay with">
        <Item>
          <ItemMedia>
            <IconCircle>
              <Landmark />
            </IconCircle>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{data.paymentMethod.label}</ItemTitle>
            <ItemDescription>{data.paymentMethod.detail}</ItemDescription>
          </ItemContent>
        </Item>
      </Widget>

      {upcoming.length > 0 && (
        <Widget title="Upcoming">
          {upcoming.map(({ policy, payment }) => (
            <PaymentRow key={payment.id} policy={policy} payment={payment} />
          ))}
        </Widget>
      )}
      {paid.length > 0 && (
        <Widget title="Paid">
          {paid.map(({ policy, payment }) => (
            <PaymentRow key={payment.id} policy={policy} payment={payment} />
          ))}
        </Widget>
      )}
    </PushScreen>
  );
}

function PaymentRow({ policy, payment }: { policy: Policy; payment: Payment }) {
  const insurer = insurerById(policy.insurerId);
  return (
    <Item asChild>
      <Link to={`/policies/${policy.id}`}>
        <ItemMedia>
          <InsurerLogo insurer={insurer} />
        </ItemMedia>
        <ItemContent>
          <RowTitle amount={`-${formatEUR(payment.amount)}`}>{POLICY_LABEL[policy.type]}</RowTitle>
          <ItemDescription className={`line-clamp-1 ${payment.status === 'paid' ? '' : 'text-warning'}`}>
            {payment.status === 'paid' ? `Paid ${formatDate(payment.date)}` : `Due ${formatDate(payment.date)}`} · {insurer.name}
          </ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  );
}
