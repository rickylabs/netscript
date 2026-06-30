/** @module @netscript/plugin-triggers-core/runtime */

import type { ScheduledTriggerSpec } from '../domain/mod.ts';
import { TriggersError } from '../domain/mod.ts';

const MINUTES_PER_DAY = 1_440;
const SEARCH_HORIZON_MINUTES = 6 * 366 * MINUTES_PER_DAY;

type CronField = ReadonlySet<number>;

type ParsedCron = Readonly<{
  minutes: CronField;
  hours: CronField;
  daysOfMonth: CronField;
  months: CronField;
  daysOfWeek: CronField;
}>;

type LocalMinute = Readonly<{
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
}>;

/** Compute upcoming fire times for a 5-field scheduled trigger spec. */
export function computeNextFireTimes(
  spec: ScheduledTriggerSpec,
  count: number,
  from: Date = new Date(),
): string[] {
  if (!Number.isInteger(count) || count < 1) {
    throw TriggersError.validationFailed('Schedule preview count must be a positive integer.');
  }
  const cron = parseCron(spec.cron);
  if (!hasPossibleCalendarDate(cron)) {
    throw TriggersError.validationFailed(
      `Cron expression has no valid calendar date: ${spec.cron}`,
    );
  }
  const timezone = spec.timezone ?? 'UTC';
  const formatter = createFormatter(timezone);
  const limit = spec.persistent === false ? 1 : count;
  const results: string[] = [];
  const seen = new Set<string>();
  let cursor = floorToMinute(from).getTime() + 60_000;
  let previous = toLocalMinute(new Date(cursor - 60_000), formatter);

  for (let scanned = 0; scanned < SEARCH_HORIZON_MINUTES && results.length < limit; scanned += 1) {
    const instant = new Date(cursor);
    const current = toLocalMinute(instant, formatter);
    const missed = firstMatchingSkippedMinute(previous, current, cron);
    if (missed !== undefined) {
      addResult(results, seen, instant);
    } else if (matchesCron(current, cron)) {
      addResult(results, seen, instant);
    }
    previous = current;
    cursor += 60_000;
  }

  if (results.length === 0) {
    throw TriggersError.validationFailed(
      `Cron expression does not produce a fire time within the preview horizon: ${spec.cron}`,
    );
  }
  return results;
}

function addResult(results: string[], seen: Set<string>, instant: Date): void {
  const iso = instant.toISOString();
  if (!seen.has(iso)) {
    seen.add(iso);
    results.push(iso);
  }
}

function parseCron(expression: string): ParsedCron {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw TriggersError.validationFailed('Scheduled trigger cron expression must have 5 fields.');
  }
  return {
    minutes: parseField(fields[0], 0, 59, 'minute'),
    hours: parseField(fields[1], 0, 23, 'hour'),
    daysOfMonth: parseField(fields[2], 1, 31, 'day-of-month'),
    months: parseField(fields[3], 1, 12, 'month'),
    daysOfWeek: parseField(fields[4], 0, 7, 'day-of-week', normalizeDayOfWeek),
  };
}

function parseField(
  field: string,
  min: number,
  max: number,
  name: string,
  normalize: (value: number) => number = (value) => value,
): CronField {
  const values = new Set<number>();
  for (const part of field.split(',')) {
    if (part.length === 0) {
      throw TriggersError.validationFailed(`Invalid empty ${name} cron field segment.`);
    }
    const [range, stepText] = part.split('/');
    const step = stepText === undefined ? 1 : parsePositiveInteger(stepText, `${name} step`);
    const [start, end] = parseRange(range, min, max, name);
    for (let value = start; value <= end; value += step) {
      values.add(normalize(value));
    }
  }
  return values;
}

