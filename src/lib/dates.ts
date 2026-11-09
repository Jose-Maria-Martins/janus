const DAY = 86_400_000;

/** Parse YYYY-MM-DD as a UTC midnight timestamp (avoids timezone drift). */
const parse = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Today's local date as YYYY-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  return toIso(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export const daysBetween = (from: string, to: string) => Math.round((parse(to) - parse(from)) / DAY);
export const addDays = (iso: string, days: number) => toIso(parse(iso) + days * DAY);
/** Same day next year (29 Feb becomes 1 Mar). */
export const addYear = (iso: string) => toIso(Date.UTC(Number(iso.slice(0, 4)) + 1, Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))));
export const daysUntil = (iso: string) => daysBetween(todayIso(), iso);

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(parse(iso)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}

/** "Today", "Yesterday", "7 Nov", or "7 Nov 2025" for another year. */
export function dayLabel(iso: string) {
  const ago = daysBetween(iso, todayIso());
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  const sameYear = iso.slice(0, 4) === todayIso().slice(0, 4);
  return formatDate(iso, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
