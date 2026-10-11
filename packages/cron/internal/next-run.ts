import { parseCronExpression } from '../ports/types.ts';

// Gregorian dates and weekdays repeat every 400 years. Search days, not minutes,
// to keep sparse or impossible schedules bounded without rejecting rare leap dates.
const CALENDAR_CYCLE_DAYS = 146_097;

/** Find the first matching UTC minute strictly after now, or null if unsupported/impossible. */
export function calculateNextRun(expression: string, now: Date): Date | null {
  const parsed = parseCronExpression(expression);
  const timestamp = now.getTime();
  if (!parsed || !Number.isFinite(timestamp)) return null;

  const minutes = expandField(parsed.minute, 0, 59);
  const hours = expandField(parsed.hour, 0, 23);
  const days = expandField(parsed.dayOfMonth, 1, 31);
  const months = expandField(parsed.month, 1, 12);
  const weekdays = expandField(parsed.dayOfWeek, 0, 6);
  if (!minutes || !hours || !days || !months || !weekdays) return null;

  const candidate = new Date(timestamp);
  candidate.setUTCHours(0, 0, 0, 0);
  for (let scanned = 0; scanned <= CALENDAR_CYCLE_DAYS; scanned++) {
    if (!Number.isFinite(candidate.getTime())) return null;
    // All fields must match, including both day constraints (as in the existing preview parser).
    if (
      months.includes(candidate.getUTCMonth() + 1) &&
      days.includes(candidate.getUTCDate()) &&
      weekdays.includes(candidate.getUTCDay())
    ) {
      for (const hour of hours) {
        for (const minute of minutes) {
          candidate.setUTCHours(hour, minute, 0, 0);
          if (candidate.getTime() > timestamp) return candidate;
        }
      }
    }
    candidate.setUTCHours(0, 0, 0, 0);
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return null;
}

function expandField(field: string, min: number, max: number): number[] | null {
  const values = new Set<number>();
  for (const part of field.split(',')) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) return null;
    const step = match[2] === undefined ? 1 : Number(match[2]);
    if (!Number.isSafeInteger(step) || step < 1) return null;

    const range = match[1];
    const [startText, endText] = range.split('-');
    const start = range === '*' ? min : Number(startText);
    const end = range === '*' ? max : endText === undefined ? start : Number(endText);
    // A step on a lone value has provider-specific semantics; do not guess.
    if (range !== '*' && endText === undefined && match[2] !== undefined) return null;
    if (start < min || end > max || start > end) return null;
    for (let value = start; value <= end; value += step) values.add(value);
  }
  return [...values].sort((a, b) => a - b);
}
