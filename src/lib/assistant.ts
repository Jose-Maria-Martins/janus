import { data, insurerById } from '../data';
import type { AssistantAnswer, Policy } from '../types';
import { formatDate } from './dates';
import { formatEUR, POLICY_LABEL } from './format';

export type Answer = { q: string; a: string; source: { label: string; to?: string } };

/** Words that say nothing about which answer is meant. */
const STOP = new Set(
  'a an and are am be can do does has much for get gets how i if in is it me my of on or our the to us we what when which who why will with you your this that there cover covered insurance insured policy policies'.split(
    ' ',
  ),
);

/** Different words for the same thing (in the singular), mapped to the word the questions use. */
const SAME = new Map(
  Object.entries({
    car: 'van',
    vehicle: 'van',
    truck: 'van',
    theft: 'stolen',
    steal: 'stolen',
    stole: 'stolen',
    employee: 'worker',
    staff: 'worker',
    injured: 'hurt',
    injury: 'hurt',
    water: 'flood',
    cost: 'pay',
    spend: 'pay',
    price: 'pay',
    premium: 'pay',
    renewal: 'renew',
    expire: 'renew',
    contractor: 'subcontractor',
  }),
);

/** The words of a question that matter, singular and with synonyms merged. */
function words(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().match(/[a-zà-ÿ]+/g) ?? []) {
    if (STOP.has(raw) || raw.length < 3) continue;
    const w = raw.replace(/s$/, '');
    out.add(SAME.get(w) ?? w);
  }
  return out;
}

/** Turns "Art. 2.3 — Storms and floods." into a short source line for the policy. */
const policySource = (p: Policy, clause?: string) => ({
  label: [`${POLICY_LABEL[p.type]} ${p.policyNumber}`, clause?.replace(/\.$/, '')].filter(Boolean).join(' · '),
  to: `/policies/${p.id}`,
});

function liveAnswer(item: AssistantAnswer, policies: Policy[]): Answer {
  if (item.live === 'renewal') {
    const next = [...policies].sort((a, b) => a.renewalDate.localeCompare(b.renewalDate))[0];
    const insurer = insurerById(next.insurerId).name;
    const date = formatDate(next.renewalDate, { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      q: item.q,
      a: `Your ${POLICY_LABEL[next.type].toLowerCase()} policy with ${insurer} renews on ${date}. You pay ${formatEUR(next.annualPremium)} a year for it.`,
      source: policySource(next),
    };
  }
  const total = policies.reduce((sum, p) => sum + p.annualPremium, 0);
  const biggest = [...policies].sort((a, b) => b.annualPremium - a.annualPremium)[0];
  return {
    q: item.q,
    a: `${formatEUR(total)} a year across ${policies.length} policies. ${POLICY_LABEL[biggest.type]} is ${Math.round((biggest.annualPremium / total) * 100)}% of it.`,
    source: { label: 'All policies', to: '/policies' },
  };
}

/** Everything the assistant can answer: the general answers, then each policy's own questions. */
export function knowledge(policies: Policy[]): (Answer & { policyId?: string })[] {
  const general = data.assistant.map((item) => {
    if (item.live) return liveAnswer(item, policies);
    const policy = policies.find((p) => item.source.includes(p.policyNumber));
    return { q: item.q, a: item.a, source: { label: item.source, to: policy && `/policies/${policy.id}` } };
  });
  const perPolicy = policies.flatMap((p) => p.questions.map((q) => ({ q: q.q, a: q.a, source: policySource(p, q.clause), policyId: p.id })));
  return [...general, ...perPolicy];
}

/** The closest answer to a free-text question, or undefined when nothing is close enough. */
export function findAnswer(question: string, policies: Policy[], policyId?: string): Answer | undefined {
  const asked = words(question);
  if (!asked.size) return undefined;

  let best: Answer | undefined;
  let bestScore = 0;
  for (const item of knowledge(policies)) {
    const known = words(item.q);
    let score = [...asked].filter((w) => known.has(w)).length;
    // Asked from a policy screen: that policy's answers win a tie.
    if (score && item.policyId === policyId) score += 0.5;
    if (score > bestScore) [best, bestScore] = [item, score];
  }
  return bestScore >= Math.min(2, asked.size) ? best : undefined;
}
