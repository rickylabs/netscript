/**
 * @component Calendar
 * @layer 2
 * @depends theme-seed calendar-date
 * @description UTC Gregorian single/range calendar with an APG roving day grid.
 */
import type { JSX, VNode } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';
import {
  CALENDAR_GRID_CELLS,
  CALENDAR_MAX,
  CALENDAR_MIN,
  CALENDAR_SUNDAY,
  CALENDAR_WEEK_DAYS,
  calendarMonth,
  calendarMonthLength,
  formatCalendarDate,
  parseCalendarDate,
  shiftCalendarDay,
  shiftCalendarMonth,
} from './calendar-date.ts';

/** Dates are ISO strings so the API is serializable and independent of local timezone. */
export interface CalendarProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'onChange'> {
  mode?: 'single' | 'range';
  months?: 1 | 2;
  caption?: 'label' | 'dropdown';
  value?: readonly string[];
  defaultValue?: readonly string[];
  defaultMonth?: string;
  today?: string;
  onValueChange?: (dates: readonly string[]) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  isDateDisabled?: (date: string) => boolean;
  weekStartsOn?: 0 | 1;
  locale?: string;
  autoFocus?: boolean;
  class?: string;
}

/** Date selection is separate from browsing; hydrate inside an island for navigation. */
export function Calendar({
  mode = 'single',
  months = 1,
  caption = 'label',
  value,
  defaultValue = [],
  defaultMonth,
  today = formatCalendarDate(new Date()),
  onValueChange,
  min = CALENDAR_MIN,
  max = CALENDAR_MAX,
  disabled = false,
  isDateDisabled,
  weekStartsOn = 0,
  locale = 'en-US',
  autoFocus = false,
  class: className,
  ...props
}: CalendarProps): VNode {
  parseCalendarDate(min);
  parseCalendarDate(max);
  parseCalendarDate(today);
  if (min > max) throw new RangeError('Calendar min must not exceed max.');
  const [local, setLocal] = useState(defaultValue);
  const selected = value ?? local;
  selected.forEach(parseCalendarDate);
  if (selected.length > (mode === 'single' ? 1 : 2)) {
    throw new RangeError('Calendar selection exceeds its mode cardinality.');
  }
  if (selected.length === 2 && selected[0] > selected[1]) {
    throw new RangeError('Calendar range must be ordered.');
  }
  const capMonth = (date: string) => {
    parseCalendarDate(date);
    const bounded = date < min ? min : date > max ? max : date;
    const month = calendarMonth(bounded);
    return months === 2 && month === '9999-12-01' ? '9999-11-01' : month;
  };
  const [requestedView, setView] = useState(() => capMonth(defaultMonth ?? selected[0] ?? today));
  const view = capMonth(requestedView);
  const [focused, setFocused] = useState(selected[0] ?? today);
  const root = useRef<HTMLDivElement>(null), pendingFocus = useRef(false);
  const unavailable = (date: string) =>
    disabled || date < min || date > max || Boolean(isDateDisabled?.(date));
  const visible = Array.from(
    { length: months },
    (_, index) => calendarMonth(shiftCalendarMonth(view, index)),
  );
  const dates = visible.flatMap((month) =>
    Array.from({ length: calendarMonthLength(month) }, (_, index) => shiftCalendarDay(month, index))
  );
  const tabDate = dates.includes(focused) && !unavailable(focused)
    ? focused
    : dates.find((date) => selected.includes(date) && !unavailable(date)) ??
      dates.find((date) => !unavailable(date));
  const monthFormat = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const monthNameFormat = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  const weekFormat = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  useLayoutEffect(() => {
    if (pendingFocus.current) {
      pendingFocus.current = false;
      root.current?.querySelector<HTMLButtonElement>(`button[value="${tabDate}"]`)?.focus();
    }
  }, [tabDate, view]);
  const choose = (date: string) => {
    if (unavailable(date)) return;
    const next = mode === 'single'
      ? [date]
      : selected.length === 1
      ? [selected[0], date].sort()
      : [date];
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
    setFocused(date);
  };
  const navigate = (event: JSX.TargetedKeyboardEvent<HTMLButtonElement>, date: string) => {
    const weekday = (parseCalendarDate(date).getUTCDay() - weekStartsOn + CALENDAR_WEEK_DAYS) %
      CALENDAR_WEEK_DAYS;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    let next: string, step = 1;
    if (event.key === 'ArrowLeft') {
      step = rtl ? 1 : -1;
      next = shiftCalendarDay(date, step);
    } else if (event.key === 'ArrowRight') {
      step = rtl ? -1 : 1;
      next = shiftCalendarDay(date, step);
    } else if (event.key === 'ArrowUp') {
      step = -CALENDAR_WEEK_DAYS;
      next = shiftCalendarDay(date, step);
    } else if (event.key === 'ArrowDown') {
      step = CALENDAR_WEEK_DAYS;
      next = shiftCalendarDay(date, step);
    } else if (event.key === 'Home') {
      step = 1;
      next = shiftCalendarDay(date, -weekday);
    } else if (event.key === 'End') {
      step = -1;
      next = shiftCalendarDay(date, CALENDAR_WEEK_DAYS - 1 - weekday);
    } else if (event.key === 'PageUp') {
      step = -1;
      next = shiftCalendarMonth(date, event.shiftKey ? -12 : -1);
    } else if (event.key === 'PageDown') next = shiftCalendarMonth(date, event.shiftKey ? 12 : 1);
    else return;
    event.preventDefault();
    next = next < min ? min : next > max ? max : next;
    // A disabled-date callback may reject every future day; this bounded search never loops forever.
    for (let count = 0; count < 366 && unavailable(next); count++) {
      const candidate = shiftCalendarDay(next, step);
      if (candidate === next || candidate < min || candidate > max) return;
      next = candidate;
    }
    if (unavailable(next) || next === date) return;
    if (!visible.includes(calendarMonth(next))) setView(capMonth(next));
    pendingFocus.current = true;
    setFocused(next);
  };
  return (
    <div
      {...props}
      ref={root}
      class={cn('ns-calendar', className)}
      data-scope='calendar'
      data-part='root'
      data-months={months}
      data-caption={caption}
    >
      {visible.map((month, index) => {
        const date = parseCalendarDate(month),
          year = date.getUTCFullYear(),
          monthIndex = date.getUTCMonth();
        const offset = (date.getUTCDay() - weekStartsOn + CALENDAR_WEEK_DAYS) % CALENDAR_WEEK_DAYS;
        const length = calendarMonthLength(month);
        return (
          <section key={month} class='ns-calendar__month'>
            <div data-scope='calendar' data-part='header'>
              {index === 0 && (
                <button
                  type='button'
                  data-scope='calendar'
                  data-part='nav-prev'
                  aria-label='Previous month'
                  disabled={disabled || shiftCalendarDay(view, -1) < min || view === CALENDAR_MIN}
                  onClick={() => setView(capMonth(shiftCalendarMonth(view, -1)))}
                >
                  ‹
                </button>
              )}
              <div data-scope='calendar' data-part='caption' aria-live='polite'>
                {caption === 'label' ? monthFormat.format(date) : (
                  <>
                    <select
                      aria-label={`Month ${index + 1}`}
                      value={monthIndex}
                      disabled={disabled}
                      onChange={(event) =>
                        setView(
                          capMonth(
                            shiftCalendarMonth(
                              `${String(year).padStart(4, '0')}-${
                                String(Number(event.currentTarget.value) + 1).padStart(2, '0')
                              }-01`,
                              -index,
                            ),
                          ),
                        )}
                    >
                      {Array.from(
                        { length: 12 },
                        (_, m) => (
                          <option key={m} value={m}>
                            {monthNameFormat.format(
                              parseCalendarDate(
                                `${String(year).padStart(4, '0')}-${
                                  String(m + 1).padStart(2, '0')
                                }-01`,
                              ),
                            )}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label={`Year ${index + 1}`}
                      value={year}
                      disabled={disabled}
                      onChange={(event) =>
                        setView(
                          capMonth(
                            shiftCalendarMonth(
                              `${event.currentTarget.value.padStart(4, '0')}-${
                                String(monthIndex + 1).padStart(2, '0')
                              }-01`,
                              -index,
                            ),
                          ),
                        )}
                    >
                      {Array.from({
                        length: Math.min(9999, year + 20) - Math.max(1, year - 100) + 1,
                      }, (_, n) => Math.max(1, year - 100) + n).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              {index === months - 1 && (
                <button
                  type='button'
                  data-scope='calendar'
                  data-part='nav-next'
                  aria-label='Next month'
                  disabled={disabled || shiftCalendarMonth(view, months) > max ||
                    month === '9999-12-01'}
                  onClick={() => setView(capMonth(shiftCalendarMonth(view, 1)))}
                >
                  ›
                </button>
              )}
            </div>
            <table
              role='grid'
              aria-label={monthFormat.format(date)}
              aria-multiselectable={mode === 'range' || undefined}
            >
              <thead data-scope='calendar' data-part='weekdays'>
                <tr>
                  {Array.from(
                    { length: CALENDAR_WEEK_DAYS },
                    (_, n) => (
                      <th key={n} scope='col'>
                        {weekFormat.format(
                          parseCalendarDate(shiftCalendarDay(CALENDAR_SUNDAY, n + weekStartsOn)),
                        )}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody data-scope='calendar' data-part='grid'>
                {Array.from(
                  { length: CALENDAR_GRID_CELLS / CALENDAR_WEEK_DAYS },
                  (_, row) => (
                    <tr key={row}>
                      {Array.from({ length: CALENDAR_WEEK_DAYS }, (_, column) => {
                        const day = row * CALENDAR_WEEK_DAYS + column - offset + 1;
                        if (day < 1 || day > length) {
                          const outside = shiftCalendarDay(month, day - 1);
                          const beyond = (month === CALENDAR_MIN && day < 1) ||
                            (month === '9999-12-01' && day > length);
                          return (
                            <td key={column}>
                              <span class='ns-calendar__outside' aria-hidden='true'>
                                {beyond ? '' : parseCalendarDate(outside).getUTCDate()}
                              </span>
                            </td>
                          );
                        }
                        const iso = shiftCalendarDay(month, day - 1),
                          blocked = unavailable(iso),
                          chosen = selected.includes(iso) ||
                            (mode === 'range' && selected.length === 2 && iso > selected[0] &&
                              iso < selected[1]);
                        const range = mode !== 'range'
                          ? 'none'
                          : iso === selected[0]
                          ? 'start'
                          : iso === selected[1]
                          ? 'end'
                          : selected.length === 2 && iso > selected[0] && iso < selected[1]
                          ? 'middle'
                          : 'none';
                        return (
                          <td key={column} aria-selected={chosen}>
                            <button
                              type='button'
                              value={iso}
                              disabled={blocked}
                              tabIndex={iso === tabDate ? 0 : -1}
                              autoFocus={autoFocus && iso === tabDate}
                              data-scope='calendar'
                              data-part='day'
                              data-state={blocked
                                ? 'disabled'
                                : selected.includes(iso)
                                ? 'selected'
                                : iso === today
                                ? 'today'
                                : 'rest'}
                              data-range={range}
                              aria-label={dayFormat.format(parseCalendarDate(iso))}
                              aria-current={iso === today ? 'date' : undefined}
                              onFocus={() => setFocused(iso)}
                              onKeyDown={(event) => navigate(event, iso)}
                              onClick={() => choose(iso)}
                            >
                              {day}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
