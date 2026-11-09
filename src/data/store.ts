import { useSyncExternalStore } from 'react';
import { daysBetween, todayIso } from '../lib/dates';
import type { Activity, Certificate, Claim, Company, Payment, Policy } from '../types';
import { data, shiftDates } from '.';

/** Everything the user can change in the demo. Saved in localStorage so it survives a reload. */
export type State = {
  company: Company;
  policies: Policy[];
  payments: Payment[];
  activity: Activity[];
  certificates: Certificate[];
  claims: Claim[];
  /** Set once the welcome flow is finished; until then Home sends first-time visitors to /welcome. */
  onboarded: boolean;
};

const KEY = 'janus:v2';

const initial = (): State => ({
  company: data.company,
  policies: data.policies,
  payments: data.payments,
  activity: data.activity,
  certificates: [],
  claims: data.claims,
  onboarded: false,
});

/** Saved dates are moved forward by the days since saving, like the mock data. */
function load(): State {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const { savedOn, state } = JSON.parse(saved) as { savedOn: string; state: State };
      // Anything missing from an older save comes from the mock data.
      return { ...initial(), ...shiftDates(state, daysBetween(savedOn, todayIso())) };
    }
  } catch {
    // Storage blocked or corrupt: start from the mock data.
  }
  return initial();
}

let state = load();
const listeners = new Set<() => void>();

export function setState(update: (s: State) => State) {
  state = update(state);
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedOn: todayIso(), state }));
  } catch {
    // Not saved; the change still applies until the page reloads.
  }
  listeners.forEach((l) => l());
}

export const getState = () => state;

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** Adds a row to the top of the activity list, dated today. */
export const activityToday = (a: Omit<Activity, 'date'>): Activity => ({ ...a, date: todayIso() });
