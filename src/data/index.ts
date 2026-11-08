import raw from './mock.json';
import type { MockData } from '../types';
import { addDays, daysBetween, todayIso } from '../lib/dates';

/**
 * Mock dates are written relative to `anchorDate`. Every date is moved by
 * (today − anchorDate), so the demo always reads the same ("renews in 47 days")
 * whatever day it is opened.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const shift = daysBetween((raw as MockData).anchorDate, todayIso());

/** Moves every YYYY-MM-DD string inside `value` by `days`. */
export function shiftDates<T>(value: T, days: number): T {
  if (typeof value === 'string') return (ISO_DATE.test(value) ? addDays(value, days) : value) as T;
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, days)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shiftDates(v, days)])) as T;
  }
  return value;
}

export const data: MockData = shiftDates(raw as MockData, shift);

export const insurerById = (id: string) => data.insurers.find((i) => i.id === id)!;
