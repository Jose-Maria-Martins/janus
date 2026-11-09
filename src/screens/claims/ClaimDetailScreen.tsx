import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/BottomSheet';
import { PolicyIcon } from '@/components/PolicyIcon';
import { PushScreen, Widget } from '@/components/Screen';
import { insurerById } from '@/data';
import { useStore } from '@/data/store';
import { formatDate } from '@/lib/dates';
import { POLICY_LABEL } from '@/lib/format';
import { policyColor } from '@/lib/policyStyle';
import type { Claim } from '@/types';
import { ClaimStatus } from './ClaimsScreen';

/** A claim: where it stands, what was reported, the photos, and a way to ask about it. */
export function ClaimDetailScreen() {
  const { id } = useParams();
  const { claims, policies } = useStore();
  const claim = claims.find((c) => c.id === id);
  const policy = policies.find((p) => p.id === claim?.policyId);
  const [photo, setPhoto] = useState<string>();

  if (!claim || !policy) return <PushScreen title="Claim not found">{null}</PushScreen>;

  const insurer = insurerById(policy.insurerId);
  const color = policyColor(policy.type);
  const details: [string, string | undefined][] = [
    ['Claim number', claim.number],
    ['Happened', formatDate(claim.date)],
    ['Where', claim.place],
    ['Van', claim.vehicle],
    ['Who was hurt', claim.injured],
    ['Rough cost', claim.cost],
  ];

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
              <PolicyIcon type={policy.type} size={52} />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground/90">
              {POLICY_LABEL[policy.type]} · {insurer.name}
            </p>
            <h1 className="mx-auto mt-2 max-w-sm text-2xl leading-tight font-semibold">{claim.title}</h1>
            <div className="mt-4 flex justify-center">
              <ClaimStatus claim={claim} />
            </div>
          </section>

          <Widget title="Progress">
            <Timeline steps={claim.steps} />
          </Widget>

          <Widget title="Details">
            <dl className="px-3 pb-1">
              {details.map(
                ([label, value]) =>
                  value && (
                    <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ),
              )}
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-sm text-muted-foreground">Policy</dt>
                <dd className="text-right font-medium">
                  <Link to={`/policies/${policy.id}`} className="text-link">
                    {policy.policyNumber}
                  </Link>
                </dd>
              </div>
            </dl>
          </Widget>

          {claim.description && (
            <Widget title="What happened">
              <p className="px-3 pt-1 pb-3">{claim.description}</p>
            </Widget>
          )}

          {claim.photos && claim.photos.length > 0 && (
            <Widget title="Photos">
              <div className="grid grid-cols-3 gap-2 px-3 pt-1 pb-3">
                {claim.photos.map((src, i) => (
                  <button key={i} onClick={() => setPhoto(src)} className="aspect-square overflow-hidden rounded-lg">
                    <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </Widget>
          )}

          <Button asChild size="lg" className="mt-6 w-full">
            <Link to={`/ask?policy=${policy.id}`}>
              <MessageCircle />
              Ask about this claim
            </Link>
          </Button>
        </PushScreen>
      </div>

      <BottomSheet open={!!photo} onClose={() => setPhoto(undefined)} title="Photo">
        {photo && <img src={photo} alt="" className="w-full rounded-lg" />}
      </BottomSheet>
    </>
  );
}

/** Steps as a vertical line: green ticks for what's done, empty rings for what's next. */
function Timeline({ steps }: { steps: Claim['steps'] }) {
  return (
    <ol className="px-3 pt-2 pb-2">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3 pb-5 last:pb-1">
          {i < steps.length - 1 && (
            <span aria-hidden className={`absolute top-6 bottom-0 left-[11px] w-0.5 ${s.done && steps[i + 1].done ? 'bg-success' : 'bg-secondary'}`} />
          )}
          <span
            className={`relative grid size-6 shrink-0 place-items-center rounded-full ${s.done ? 'bg-success text-background' : 'border-2 border-secondary bg-card'}`}
          >
            {s.done && <Check className="size-3.5" strokeWidth={3.5} />}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className={s.done ? 'font-medium' : 'text-muted-foreground'}>{s.label}</p>
            {s.date && <p className="text-sm text-muted-foreground">{formatDate(s.date)}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
