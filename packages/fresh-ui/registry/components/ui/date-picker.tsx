/**
 * @component DatePicker
 * @layer 2
 * @depends theme-seed calendar
 * @description Calendar selection over the package-owned native Dialog focus/dismissal contract.
 */
import type { JSX, VNode } from 'preact';
import { useId, useState } from 'preact/hooks';
import { Dialog } from '@netscript/fresh-ui/interactive';
import { cn } from '../../lib/cn.ts';
import { Calendar } from './calendar.tsx';
import { parseCalendarDate } from './calendar-date.ts';

/** ISO values are caller-owned; opening and selection may each be controlled independently. */
export interface DatePickerProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'onChange'> {
  label: string;
  name?: string;
  mode?: 'single' | 'range';
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (dates: readonly string[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMonth?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  state?: 'rest' | 'focus' | 'disabled' | 'invalid';
  placeholder?: string;
  locale?: string;
  class?: string;
}

/** Hydrate in an island; Dialog owns native modal focus, Escape, dismissal and return. */
export function DatePicker({
  label,
  name,
  mode = 'single',
  value,
  defaultValue = [],
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  defaultMonth,
  min,
  max,
  disabled = false,
  state = 'rest',
  placeholder = 'Choose a date',
  locale = 'en-US',
  class: className,
  ...props
}: DatePickerProps): VNode {
  const [local, setLocal] = useState(defaultValue),
    [localOpen, setLocalOpen] = useState(defaultOpen);
  const selected = value ?? local, unavailable = disabled || state === 'disabled';
  const isOpen = !unavailable && (open ?? localOpen);
  const changeOpen = (next: boolean) => {
    if (next === isOpen) return;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const display = selected.length
    ? selected.map((date) => formatter.format(parseCalendarDate(date))).join(' – ')
    : placeholder;
  const anchor = `--ns-date-picker-${useId().replace(/[^a-z0-9-]/gi, '')}`;
  return (
    <div
      {...props}
      class={cn('ns-date-picker', className)}
      data-scope='date-picker'
      data-part='root'
      data-mode={mode}
      data-state={unavailable ? 'disabled' : isOpen ? 'open' : state}
    >
      {name && (
        <input
          type='hidden'
          name={name}
          value={selected.join('/')}
          disabled={unavailable}
        />
      )}
      <Dialog.Root open={isOpen} onOpenChange={changeOpen}>
        <Dialog.Trigger
          disabled={unavailable}
          class='ns-date-picker__trigger'
          aria-label={`${label}: ${display}`}
          aria-invalid={state === 'invalid' || undefined}
          data-scope='date-picker'
          data-part='trigger'
          style={{ '--ns-floating-anchor-name': anchor }}
        >
          {display}
        </Dialog.Trigger>
        <Dialog.Content
          class='ns-date-picker__content'
          data-scope='date-picker'
          data-part='content'
          style={{ '--ns-floating-anchor-name': anchor }}
          onCancel={(event) => {
            // Keep a rejected controlled close request in the native top layer.
            event.preventDefault();
            changeOpen(false);
          }}
        >
          <Dialog.Title class='ns-date-picker__sr' data-scope='date-picker' data-part='title'>
            {label}
          </Dialog.Title>
          <Dialog.Description
            class='ns-date-picker__sr'
            data-scope='date-picker'
            data-part='description'
          >
            Use arrow keys to choose a day, Page Up or Page Down to change month, and Escape to
            cancel.
          </Dialog.Description>
          <Calendar
            key={isOpen ? 'open' : 'closed'}
            mode={mode}
            months={mode === 'range' ? 2 : 1}
            value={selected}
            defaultMonth={selected[0] ?? defaultMonth}
            min={min}
            max={max}
            locale={locale}
            autoFocus
            onValueChange={(dates) => {
              if (value === undefined) setLocal(dates);
              onValueChange?.(dates);
              if (mode === 'single' || dates.length === 2) changeOpen(false);
            }}
          />
          <Dialog.Close class='ns-date-picker__close' data-scope='date-picker' data-part='close'>
            Cancel
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
