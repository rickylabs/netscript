import { expandCronField } from './cron-field.ts';
import { parseCronExpression, type ParsedCronExpression } from '../ports/types.ts';

// Gregorian dates and weekdays repeat every 400 years. Search days, not minutes,
// to keep sparse or impossible schedules bounded without rejecting rare leap dates.
const CALENDAR_CYCLE_DAYS = 146_097;

/** Find the first matching UTC minute strictly after now, or null if unsupported/impossible. */
export function calculateNextRun(expression: string, now: Date): Date | null {
  return calculateNextOccurrence(expression, now, matchesAllDays);
}

/** @internal Find the next UTC minute using Deno's OR rule for restricted day fields. */
export function calculateNextDenoRun(expression: string, now: Date): Date | null {
  return calculateNextOccurrence(expression, now, matchesDenoDays);
}

type DayMatcher = (
  date: Date,
  parsed: ParsedCronExpression,
  days: readonly number[],
  weekdays: readonly number[],
) => boolean;

const matchesAllDays: DayMatcher = (date, _parsed, days, weekdays) =>
  days.includes(date.getUTCDate()) && weekdays.includes(date.getUTCDay());

const matchesDenoDays: DayMatcher = (date, parsed, days, weekdays) => {
  const dayMatches = days.includes(date.getUTCDate());
  const weekdayMatches = weekdays.includes(date.getUTCDay());
  // Only a literal wildcard removes a day constraint in Deno. Ranges and */1
  // remain restricted fields even when their expanded sets cover every day.
  if (parsed.dayOfMonth === '*') return weekdayMatches;
  if (parsed.dayOfWeek === '*') return dayMatches;
  return dayMatches || weekdayMatches;
};

function calculateNextOccurrence(
  expression: string,
  now: Date,
  matchesDays: DayMatcher,
): Date | null {
  const parsed = parseCronExpression(expression);
  const timestamp = now.getTime();
  if (!parsed || !Number.isFinite(timestamp)) return null;

  const minutes = expandCronField(parsed.minute, 0, 59);
  const hours = expandCronField(parsed.hour, 0, 23);
  const days = expandCronField(parsed.dayOfMonth, 1, 31);
  const months = expandCronField(parsed.month, 1, 12);
  const weekdays = expandCronField(parsed.dayOfWeek, 0, 6);
  if (!minutes || !hours || !days || !months || !weekdays) return null;

  const candidate = new Date(timestamp);
  candidate.setUTCHours(0, 0, 0, 0);
  for (let scanned = 0; scanned <= CALENDAR_CYCLE_DAYS; scanned++) {
    if (!Number.isFinite(candidate.getTime())) return null;
    if (
      months.includes(candidate.getUTCMonth() + 1) &&
      matchesDays(candidate, parsed, days, weekdays)
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
