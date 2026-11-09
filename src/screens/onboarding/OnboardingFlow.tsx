import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeftRight, Building2, Check, ClipboardPlus, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Item, ItemContent, ItemDescription, ItemMedia } from '@/components/ui/item';
import { FlowHeading, FlowScreen } from '@/components/FlowScreen';
import { IconCircle } from '@/components/IconCircle';
import { InsurerLogo } from '@/components/InsurerLogo';
import { RowTitle } from '@/components/RowTitle';
import { data, insurerById } from '@/data';
import { getState, setState } from '@/data/store';
import { attentionItems } from '@/lib/attention';
import { formatEUR, initials, POLICY_LABEL } from '@/lib/format';
import { activePolicies, annualTotal } from '@/lib/policy';

type Step = 'welcome' | 'nif' | 'lookup' | 'company' | 'search' | 'found';
const STEPS: Step[] = ['nif', 'lookup', 'company', 'search', 'found'];

const formatNif = (nif: string) => nif.replace(/(\d{3})(?=\d)/g, '$1 ');

/** First visit: NIF → the company is looked up → confirm it → the policies under that NIF are found → Home. */
export function OnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [nif, setNif] = useState('');
  const { company, policies: all } = getState();
  const policies = activePolicies(all);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const finish = (to: string) => {
    setState((s) => ({ ...s, onboarded: true, company: { ...s.company, nif } }));
    navigate(to, { replace: true });
  };

  const flow = (onBack: () => void, content: ReactNode, footer?: ReactNode) => (
    <FlowScreen progress={(STEPS.indexOf(step) + 1) / STEPS.length} onBack={onBack} footer={footer}>
      {content}
    </FlowScreen>
  );

  let screen: ReactNode;

  if (step === 'welcome') {
    screen = (
      <div className="flex min-h-dvh flex-col px-5 pt-[max(48px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="size-9" />
          <span className="text-2xl font-extrabold tracking-tight">janus</span>
        </div>
        <h1 className="mt-14 text-4xl leading-tight font-bold tracking-tight">All your company's insurance, in one app</h1>
        <ul className="mt-10 space-y-5">
          {(
            [
              [ShieldCheck, 'See every policy, what it covers and what it costs'],
              [ArrowLeftRight, 'Compare prices before you renew'],
              [ClipboardPlus, 'Report a claim in a few minutes'],
            ] as const
          ).map(([Icon, text]) => (
            <li key={text} className="flex items-center gap-4">
              <IconCircle className="size-11 bg-primary/15 text-primary">
                <Icon />
              </IconCircle>
              <span className="text-lg">{text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-1 pt-10 pb-[max(20px,env(safe-area-inset-bottom))]">
          <Button size="lg" className="w-full" onClick={() => setStep('nif')}>
            Get started
          </Button>
          <p className="py-3 text-center text-sm text-muted-foreground">Takes about a minute</p>
        </div>
      </div>
    );
  } else if (step === 'nif') {
    screen = flow(
      () => setStep('welcome'),
      <>
        <FlowHeading title="What's your company's NIF?">We'll find your company's details, so you don't have to type them.</FlowHeading>
        <Input
          autoFocus
          inputMode="numeric"
          autoComplete="off"
          value={formatNif(nif)}
          onChange={(e) => setNif(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="123 456 789"
          aria-label="NIF"
          className="mt-6 text-lg tracking-wider tabular-nums"
        />
        <p className="mt-3 px-1 text-sm text-muted-foreground">Any 9 digits work in this demo.</p>
      </>,
      <Button size="lg" className="w-full" disabled={nif.length !== 9} onClick={() => setStep('lookup')}>
        Continue
      </Button>,
    );
  } else if (step === 'lookup') {
    screen = flow(
      () => setStep('nif'),
      <Working
        title="Looking up your company…"
        detail={`NIF ${formatNif(nif)}`}
        checks={['Name and address', 'What the company does', 'Size and payroll']}
        onDone={() => setStep('company')}
      >
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="mx-auto w-fit">
          <IconCircle className="size-24 bg-card text-primary [&_svg]:size-11">
            <Building2 />
          </IconCircle>
        </motion.div>
      </Working>,
    );
  } else if (step === 'company') {
    screen = flow(
      () => setStep('nif'),
      <>
        <FlowHeading title="Is this your company?" />
        <Card className="mt-6 gap-0 px-4 pt-5 pb-1.5">
          <div className="flex items-center gap-4 pb-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold">{initials(company.name)}</span>
            <div className="min-w-0">
              <p className="text-xl leading-tight font-semibold">{company.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">NIF {formatNif(nif)}</p>
            </div>
          </div>
          <dl>
            <Row label="Sector" value={`${company.sector} (CAE ${company.cae})`} />
            <Row label="City" value={company.city} />
            <Row label="People" value={String(company.employees)} />
            <Row label="Revenue" value={company.revenueBand} />
          </dl>
        </Card>
      </>,
      <>
        <Button size="lg" className="w-full" onClick={() => setStep('search')}>
          Yes, that's us
        </Button>
        <Button size="lg" variant="link" className="w-full" onClick={() => setStep('nif')}>
          No, change the NIF
        </Button>
      </>,
    );
  } else if (step === 'search') {
    screen = flow(
      () => setStep('company'),
      <Working
        title="Looking for your policies…"
        detail={`With every insurer in Portugal, under NIF ${formatNif(nif)}`}
        checks={['Insurers in Portugal', 'Policies under your NIF', 'Covers, prices and renewal dates']}
        onDone={() => setStep('found')}
      >
        <div className="flex justify-center -space-x-2">
          {data.insurers.map((insurer, i) => (
            <motion.div key={insurer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.25 }}>
              <InsurerLogo insurer={insurer} size={48} />
            </motion.div>
          ))}
        </div>
      </Working>,
    );
  } else {
    const items = attentionItems();
    const insurers = new Set(policies.map((p) => p.insurerId)).size;
    screen = flow(
      () => setStep('company'),
      <>
        <FlowHeading title={`We found ${policies.length} policies`}>
          With {insurers} insurers, {formatEUR(annualTotal(policies))} a year in total.
        </FlowHeading>
        <Card className="mt-6 py-1.5">
          <div className="px-1.5">
            {policies.map((p) => (
              <Item key={p.id}>
                <ItemMedia>
                  <InsurerLogo insurer={insurerById(p.insurerId)} />
                </ItemMedia>
                <ItemContent>
                  <RowTitle amount={formatEUR(p.annualPremium)}>{POLICY_LABEL[p.type]}</RowTitle>
                  <ItemDescription className="line-clamp-1">
                    {insurerById(p.insurerId).name} · {p.policyNumber}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </div>
        </Card>
        {items.length > 0 && (
          <Card className="mt-3 flex-row items-center gap-4 px-4">
            <IconCircle className="bg-primary/15 text-primary">
              <Sparkles />
            </IconCircle>
            <div className="min-w-0">
              <p className="font-semibold">
                {items.length} thing{items.length > 1 ? 's' : ''} worth a look
              </p>
              <p className="text-sm text-muted-foreground">Like: {items[0].title}</p>
            </div>
          </Card>
        )}
      </>,
      <>
        <Button size="lg" className="w-full" onClick={() => finish('/')}>
          Add them
        </Button>
        <Button size="lg" variant="link" className="w-full" onClick={() => finish('/import')}>
          Import a PDF instead
        </Button>
      </>,
    );
  }

  return <div className="mx-auto min-h-dvh w-full max-w-[560px] bg-background">{screen}</div>;
}

/** A picture, a heading, and three checks ticking off one by one; then moves on. */
function Working({ title, detail, checks, onDone, children }: { title: string; detail: string; checks: string[]; onDone: () => void; children: ReactNode }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const t = done === checks.length ? setTimeout(onDone, 500) : setTimeout(() => setDone((n) => n + 1), 700);
    return () => clearTimeout(t);
  }, [done, checks.length, onDone]);

  return (
    <div className="pt-10 text-center">
      {children}
      <h1 className="mt-8 text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      <ul className="mx-auto mt-8 max-w-[300px] space-y-3 text-left">
        {checks.map((label, i) => (
          <li key={label} className={`flex items-center gap-3 transition-colors ${i < done ? 'text-foreground' : 'text-muted-foreground'}`}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${i < done ? 'bg-success' : 'bg-secondary'}`}>
              {i < done && <Check className="size-3.5" strokeWidth={3.5} />}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
