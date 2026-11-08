import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Check, ChevronRight, FileText, FileUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlowHeading, FlowScreen } from '@/components/FlowScreen';
import { IconCircle } from '@/components/IconCircle';
import { SuccessView } from '@/components/SuccessView';
import { data, insurerById } from '@/data';
import { activityToday, getState, setState, useStore } from '@/data/store';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { FREQUENCY_LABEL, generatePayments } from '@/lib/policy';
import type { Policy, PolicyType } from '@/types';

type Step = 'pick' | 'reading' | 'review' | 'done';
type Form = Pick<Policy, 'insurerId' | 'type' | 'policyNumber' | 'paymentFrequency' | 'startDate' | 'renewalDate'> & { premium: string };

const sample = data.importSample;

/** Upload a PDF (or use the sample) → "Reading your policy…" → check the details → saved. */
export function ImportScreen() {
  const navigate = useNavigate();
  const { policies } = useStore();
  const [alreadyImported] = useState(() => getState().policies.some((p) => p.id === sample.id));
  const [step, setStep] = useState<Step>('pick');
  const [fileName, setFileName] = useState('');
  const [form, setForm] = useState<Form>({
    insurerId: sample.insurerId,
    type: sample.type,
    policyNumber: sample.policyNumber,
    paymentFrequency: sample.paymentFrequency,
    startDate: sample.startDate,
    renewalDate: sample.renewalDate,
    premium: String(sample.annualPremium),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const leave = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
  const seePolicy = () => navigate(`/policies/${sample.id}`, { replace: true });
  const start = (name: string) => {
    setFileName(name);
    setStep('reading');
  };

  const premium = Number(form.premium.replace(/[^\d]/g, ''));
  const datesOk = form.startDate < form.renewalDate;
  const valid = premium > 0 && form.policyNumber.trim() !== '' && datesOk;

  const save = () => {
    const policy: Policy = {
      ...sample,
      insurerId: form.insurerId,
      type: form.type,
      policyNumber: form.policyNumber.trim(),
      paymentFrequency: form.paymentFrequency,
      startDate: form.startDate,
      renewalDate: form.renewalDate,
      annualPremium: premium,
    };
    setState((s) => ({
      ...s,
      policies: [...s.policies, policy],
      payments: [...s.payments, ...generatePayments(policy)],
      activity: [activityToday({ type: 'import', text: `Imported ${POLICY_LABEL[policy.type].toLowerCase()} policy`, policyId: policy.id }), ...s.activity],
    }));
    setStep('done');
  };

  if (alreadyImported && step === 'pick') {
    const p = policies.find((x) => x.id === sample.id)!;
    return (
      <FlowScreen
        first
        onBack={leave}
        footer={
          <Button size="lg" className="w-full" onClick={seePolicy}>
            See policy
          </Button>
        }
      >
        <FlowHeading title="Already imported">
          Your {POLICY_LABEL[p.type].toLowerCase()} policy with {insurerById(p.insurerId).name} is in your policies. This demo has one policy to import.
        </FlowHeading>
      </FlowScreen>
    );
  }

  if (step === 'pick') {
    return (
      <FlowScreen first progress={1 / 3} onBack={leave}>
        <FlowHeading title="Import a policy">Upload the PDF your insurer sent you. Janus reads it and fills in the details for you.</FlowHeading>

        <label className="mt-8 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-input bg-card px-6 py-10 text-center transition-colors hover:bg-muted/60">
          <span className="grid size-14 place-items-center rounded-full bg-primary">
            <FileUp className="size-6" />
          </span>
          <span className="mt-4 text-lg font-semibold">Choose a PDF</span>
          <span className="mt-1 text-sm text-muted-foreground">From your phone or computer</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) start(file.name);
            }}
          />
        </label>

        <Card className="mt-3 py-1.5">
          <div className="px-1.5">
            <Item asChild>
              <button onClick={() => start('group-health-allianz.pdf')}>
                <ItemMedia>
                  <IconCircle>
                    <Sparkles />
                  </IconCircle>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Use a sample policy</ItemTitle>
                  <ItemDescription>
                    {POLICY_LABEL[sample.type]} with {insurerById(sample.insurerId).name}, to try it out
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </ItemActions>
              </button>
            </Item>
          </div>
        </Card>
      </FlowScreen>
    );
  }

  if (step === 'reading') {
    return (
      <FlowScreen progress={2 / 3} onBack={() => setStep('pick')}>
        <Reading fileName={fileName} onDone={() => setStep('review')} />
      </FlowScreen>
    );
  }

  if (step === 'review') {
    const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
    return (
      <FlowScreen
        progress={1}
        onBack={() => setStep('pick')}
        footer={
          <Button size="lg" className="w-full" onClick={save} disabled={!valid}>
            Save policy
          </Button>
        }
      >
        <FlowHeading title="Check the details">We read these from {fileName}. Change anything that's wrong.</FlowHeading>

        <FieldGroup className="mt-6 gap-4">
          <SelectField label="Insurer" value={form.insurerId} onChange={set('insurerId')} options={data.insurers.map((i) => [i.id, i.name])} />
          <SelectField label="Type of cover" value={form.type} onChange={(v) => set('type')(v as PolicyType)} options={Object.entries(POLICY_LABEL)} />
          <Field>
            <FieldLabel htmlFor="policy-number">Policy number</FieldLabel>
            <Input id="policy-number" value={form.policyNumber} onChange={(e) => set('policyNumber')(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="premium">Annual premium (€)</FieldLabel>
            <Input id="premium" inputMode="numeric" value={form.premium} onChange={(e) => set('premium')(e.target.value)} className="tabular-nums" />
          </Field>
          <SelectField
            label="Payments"
            value={form.paymentFrequency}
            onChange={(v) => set('paymentFrequency')(v as Policy['paymentFrequency'])}
            options={Object.entries(FREQUENCY_LABEL)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!datesOk || undefined}>
              <FieldLabel htmlFor="started">Started</FieldLabel>
              <Input id="started" type="date" value={form.startDate} onChange={(e) => set('startDate')(e.target.value)} aria-invalid={!datesOk} />
            </Field>
            <Field data-invalid={!datesOk || undefined}>
              <FieldLabel htmlFor="renews">Renews</FieldLabel>
              <Input id="renews" type="date" value={form.renewalDate} onChange={(e) => set('renewalDate')(e.target.value)} aria-invalid={!datesOk} />
            </Field>
          </div>
          {!datesOk && <FieldError>The renewal date must be after the start date.</FieldError>}
        </FieldGroup>

        <Card className="mt-6 gap-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Also found in the document</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sample.covered.map((c) => (
                <li key={c.name} className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-success" strokeWidth={3} />
                  {c.name}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Plus {sample.notCovered.length} exclusions and answers to {sample.questions.length} common questions.
            </p>
          </CardContent>
        </Card>
      </FlowScreen>
    );
  }

  // Done
  const total = policies.reduce((sum, p) => sum + p.annualPremium, 0);
  return (
    <FlowScreen
      first
      onBack={leave}
      footer={
        <>
          <Button size="lg" className="w-full" onClick={seePolicy}>
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
          title="Policy added"
          lines={[
            `${POLICY_LABEL[form.type]} with ${insurerById(form.insurerId).name} is now in your policies.`,
            `Your total premium is now ${formatEUR(total)} a year.`,
          ]}
        />
      </div>
    </FlowScreen>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  const id = label.toLowerCase().replace(/\W+/g, '-');
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const READ_STEPS = ['Insurer and policy number', 'Covers, limits and exclusions', 'Dates and payments'];

/** A document being scanned, with three checks ticking off, then moves on. */
function Reading({ fileName, onDone }: { fileName: string; onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done === READ_STEPS.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((n) => n + 1), 800);
    return () => clearTimeout(t);
  }, [done, onDone]);

  return (
    <div className="pt-10 text-center">
      <div className="relative mx-auto grid h-36 w-28 place-items-center overflow-hidden rounded-lg bg-card">
        <FileText className="size-12 text-muted-foreground" />
        <motion.div
          className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-primary/50 to-transparent"
          initial={{ top: '-25%' }}
          animate={{ top: ['-25%', '95%', '-25%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <h1 className="mt-8 text-2xl font-bold">Reading your policy…</h1>
      <p className="mt-1 truncate text-sm text-muted-foreground">{fileName}</p>

      <ul className="mx-auto mt-8 max-w-[300px] space-y-3 text-left">
        {READ_STEPS.map((label, i) => (
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
