import { epochMillisToInstant, epochSecondsToInstant, isoDatetimeToInstant } from './codecs.ts';

Deno.test('isoDatetimeToInstant decodes and encodes Temporal instants', () => {
  const instant = isoDatetimeToInstant.decode('2024-01-15T10:30:00.000Z');

  if (!(instant instanceof Temporal.Instant)) throw new Error('Expected Temporal.Instant');
  if (instant.toString() !== '2024-01-15T10:30:00Z') throw new Error('Unexpected ISO instant');
  if (isoDatetimeToInstant.encode(instant) !== '2024-01-15T10:30:00Z') {
    throw new Error('Unexpected encoded ISO instant');
  }
});

Deno.test('epochSecondsToInstant decodes and encodes Temporal instants', () => {
  const instant = epochSecondsToInstant.decode(1705314600);

  if (!(instant instanceof Temporal.Instant)) throw new Error('Expected Temporal.Instant');
  if (instant.toString() !== '2024-01-15T10:30:00Z') throw new Error('Unexpected epoch instant');
  if (epochSecondsToInstant.encode(instant) !== 1705314600) {
    throw new Error('Unexpected encoded epoch seconds');
  }
});

Deno.test('epochMillisToInstant decodes and encodes Temporal instants', () => {
  const instant = epochMillisToInstant.decode(1705314600000);

  if (!(instant instanceof Temporal.Instant)) throw new Error('Expected Temporal.Instant');
  if (instant.toString() !== '2024-01-15T10:30:00Z') throw new Error('Unexpected epoch instant');
  if (epochMillisToInstant.encode(instant) !== 1705314600000) {
    throw new Error('Unexpected encoded epoch milliseconds');
  }
});
