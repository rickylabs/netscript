/** UTC Gregorian arithmetic shared by copied Calendar and DatePicker components. */
export const CALENDAR_SUNDAY = '2000-01-02';
export const CALENDAR_MIN = '0001-01-01';
export const CALENDAR_MAX = '9999-12-31';
export const CALENDAR_WEEK_DAYS = 7;
export const CALENDAR_GRID_CELLS = 42;

/** Parse exactly one ISO calendar date without local timezone/DST or year-0–99 coercion. */
export function parseCalendarDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match || value < CALENDAR_MIN || value > CALENDAR_MAX) {
    throw new RangeError('Expected an ISO calendar date in years 0001–9999.');
  }
  const date = new Date(0);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (formatCalendarDate(date) !== value) throw new RangeError('Invalid Gregorian calendar date.');
  return date;
}

/** Format a UTC day, clamping only at the supported Gregorian year boundaries. */
export function formatCalendarDate(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid date.');
  const year = date.getUTCFullYear();
  if (year < 1) return CALENDAR_MIN;
  if (year > 9999) return CALENDAR_MAX;
  return `${String(year).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${
    String(date.getUTCDate()).padStart(2, '0')
  }`;
}

/** Month identity keeps the ISO day boundary explicit. */
export function calendarMonth(value: string): string {
  parseCalendarDate(value);
  return value.slice(0, 8) + '01';
}

/** Native UTC date arithmetic skips local clock changes. */
export function shiftCalendarDay(value: string, amount: number): string {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatCalendarDate(date);
}

/** Count real days, including Gregorian leap-century rules. */
export function calendarMonthLength(value: string): number {
  const date = parseCalendarDate(value);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.getUTCDate();
}

/** Move by whole months while clamping the old day to the destination's length. */
export function shiftCalendarMonth(value: string, amount: number): string {
  const date = parseCalendarDate(value), day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  if (date.getUTCFullYear() < 1) return CALENDAR_MIN;
  if (date.getUTCFullYear() > 9999) return CALENDAR_MAX;
  const first = formatCalendarDate(date);
  date.setUTCDate(Math.min(day, calendarMonthLength(first)));
  return formatCalendarDate(date);
}
