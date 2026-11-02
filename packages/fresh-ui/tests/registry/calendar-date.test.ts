import { assertEquals, assertThrows } from '@std/assert';
import {
  calendarMonthLength,
  formatCalendarDate,
  parseCalendarDate,
  shiftCalendarDay,
  shiftCalendarMonth,
} from '../../registry/components/ui/calendar-date.ts';

Deno.test('Calendar Gregorian boundaries preserve leap centuries, small years and month clamping', () => {
  assertEquals(calendarMonthLength('1900-02-01'), 28);
  assertEquals(calendarMonthLength('2000-02-01'), 29);
  assertEquals(shiftCalendarMonth('2028-01-31', 1), '2028-02-29');
  assertEquals(shiftCalendarMonth('2027-03-31', -1), '2027-02-28');
  assertEquals(shiftCalendarDay('2028-02-28', 1), '2028-02-29');
  assertEquals(shiftCalendarDay('2028-02-29', 1), '2028-03-01');
  assertEquals(shiftCalendarDay('0099-12-31', 1), '0100-01-01');
  assertEquals(formatCalendarDate(parseCalendarDate('0099-02-01')), '0099-02-01');
  assertEquals(shiftCalendarDay('0001-01-01', -1), '0001-01-01');
  assertEquals(shiftCalendarDay('9999-12-31', 1), '9999-12-31');
});
Deno.test('Calendar days do not drift across local DST boundaries and invalid dates are rejected', () => {
  assertEquals(shiftCalendarDay('2026-03-08', 1), '2026-03-09');
  assertEquals(shiftCalendarDay('2026-11-01', 1), '2026-11-02');
  for (
    const date of [
      '2026-02-29',
      '2028-02-30',
      '0000-01-01',
      '2026-13-01',
      '2026-2-01',
      'not-a-date',
    ]
  ) assertThrows(() => parseCalendarDate(date), RangeError);
});
