import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FlowHeading, FlowScreen } from '@/components/FlowScreen';
import { InsurerLogo } from '@/components/InsurerLogo';
import { SuccessView } from '@/components/SuccessView';
import { data, insurerById } from '@/data';
import { activityToday, getState, setState } from '@/data/store';
import { buildPolicy, detailsFor, firstPayment, offers, VAN_COVER, type Details, type Offer, type VanCover } from '@/lib/buy';
import { formatDate } from '@/lib/dates';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { lookUpPlate, plateKey } from '@/lib/plates';
import { activePolicies, heldTypes, INSTALMENTS } from '@/lib/policy';
import type { Policy, PolicyType, Vehicle } from '@/types';

type Step = 'details' | 'vans' | 'cover' | 'offers' | 'review' | 'done';

const PER: Record<Policy['paymentFrequency'], [string, string]> = {
  annual: ['Yearly', 'a year'],
  quarterly: ['Quarterly', 'every 3 months'],
  monthly: ['Monthly', 'a month'],
};

/** What is being bought, read once so the flow doesn't change under the user after buying. */
function setUp(mode?: string, id?: string): { type: PolicyType; replacing?: Policy } | { redirect: string } {
  const { policies } = getState();
  if (mode === 'switch') {
    const p = policies.find((x) => x.id === id && !x.replacedBy);
    return p ? { type: p.type, replacing: p } : { redirect: '/buy' };
  }
  const type = id as PolicyType;
  if (!(type in POLICY_LABEL)) return { redirect: '/buy?tab=add' };
  if (heldTypes(policies).has(type)) {
    const p = activePolicies(policies).find((x) => x.type === (type === 'vehicles_own_damage' ? 'vehicles' : type));
    return { redirect: p ? `/buy/switch/${p.id}` : '/buy?tab=add' };
  }
  return { type };
}

/** Switch a policy (/buy/switch/:id) or add cover (/buy/add/:type): details → offers → review → covered. */
export function BuyFlow() {
  const { mode, id } = useParams();
  const [setup] = useState(() => setUp(mode, id));
  if ('redirect' in setup) return <Navigate to={setup.redirect} replace />;
  return <Flow type={setup.type} replacing={setup.replacing} />;
}

