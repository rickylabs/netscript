import { parseCronExpression } from '../ports/types.ts';
import { expandCronField } from './cron-field.ts';

/**
 * @internal Translate NetScript weekdays (Sunday = 0) to Deno weekdays (Sunday = 1).
 * Other fields retain their spelling. Ambiguous or invalid weekday fields throw.
 */
export function translateDenoCronExpression(expression: string): string {
  const parsed = parseCronExpression(expression);
  if (!parsed) throw new Error('Cannot translate cron expression: expected five fields');
  const field = parsed.dayOfWeek;
  const weekdays = expandCronField(field, 0, 6);
  if (!weekdays) {
    throw new Error(`Cannot translate cron day-of-week field '${field}' exactly`);
  }
  const translated = field === '*' ? '*' : weekdays.map((day) => day + 1).join(',');
  return [parsed.minute, parsed.hour, parsed.dayOfMonth, parsed.month, translated].join(' ');
}
