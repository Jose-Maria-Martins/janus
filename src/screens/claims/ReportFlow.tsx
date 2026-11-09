import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Camera, Check, ChevronRight, LoaderCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Textarea } from '@/components/ui/textarea';
import { FlowHeading, FlowScreen } from '@/components/FlowScreen';
import { IconCircle } from '@/components/IconCircle';
import { PolicyIcon } from '@/components/PolicyIcon';
import { Widget } from '@/components/Screen';
import { SuccessView } from '@/components/SuccessView';
import { insurerById } from '@/data';
import { activityToday, getState, setState } from '@/data/store';
import { buildClaim, categories, checkCover, claimablePolicies, claimTitle, COSTS, draftDescription, type Category } from '@/lib/claims';
import { addDays, formatDate, todayIso } from '@/lib/dates';
import { POLICY_LABEL } from '@/lib/format';
import { compressPhoto } from '@/lib/photos';
import type { Claim, Policy } from '@/types';

type Step = 'policy' | 'what' | 'check' | 'van' | 'who' | 'when' | 'where' | 'cost' | 'photos' | 'describe' | 'review' | 'done';

const MAX_PHOTOS = 6;
const PLACES = ['Our warehouse, Lisboa', 'A building site', 'On the road'];

/** Report a claim, one question per screen. /claims/new?policy=p2 starts with the policy picked. */
export function ReportFlow() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [policies] = useState(() => claimablePolicies(getState().policies));
  const preset = policies.find((p) => p.id === params.get('policy'));

  const [policy, setPolicy] = useState<Policy | undefined>(preset);
  const [category, setCategory] = useState<Category>();
  const [vehicle, setVehicle] = useState<string>();
  const [injured, setInjured] = useState('');
  const [date, setDate] = useState(todayIso());
  const [otherDay, setOtherDay] = useState(false);
  const [place, setPlace] = useState('');
  const [cost, setCost] = useState<string>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [edited, setEdited] = useState(false);
  const [sent, setSent] = useState<Claim>();

  const type = policy?.type;
  const vans = type === 'vehicles' || type === 'vehicles_own_damage';
  const steps: Step[] = [
    ...(preset ? [] : (['policy'] as Step[])),
    'what',
    'check',
    ...(vans ? (['van'] as Step[]) : type === 'work_accident' ? (['who'] as Step[]) : []),
    'when',
    'where',
    ...(type === 'work_accident' ? [] : (['cost'] as Step[])),
    'photos',
    'describe',
    'review',
  ];
  const [step, setStep] = useState<Step>(steps[0]);
  const index = steps.indexOf(step);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const leave = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/claims'));
  const back = () => (index > 0 ? setStep(steps[index - 1]) : leave());
  const answers = () => ({ policy: policy!, category: category!, vehicle, injured: injured.trim() || undefined, date, place: place.trim(), cost, photos });
  const next = () => {
    const to = steps[index + 1];
    // The draft follows the answers until the user edits it.
    if (to === 'describe' && !edited) setDescription(draftDescription(answers()));
    setStep(to);
  };

  const insurer = policy && insurerById(policy.insurerId);
  const flow = (content: ReactNode, footer?: ReactNode) => (
    <FlowScreen first={index === 0} progress={(index + 1) / steps.length} onBack={back} footer={footer}>
      {content}
    </FlowScreen>
  );
  const continueButton = (disabled = false, label = 'Continue') => (
    <Button size="lg" className="w-full" onClick={next} disabled={disabled}>
      {label}
    </Button>
  );

  if (step === 'policy') {
    return flow(
      <>
        <FlowHeading title="Which policy?">Pick the one that covers what happened.</FlowHeading>
        <Widget>
          {policies.map((p) => (
            <Item key={p.id} asChild>
              <button
                onClick={() => {
                  setPolicy(p);
                  setCategory(undefined);
                  setVehicle(undefined);
                  setStep('what');
                }}
              >
                <ItemMedia>
                  <PolicyIcon type={p.type} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{POLICY_LABEL[p.type]}</ItemTitle>
                  <ItemDescription>
                    {insurerById(p.insurerId).name} · {p.policyNumber}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </ItemActions>
              </button>
            </Item>
          ))}
        </Widget>
      </>,
    );
  }

  if (!policy || !insurer) return null;

  if (step === 'what') {
    return flow(
      <>
        <FlowHeading title="What happened?">
          {POLICY_LABEL[policy.type]} with {insurer.name}
        </FlowHeading>
        <Choices
          options={categories(policy).map((c) => ({ value: c.id, label: c.label }))}
          selected={category?.id}
          onPick={(id) => {
            setCategory(categories(policy).find((c) => c.id === id));
            next();
          }}
        />
      </>,
    );
  }

  if (step === 'check' && category) {
    const check = checkCover(policy, category);
    if (check.result === 'no') {
      return flow(
        <>
          <Verdict ok={false} />
          <FlowHeading title="This isn't covered">
            {check.reason ? (
              <>
                Your {insurer.name} policy doesn't cover “{check.reason}”. {insurer.name} would most likely turn the claim down.
              </>
            ) : (
              <>Your {insurer.name} policy doesn't list this, so it's most likely not covered.</>
            )}
          </FlowHeading>
          <Source policy={policy} part="What's not covered" />
        </>,
        <>
          <Button asChild size="lg" className="w-full">
            {category.gap ? <Link to={`/buy/add/${category.gap}`}>Get covered for next time</Link> : <Link to={`/ask?policy=${policy.id}`}>Ask us about it</Link>}
          </Button>
          <Button size="lg" variant="link" className="w-full" onClick={next}>
            Report it anyway
          </Button>
        </>,
      );
    }
    if (check.result === 'yes') {
      const { limit, deductible } = check.cover;
      return flow(
        <>
          <Verdict ok />
          <FlowHeading title="Yes, you're covered">
            {insurer.name} pays for {check.cover.name.charAt(0).toLowerCase() + check.cover.name.slice(1).replace(/ \(\d+ \w+\)$/, '')}.
          </FlowHeading>
          {(limit || deductible) && (
            <Card className="mt-6 gap-0 px-4 py-1.5">
              <dl>
                {limit && <Row label="Up to" value={limit} />}
                {deductible && (deductible === '€0' ? <Row label="You pay" value="Nothing" /> : <Row label="You pay the first" value={deductible} />)}
              </dl>
            </Card>
          )}
          <Source policy={policy} part="What's covered" />
        </>,
        continueButton(),
      );
    }
    return flow(
      <>
        <FlowHeading title={`${insurer.name} will check`}>
          Tell us what happened and we'll send it to {insurer.name}. They decide if it's covered, usually within a few days.
        </FlowHeading>
      </>,
      continueButton(),
    );
  }

  if (step === 'van') {
    return flow(
      <>
        <FlowHeading title="Which van?" />
        <Choices
          options={(policy.vehicles ?? []).map((v) => ({ value: v.plate, label: v.plate, description: `${v.model} · ${v.year}` }))}
          selected={vehicle}
          onPick={(plate) => {
            setVehicle(plate);
            next();
          }}
        />
      </>,
    );
  }

  if (step === 'who') {
    return flow(
      <>
        <FlowHeading title="Who was hurt?">Their name, as on the payroll sent to {insurer.name}.</FlowHeading>
        <Input autoFocus value={injured} onChange={(e) => setInjured(e.target.value)} placeholder="Full name" className="mt-6" aria-label="Full name" />
      </>,
      continueButton(!injured.trim()),
    );
  }

  if (step === 'when') {
    const today = todayIso();
    const yesterday = addDays(today, -1);
    return flow(
      <>
        <FlowHeading title="When did it happen?" />
        <Choices
          options={[
            { value: today, label: 'Today' },
            { value: yesterday, label: 'Yesterday' },
            { value: 'other', label: 'Another day' },
          ]}
          selected={otherDay ? 'other' : date === today || date === yesterday ? date : undefined}
          onPick={(v) => {
            if (v === 'other') {
              setOtherDay(true);
              if (date >= yesterday) setDate(addDays(today, -2));
              return;
            }
            setOtherDay(false);
            setDate(v);
            next();
          }}
        />
        {otherDay && (
          <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="mt-3 [color-scheme:dark]" aria-label="Date" />
        )}
      </>,
      otherDay && continueButton(!date || date > today),
    );
  }

  if (step === 'where') {
    return flow(
      <>
        <FlowHeading title="Where did it happen?" />
        <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Address or place" className="mt-6" aria-label="Where" />
        <div className="mt-3 flex flex-wrap gap-2">
          {PLACES.map((p) => (
            <Button key={p} variant="secondary" size="sm" onClick={() => setPlace(p)}>
              {p}
            </Button>
          ))}
        </div>
      </>,
      continueButton(!place.trim()),
    );
  }

  if (step === 'cost') {
    return flow(
      <>
        <FlowHeading title="Roughly how much will it cost?">A guess is fine. It helps {insurer.name} send the right person.</FlowHeading>
        <Choices
          options={COSTS.map((c) => ({ value: c, label: c }))}
          selected={cost}
          onPick={(c) => {
            setCost(c);
            next();
          }}
        />
      </>,
    );
  }

  if (step === 'photos') {
    return flow(
      <>
        <FlowHeading title="Add photos">Of the damage, and anything that shows what happened. Up to {MAX_PHOTOS}.</FlowHeading>
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </>,
      continueButton(false, photos.length ? 'Continue' : 'Skip for now'),
    );
  }

  if (step === 'describe') {
    return flow(
      <>
        <FlowHeading title="Check the description">We wrote this from your answers. Add anything we missed.</FlowHeading>
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setEdited(true);
          }}
          className="mt-6"
          aria-label="What happened"
        />
      </>,
      continueButton(!description.trim()),
    );
  }

  if (step === 'review' && category) {
    const send = () => {
      const claim = buildClaim(answers(), description.trim());
      setState((s) => ({
        ...s,
        claims: [claim, ...s.claims],
        activity: [activityToday({ type: 'claim', text: `Claim opened: ${claim.title}`, claimId: claim.id, policyId: policy.id }), ...s.activity],
      }));
      setSent(claim);
      setStep('done');
    };
    return flow(
      <>
        <FlowHeading title="Review and send" />
        <Card className="mt-6 flex-row items-center gap-4 px-4">
          <PolicyIcon type={policy.type} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{claimTitle({ category, vehicle })}</p>
            <p className="text-sm text-muted-foreground">
              {POLICY_LABEL[policy.type]} · {insurer.name}
            </p>
          </div>
        </Card>
        <Card className="mt-3 gap-0 px-4 py-1.5">
          <dl>
            <Row label="When" value={formatDate(date)} />
            <Row label="Where" value={place} />
            {injured.trim() && <Row label="Who was hurt" value={injured.trim()} />}
            {cost && <Row label="Rough cost" value={cost} />}
            <Row label="Photos" value={photos.length ? String(photos.length) : 'None'} />
          </dl>
        </Card>
        <p className="mt-3 px-1 text-sm text-muted-foreground">{description}</p>
        <p className="mt-6 text-sm text-muted-foreground">
          We send this to {insurer.name} with your policy number {policy.policyNumber}. You'll see their reply here.
        </p>
      </>,
      <Button size="lg" className="w-full" onClick={send}>
        Send to {insurer.name}
      </Button>,
    );
  }

  if (step === 'done' && sent) {
    return (
      <FlowScreen
        first
        onBack={leave}
        footer={
          <>
            <Button size="lg" className="w-full" onClick={() => navigate(`/claims/${sent.id}`, { replace: true })}>
              See claim
            </Button>
            <Button size="lg" variant="link" className="w-full" onClick={leave}>
              Done
            </Button>
          </>
        }
      >
        <div className="pt-12">
          <SuccessView
            title="Claim sent"
            lines={[`Your claim number is ${sent.number}.`, `${insurer.name} usually replies within 2 working days. We'll let you know.`]}
          />
        </div>
      </FlowScreen>
    );
  }

  return null;
}