function Flow({ type, replacing }: { type: PolicyType; replacing?: Policy }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState<Details>(() => detailsFor(getState().company, getState().policies, replacing));
  const [allVans, setAllVans] = useState(details.vans);
  const [offer, setOffer] = useState<Offer>();
  const [frequency, setFrequency] = useState<Policy['paymentFrequency']>(replacing?.paymentFrequency ?? 'annual');
  const [bought, setBought] = useState<Policy>();

  const steps: Step[] =
    type === 'vehicles'
      ? ['vans', 'cover', 'offers', 'review']
      : type === 'vehicles_own_damage'
        ? ['vans', 'offers', 'review']
        : ['details', 'offers', 'review'];
  const [step, setStep] = useState<Step>(steps[0]);
  const index = steps.indexOf(step);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const leave = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/buy'));
  const back = () => (index > 0 ? setStep(steps[index - 1]) : leave());
  const next = () => setStep(steps[index + 1]);

  const label = POLICY_LABEL[type];
  const gap = data.gaps.find((g) => g.type === type);
  const current = replacing && insurerById(replacing.insurerId);
  const list = offers(type, details, replacing?.insurerId);
  const flow = (content: ReactNode, footer?: ReactNode) => (
    <FlowScreen first={index === 0} progress={(index + 1) / steps.length} onBack={back} footer={footer}>
      {content}
    </FlowScreen>
  );
  const continueButton = (disabled = false) => (
    <Button size="lg" className="w-full" onClick={next} disabled={disabled}>
      Continue
    </Button>
  );
  const intro = replacing ? `Compare ${label.toLowerCase()}` : (gap?.title ?? label);

  if (step === 'details') {
    const team = type === 'work_accident' || type === 'health';
    const valid = details.employees > 0 && details.payroll > 0;
    return flow(
      <>
        <FlowHeading title={intro}>
          {replacing
            ? `We'll get prices for the same cover you have with ${current!.name}.`
            : `${gap?.protectsAgainst ?? ''} Insurers price it from your company details.`}
        </FlowHeading>
        {team ? (
          <FieldGroup className="mt-6 gap-4">
            <NumberField id="employees" label="Employees" value={details.employees} onChange={(employees) => setDetails((d) => ({ ...d, employees }))} />
            {type === 'work_accident' && (
              <NumberField id="payroll" label="Annual payroll (€)" value={details.payroll} onChange={(payroll) => setDetails((d) => ({ ...d, payroll }))} />
            )}
          </FieldGroup>
        ) : (
          <CompanyCard />
        )}
      </>,
      continueButton(team && !valid),
    );
  }

  if (step === 'vans') {
    return flow(
      <>
        <FlowHeading title={type === 'vehicles' ? (replacing ? 'Which vans?' : intro) : intro}>
          {type === 'vehicles_own_damage' && `${gap?.protectsAgainst} `}
          {details.vans.length} of {allVans.length} vans selected.
        </FlowHeading>
        <VanPicker
          all={allVans}
          selected={details.vans}
          onChange={(vans) => setDetails((d) => ({ ...d, vans }))}
          onAdd={(van) => {
            setAllVans((list) => [...list, van]);
            setDetails((d) => ({ ...d, vans: [...d.vans, van] }));
          }}
        />
      </>,
      continueButton(details.vans.length === 0),
    );
  }

  if (step === 'cover') {
    const today = replacing && detailsFor(getState().company, getState().policies, replacing).cover;
    return flow(
      <>
        <FlowHeading title="What cover?">You can change this at renewal.</FlowHeading>
        <RadioGroup value={details.cover} onValueChange={(cover) => setDetails((d) => ({ ...d, cover: cover as VanCover }))} className="mt-6 gap-2">
          {(Object.keys(VAN_COVER) as VanCover[]).map((c) => (
            <Label
              key={c}
              htmlFor={`cover-${c}`}
              className="flex cursor-pointer items-center gap-4 rounded-xl bg-card px-4 py-4 has-data-[state=checked]:ring-2 has-data-[state=checked]:ring-primary"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-base font-semibold">
                  {VAN_COVER[c].label}
                  {c === today && <Badge variant="secondary">Today</Badge>}
                </span>
                <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{VAN_COVER[c].description}</span>
              </span>
              <RadioGroupItem id={`cover-${c}`} value={c} />
            </Label>
          ))}
        </RadioGroup>
      </>,
      continueButton(),
    );
  }

  if (step === 'offers') {
    return flow(
      <>
        <FlowHeading title={`${list.length} offers`}>
          {type === 'vehicles' && `${details.vans.length} vans, ${VAN_COVER[details.cover].label.toLowerCase()}. `}
          {replacing ? `You pay ${current!.name} ${formatEUR(replacing.annualPremium)} a year today.` : 'Cheapest first. Pick one to see the details.'}
        </FlowHeading>
        <div className="mt-6 flex flex-col gap-3">
          {list.map((o, i) => (
            <OfferCard
              key={o.id}
              offer={o}
              best={i === 0}
              diff={replacing && replacing.annualPremium - o.price}
              onPick={() => {
                setOffer(o);
                next();
              }}
            />
          ))}
        </div>
      </>,
    );
  }

  if (step === 'review' && offer) {
    const insurer = insurerById(offer.insurerId);
    const start = replacing?.renewalDate;
    const instalment = Math.round(offer.price / INSTALMENTS[frequency]);
    const action = replacing ? `Switch to ${insurer.name}` : `Buy for ${formatEUR(offer.price)} a year`;

    const buy = () => {
      const policy = buildPolicy({ offer, details, frequency, replacing });
      const payment = firstPayment(policy);
      setState((s) => ({
        ...s,
        // A switch is listed right after the policy it replaces; new cover goes last.
        policies: replacing ? s.policies.flatMap((p) => (p.id === replacing.id ? [{ ...p, replacedBy: policy.id }, policy] : [p])) : [...s.policies, policy],
        payments: [...s.payments, payment],
        activity: [
          activityToday({
            type: 'purchase',
            text: replacing ? `Switched ${label.toLowerCase()} to ${insurer.name}` : `Bought ${label.toLowerCase()} with ${insurer.name}`,
            policyId: policy.id,
            amount: payment.status === 'paid' ? -payment.amount : undefined,
          }),
          ...s.activity,
        ],
      }));
      setBought(policy);
      setStep('done');
    };

    return flow(
      <>
        <FlowHeading title="Review and buy" />
        <Card className="mt-6 flex-row items-center gap-4 px-4">
          <InsurerLogo insurer={insurer} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{insurer.name}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
          <p className="text-right text-xl font-semibold tabular-nums">
            {formatEUR(offer.price)}
            <span className="block text-sm font-normal text-muted-foreground">a year</span>
          </p>
        </Card>

        <Card className="mt-3 gap-0 px-4 py-1.5">
          <dl>
            <Row label="Starts" value={start ? formatDate(start) : 'Today'} />
            <Row label="Covers" value={coverSummary(type, details, offer, !!replacing)} />
            <Row label="Pay with" value={`${data.paymentMethod.label} · ${data.paymentMethod.detail}`} />
          </dl>
        </Card>

        <p className="mt-6 mb-2 text-sm font-medium text-muted-foreground">How often do you want to pay?</p>
        <ToggleGroup type="single" value={frequency} onValueChange={(v) => v && setFrequency(v as Policy['paymentFrequency'])} className="w-full">
          {(Object.keys(PER) as Policy['paymentFrequency'][]).map((f) => (
            <ToggleGroupItem key={f} value={f} className="flex-1">
              {PER[f][0]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatEUR(instalment)} {PER[frequency][1]}
          {start ? `, from ${formatDate(start)}.` : ', first payment today.'}
        </p>

        <p className="mt-6 text-sm text-muted-foreground">
          {replacing && `We'll tell ${current!.name} your policy ends on ${formatDate(start!)}. You don't need to do anything. `}
          By tapping “{action}” you accept {insurer.name}'s policy terms.
        </p>
      </>,
      <Button size="lg" className="w-full" onClick={buy}>
        {action}
      </Button>,
    );
  }

  // Done
  const policy = bought!;
  const insurer = insurerById(policy.insurerId);
  return (
    <FlowScreen
      first
      onBack={leave}
      footer={
        <>
          <Button size="lg" className="w-full" onClick={() => navigate(`/policies/${policy.id}`, { replace: true })}>
            See policy
          </Button>
          <Button size="lg" variant="link" className="w-full" onClick={leave}>
            Done
          </Button>
        </>
      }
    >
      <div className="pt-12">
        <SuccessView
          title="You're covered"
          lines={
            replacing
              ? [
                  `Your ${label.toLowerCase()} policy with ${insurer.name} starts on ${formatDate(policy.startDate)}.`,
                  `${current!.name} covers you until then.`,
                ]
              : [`${label} with ${insurer.name} covers you from today.`, `Policy number ${policy.policyNumber}.`]
          }
        />
      </div>
    </FlowScreen>
  );
}

function coverSummary(type: PolicyType, d: Details, offer: Offer, switching: boolean) {
  if (type === 'work_accident') return `${d.employees} employees · ${formatEUR(d.payroll)} payroll`;
  if (type === 'health') return `${d.employees} employees`;
  if (type === 'vehicles') return `${d.vans.length} vans · ${VAN_COVER[d.cover].label}`;
  if (type === 'vehicles_own_damage') return `${d.vans.length} vans`;
  return switching ? 'Same limits as today' : offer.highlights[0];
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function NumberField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        inputMode="numeric"
        value={value ? value.toLocaleString('en-IE') : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')))}
        className="tabular-nums"
      />
    </Field>
  );
}

/** The company as insurers will see it, filled in from the NIF. */
function CompanyCard() {
  const { company } = getState();
  return (
    <>
      <Card className="mt-6 gap-0 px-4 py-1.5">
        <dl>
          <Row label="Company" value={company.name} />
          <Row label="NIF" value={company.nif} />
          <Row label="Sector" value={company.sector} />
          <Row label="Employees" value={String(company.employees)} />
          <Row label="City" value={company.city} />
        </dl>
      </Card>
      <p className="mt-3 px-1 text-sm text-muted-foreground">Filled in from your NIF.</p>
    </>
  );
}

function VanPicker({ all, selected, onChange, onAdd }: { all: Vehicle[]; selected: Vehicle[]; onChange: (v: Vehicle[]) => void; onAdd: (v: Vehicle) => void }) {
  const [adding, setAdding] = useState(false);
  const [plate, setPlate] = useState('');
  const key = plateKey(plate);
  const duplicate = all.some((v) => plateKey(v.plate) === key);
  const isOn = (plate: string) => selected.some((v) => v.plate === plate);

  return (
    <>
      <Card className="mt-6 gap-0 px-4 py-1.5">
        {all.map((v) => (
          <Label key={v.plate} htmlFor={`van-${v.plate}`} className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
            <span>
              <span className="block text-base font-medium">{v.plate}</span>
              <span className="block text-sm font-normal text-muted-foreground">
                {v.model} · {v.year}
              </span>
            </span>
            <Checkbox
              id={`van-${v.plate}`}
              checked={isOn(v.plate)}
              onCheckedChange={(on) => onChange(on ? [...selected, v] : selected.filter((s) => s.plate !== v.plate))}
            />
          </Label>
        ))}
      </Card>

      {adding ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (key.length !== 6 || duplicate) return;
            onAdd(lookUpPlate(key));
            setPlate('');
            setAdding(false);
          }}
        >
          <Input
            autoFocus
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Plate, e.g. AB-12-CD"
            className="uppercase placeholder:normal-case"
            aria-invalid={duplicate}
          />
          <Button type="submit" variant="secondary" className="h-12" disabled={key.length !== 6 || duplicate}>
            Add
          </Button>
        </form>
      ) : (
        <Button variant="link" className="mt-1 px-1" onClick={() => setAdding(true)}>
          <Plus />
          Add another van
        </Button>
      )}
      {duplicate && <p className="mt-2 px-1 text-sm text-destructive">This van is already on the list.</p>}
    </>
  );
}

function OfferCard({ offer, best, diff, onPick }: { offer: Offer; best: boolean; diff?: number; onPick: () => void }) {
  const insurer = insurerById(offer.insurerId);
  return (
    <button onClick={onPick} className="rounded-xl text-left transition-transform active:scale-[0.99]">
      <Card className="gap-3 px-4 transition-colors hover:bg-muted">
        <div className="flex items-center gap-3">
          <InsurerLogo insurer={insurer} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{insurer.name}</p>
            {diff !== undefined ? (
              <p className={`text-sm ${diff > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                {diff > 0 ? `Save ${formatEUR(diff)} a year` : `${formatEUR(-diff)} more than today`}
              </p>
            ) : (
              best && <Badge variant="success">Best price</Badge>
            )}
          </div>
          <p className="text-right text-xl font-semibold tabular-nums">
            {formatEUR(offer.price)}
            <span className="block text-sm font-normal text-muted-foreground">a year</span>
          </p>
        </div>
        <ul className="space-y-1.5">
          {offer.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2.5 text-sm">
              <Check className="size-4 shrink-0 text-success" strokeWidth={3} />
              {h}
            </li>
          ))}
        </ul>
      </Card>
    </button>
  );
}
