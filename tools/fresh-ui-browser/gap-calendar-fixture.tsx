import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { Calendar } from '../../packages/fresh-ui/registry/components/ui/calendar.tsx';
import { DatePicker } from '../../packages/fresh-ui/registry/components/ui/date-picker.tsx';

/** Deterministic leap-year scenarios expose requests and native form submission. */
export function Calendars() {
  const [selection, setSelection] = useState<readonly string[]>([]);
  const [range, setRange] = useState<readonly string[]>([]);
  const [request, setRequest] = useState<readonly string[]>([]);
  const [submitted, setSubmitted] = useState('');
  const [fixedOpen, setFixedOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState('');
  const [dateRequest, setDateRequest] = useState<readonly string[]>([]);
  return (
    <section id='calendars'>
      <h2>Date controls</h2>
      <Calendar
        id='leap-calendar'
        aria-label='Leap calendar'
        defaultMonth='2024-02-01'
        defaultValue={['2024-02-28']}
        today='2024-02-28'
        onValueChange={setSelection}
      />
      <output aria-label='Selected day'>{selection.join('/')}</output>
      <Calendar
        id='bounded-calendar'
        aria-label='Bounded calendar'
        min='2024-02-27'
        max='2024-03-03'
        defaultValue={['2024-02-28']}
        today='2024-02-28'
        isDateDisabled={(day) => day === '2024-02-29'}
      />
      <Calendar
        id='range-calendar'
        aria-label='Range calendar'
        months={2}
        mode='range'
        defaultMonth='2024-02-01'
        today='2024-02-28'
        onValueChange={setRange}
      />
      <output aria-label='Selected range'>{range.join('/')}</output>
      <Calendar
        id='dropdown-calendar'
        aria-label='Dropdown calendar'
        caption='dropdown'
        defaultMonth='2024-02-01'
        today='2024-02-28'
      />
      <Calendar
        id='fixed-calendar'
        aria-label='Fixed calendar'
        value={['2024-02-28']}
        today='2024-02-28'
        onValueChange={setRequest}
      />
      <output aria-label='Requested day'>{request.join('/')}</output>
      <form
        id='date-form'
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get('delivery')));
        }}
      >
        <DatePicker label='Delivery' name='delivery' defaultMonth='2024-02-01' />
        <Button type='submit'>Submit date</Button>
      </form>
      <output aria-label='Submitted date'>{submitted}</output>
      <DatePicker label='Trip' mode='range' defaultMonth='2024-02-01' />
      <DatePicker label='Disabled delivery' disabled />
      <DatePicker label='Invalid delivery' state='invalid' />
      <DatePicker
        label='Fixed picker'
        value={['2024-02-28']}
        open={fixedOpen}
        onValueChange={setDateRequest}
        onOpenChange={(next) => {
          setOpenRequest(String(next));
          if (next) setFixedOpen(true);
        }}
      />
      <output aria-label='Requested picker open'>{openRequest}</output>
      <output aria-label='Requested picker date'>{dateRequest.join('/')}</output>
      <Button type='button' id='after-calendars'>After dates</Button>
    </section>
  );
}
