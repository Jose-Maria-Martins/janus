import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeftRight, BadgeCheck, Check, Download, FileText, MessageCircle, PenLine, Receipt, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { IconCircle } from '@/components/IconCircle';
import { InsurerLogo } from '@/components/InsurerLogo';
import { QuickAction } from '@/components/QuickAction';
import { RowTitle } from '@/components/RowTitle';
import { PushScreen, Widget } from '@/components/Screen';
import { useStore } from '@/data/store';
import { insurerById } from '@/data';
import { RENEWAL_WINDOW_DAYS } from '@/lib/attention';
import { daysUntil, formatDate, todayIso } from '@/lib/dates';
import { downloadCertificate, downloadPolicy } from '@/lib/documents';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { priceVsMarket } from '@/lib/market';
import { changeKind, coverName, FREQUENCY_LABEL, policyPayments, policyStatus } from '@/lib/policy';
import { policyColor } from '@/lib/policyStyle';
import type { Policy } from '@/types';
import { CertificateSheet } from './CertificateSheet';
import { ChangeSheet } from './ChangeSheet';

export function PolicyDetailScreen() {
  const { id } = useParams();
  const { policies, company, certificates } = useStore();
  const policy = policies.find((p) => p.id === id);
  const [sheet, setSheet] = useState<'certificate' | 'change'>();

  if (!policy) return <PushScreen title="Policy not found">{null}</PushScreen>;

  const insurer = insurerById(policy.insurerId);
  const days = daysUntil(policy.renewalDate);
  const soon = days <= RENEWAL_WINDOW_DAYS;
  const market = priceVsMarket(policy);
  const color = policyColor(policy.type);
  const kind = changeKind(policy.type);
  const status = policyStatus(policy, policies);
  /** A policy being switched away from, or not started yet, has nothing to compare. */
  const canSwitch = !policy.replacedBy && policy.startDate <= todayIso();
  const compareTo = `/buy/switch/${policy.id}`;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{ background: `linear-gradient(180deg, ${color}b0 0px, ${color}50 200px, ${color}00 480px)` }}
      />

      <div className="relative">
        <PushScreen>
          <section className="pt-2 text-center">
            <div className="flex justify-center">
              <InsurerLogo insurer={insurer} size={52} />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground/90">
              {POLICY_LABEL[policy.type]} · {insurer.name}
            </p>
            <p className="mt-2 text-5xl leading-none font-semibold tracking-tight tabular-nums">
              {formatEUR(policy.annualPremium)}
              <span className="ml-1.5 text-lg font-medium tracking-normal text-foreground/70">/ year</span>
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {status?.kind === 'ending' ? (
                <Badge variant="warning">{status.text}</Badge>
              ) : status?.kind === 'starting' ? (
                <Badge variant="secondary">{status.text}</Badge>
              ) : (
                <Badge variant={soon ? 'warning' : 'secondary'}>{soon ? `Renews in ${days} days` : `Renews ${formatDate(policy.renewalDate)}`}</Badge>
              )}
              {status?.kind === 'bought' && <Badge variant="success">{status.text}</Badge>}
              {market?.status === 'above' && <Badge variant="destructive">{formatEUR(market.diff)} above market</Badge>}
              {market?.status === 'fair' && <Badge variant="success">Fair price</Badge>}
            </div>
          </section>

          <nav className="mt-8 flex justify-center gap-1 sm:gap-6">
            <QuickAction onClick={() => setSheet('certificate')} label="Certificate" icon={BadgeCheck} />
            {kind && !policy.replacedBy && <QuickAction onClick={() => setSheet('change')} label="Change" icon={PenLine} />}
            {canSwitch && <QuickAction to={compareTo} label="Compare" icon={ArrowLeftRight} />}
            <QuickAction to={`/ask?policy=${policy.id}`} label="Ask" icon={MessageCircle} />
          </nav>

          <Widget title="Details">
            <dl className="px-3 pb-1">
              <Row label="Policy number" value={policy.policyNumber} />
              <Row label="Payments" value={FREQUENCY_LABEL[policy.paymentFrequency]} />
              <Row label={policy.startDate > todayIso() ? 'Starts' : 'Started'} value={formatDate(policy.startDate)} />
              <Row label={policy.replacedBy ? 'Ends' : 'Renews'} value={formatDate(policy.renewalDate)} />
              {kind === 'employees' && <Row label="Employees covered" value={String(company.employees)} />}
              {kind === 'vehicles' && <Row label="Vans covered" value={String(policy.vehicles?.length ?? 0)} />}
            </dl>
          </Widget>

          <Widget title="What's covered">
            {policy.covered.map((c) => (
              <Item key={c.name}>
                <ItemMedia>
                  <IconCircle className="size-7 bg-success/15 text-success [&_svg]:size-4">
                    <Check strokeWidth={3} />
                  </IconCircle>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="line-clamp-none">{coverName(c.name, policy, company)}</ItemTitle>
                  {(c.limit || c.deductible) && (
                    <ItemDescription>
                      {[c.limit && (/^[€\d]/.test(c.limit) ? `Limit ${c.limit}` : c.limit), c.deductible && `You pay the first ${c.deductible}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </ItemDescription>
                  )}
                </ItemContent>
              </Item>
            ))}
          </Widget>

          {policy.notCovered.length > 0 && (
            <Widget title="What's not covered">
              {policy.notCovered.map((n) => (
                <Item key={n}>
                  <ItemMedia>
                    <IconCircle className="size-7 bg-destructive/15 text-destructive [&_svg]:size-4">
                      <X strokeWidth={3} />
                    </IconCircle>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="line-clamp-none">{n}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </Widget>
          )}

          {policy.questions.length > 0 && (
            <Widget title="Ask about this policy">
              <Accordion type="single" collapsible className="px-3">
                {policy.questions.map((q) => (
                  <AccordionItem key={q.q} value={q.q}>
                    <AccordionTrigger>{q.q}</AccordionTrigger>
                    <AccordionContent className="text-base">
                      <p>{q.a}</p>
                      <div className="rounded-lg bg-secondary px-3.5 py-3 text-sm text-muted-foreground">
                        <p className="text-xs font-semibold tracking-wide text-foreground/70 uppercase">From the policy</p>
                        {q.clause}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button asChild variant="link" className="justify-start self-start px-3">
                <Link to={`/ask?policy=${policy.id}`}>Ask something else</Link>
              </Button>
            </Widget>
          )}

          <Payments policy={policy} />

          <Widget title="Documents">
            <DocRow icon={<FileText />} title="Policy document" subtitle={`PDF · ${policy.policyNumber}`} onClick={() => downloadPolicy(policy)} />
            {certificates
              .filter((c) => c.policyId === policy.id)
              .map((c) => (
                <DocRow
                  key={c.id}
                  icon={<BadgeCheck />}
                  title={`Certificate for ${c.recipient}`}
                  subtitle={`PDF · ${formatDate(c.date)}`}
                  onClick={() => downloadCertificate(policy, c)}
                />
              ))}
          </Widget>

          {canSwitch && (
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to={compareTo}>Compare prices</Link>
            </Button>
          )}
        </PushScreen>
      </div>

      <CertificateSheet policy={policy} open={sheet === 'certificate'} onClose={() => setSheet(undefined)} />
      {kind && <ChangeSheet policy={policy} open={sheet === 'change'} onClose={() => setSheet(undefined)} />}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Payments({ policy }: { policy: Policy }) {
  const payments = policyPayments(policy, useStore().payments);
  if (!payments.length) return null;
  const label = { annual: 'Annual', quarterly: 'Quarterly', monthly: 'Monthly' }[policy.paymentFrequency];

  return (
    <Widget title="Payments">
      {payments.map((p) => (
        <Item key={p.id}>
          <ItemMedia>
            <IconCircle>
              <Receipt />
            </IconCircle>
          </ItemMedia>
          <ItemContent>
            <RowTitle amount={`-${formatEUR(p.amount)}`}>{label} premium</RowTitle>
            <ItemDescription className={p.status === 'paid' ? '' : 'text-warning'}>
              {p.status === 'paid' ? `Paid ${formatDate(p.date)}` : `Due ${formatDate(p.date)}`}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </Widget>
  );
}

function DocRow({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <Item asChild>
      <button onClick={onClick}>
        <ItemMedia>
          <IconCircle>{icon}</IconCircle>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription>{subtitle}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Download className="size-5 text-muted-foreground" />
        </ItemActions>
      </button>
    </Item>
  );
}
