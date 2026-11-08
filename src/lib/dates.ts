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
export const daysUntil = (iso: string) => daysBetween(todayIso(), iso);

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(parse(iso)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}