function parseRange(
  range: string,
  min: number,
  max: number,
  name: string,
): readonly [number, number] {
  if (range === '*') {
    return [min, max];
  }
  const pieces = range.split('-');
  if (pieces.length === 1) {
    const value = parseBound(pieces[0], min, max, name);
    return [value, value];
  }
  if (pieces.length === 2) {
    const start = parseBound(pieces[0], min, max, name);
    const end = parseBound(pieces[1], min, max, name);
    if (start > end) {
      throw TriggersError.validationFailed(`Invalid ${name} cron range: ${range}`);
    }
    return [start, end];
  }
  throw TriggersError.validationFailed(`Invalid ${name} cron field: ${range}`);
}

function parseBound(text: string, min: number, max: number, name: string): number {
  const value = parsePositiveInteger(text, name);
  if (value < min || value > max) {
    throw TriggersError.validationFailed(`Cron ${name} value ${value} is outside ${min}-${max}.`);
  }
  return value;
}

function parsePositiveInteger(text: string, name: string): number {
  if (!/^\d+$/.test(text)) {
    throw TriggersError.validationFailed(`Cron ${name} must be a non-negative integer.`);
  }
  return Number(text);
}

function normalizeDayOfWeek(value: number): number {
  return value === 7 ? 0 : value;
}

function createFormatter(timezone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      hourCycle: 'h23',
    });
  } catch (cause) {
    throw TriggersError.validationFailed(`Invalid schedule timezone: ${timezone}`, cause);
  }
}

function toLocalMinute(instant: Date, formatter: Intl.DateTimeFormat): LocalMinute {
  const parts = formatter.formatToParts(instant);
  const year = numberPart(parts, 'year');
  const month = numberPart(parts, 'month');
  const day = numberPart(parts, 'day');
  const hour = normalizeHour(numberPart(parts, 'hour'));
  const minute = numberPart(parts, 'minute');
  return {
    year,
    month,
    day,
    hour,
    minute,
    dayOfWeek: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

function numberPart(parts: Intl.DateTimeFormatPart[], type: string): number {
  const part = parts.find((candidate) => candidate.type === type);
  if (part === undefined) {
    throw TriggersError.validationFailed(`Timezone formatter did not return ${type}.`);
  }
  return Number(part.value);
}

function normalizeHour(hour: number): number {
  return hour === 24 ? 0 : hour;
}

function floorToMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 60_000) * 60_000);
}

function firstMatchingSkippedMinute(
  previous: LocalMinute,
  current: LocalMinute,
  cron: ParsedCron,
): LocalMinute | undefined {
  const previousOrdinal = localOrdinal(previous);
  const currentOrdinal = localOrdinal(current);
  if (currentOrdinal - previousOrdinal <= 1) {
    return undefined;
  }
  for (let ordinal = previousOrdinal + 1; ordinal < currentOrdinal; ordinal += 1) {
    const candidate = fromLocalOrdinal(ordinal);
    if (matchesCron(candidate, cron)) {
      return candidate;
    }
  }
  return undefined;
}

function matchesCron(local: LocalMinute, cron: ParsedCron): boolean {
  return cron.minutes.has(local.minute) &&
    cron.hours.has(local.hour) &&
    cron.daysOfMonth.has(local.day) &&
    cron.months.has(local.month) &&
    cron.daysOfWeek.has(local.dayOfWeek);
}

function hasPossibleCalendarDate(cron: ParsedCron): boolean {
  for (let year = 2000; year < 2400; year += 1) {
    for (const month of cron.months) {
      const days = daysInMonth(year, month);
      for (let day = 1; day <= days; day += 1) {
        const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        if (cron.daysOfMonth.has(day) && cron.daysOfWeek.has(dayOfWeek)) {
          return true;
        }
      }
    }
  }
  return false;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function localOrdinal(local: LocalMinute): number {
  return Math.floor(
    Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute) /
      60_000,
  );
}

function fromLocalOrdinal(ordinal: number): LocalMinute {
  const date = new Date(ordinal * 60_000);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return {
    year,
    month,
    day,
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    dayOfWeek: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}