/** Tappable rows; tapping one answers the question. */
function Choices({
  options,
  selected,
  onPick,
}: {
  options: { value: string; label: string; description?: string }[];
  selected?: string;
  onPick: (value: string) => void;
}) {
  return (
    <Widget>
      {options.map((o) => (
        <Item key={o.value} asChild>
          <button onClick={() => onPick(o.value)}>
            <ItemContent>
              <ItemTitle className="line-clamp-none">{o.label}</ItemTitle>
              {o.description && <ItemDescription>{o.description}</ItemDescription>}
            </ItemContent>
            <ItemActions>
              {o.value === selected ? <Check className="size-5 text-primary" strokeWidth={3} /> : <ChevronRight className="size-5 text-muted-foreground" />}
            </ItemActions>
          </button>
        </Item>
      ))}
    </Widget>
  );
}

function Verdict({ ok }: { ok: boolean }) {
  return (
    <IconCircle className={`mb-5 size-14 [&_svg]:size-7 ${ok ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
      {ok ? <Check strokeWidth={3} /> : <X strokeWidth={3} />}
    </IconCircle>
  );
}

/** Where the answer comes from, linking to the policy. */
function Source({ policy, part }: { policy: Policy; part: string }) {
  return (
    <Link to={`/policies/${policy.id}`} className="mt-4 block px-1 text-sm text-muted-foreground hover:text-foreground">
      From policy {policy.policyNumber} · {part}
    </Link>
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

function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const added = await Promise.all([...files].slice(0, room).map((f) => compressPhoto(f)));
      onChange([...photos, ...added]);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="mt-6 grid grid-cols-3 gap-2">
      {photos.map((src, i) => (
        <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
          <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
          <button
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
            className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white"
            aria-label={`Remove photo ${i + 1}`}
          >
            <X className="size-4" strokeWidth={3} />
          </button>
        </div>
      ))}
      {photos.length < MAX_PHOTOS && (
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg bg-secondary text-sm font-medium transition-colors hover:bg-muted"
        >
          {busy ? <LoaderCircle className="size-6 animate-spin" /> : <Camera className="size-6" />}
          Add photo
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
    </div>
  );
}
