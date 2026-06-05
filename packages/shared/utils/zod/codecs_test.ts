import { epochMillisToInstant, epochSecondsToInstant, isoDatetimeToInstant } from './codecs.ts';

function assertEquals<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, received ${actual}`);
  }
}

function assertInstanceOf<T>(
  actual: unknown,
  expected: new (...args: never[]) => T,
): asserts actual is T {
  if (!(actual instanceof expected)) {
    throw new Error(`Expected ${actual} to be an instance of ${expected.name}`);
  }
}

Deno.test('isoDatetimeToInstant decodes and encodes Temporal instants', () => {
  const instant = isoDatetimeToInstant.decode('2024-01-15T10:30:00.000Z');

  assertInstanceOf(instant, Temporal.Instant);
  assertEquals(instant.toString(), '2024-01-15T10:30:00Z');
  assertEquals(isoDatetimeToInstant.encode(instant), '2024-01-15T10:30:00Z');
});

Deno.test('epochSecondsToInstant decodes and encodes Temporal instants', () => {
  const instant = epochSecondsToInstant.decode(1705314600);

  assertInstanceOf(instant, Temporal.Instant);
  assertEquals(instant.toString(), '2024-01-15T10:30:00Z');
  assertEquals(epochSecondsToInstant.encode(instant), 1705314600);
});

Deno.test('epochMillisToInstant decodes and encodes Temporal instants', () => {
  const instant = epochMillisToInstant.decode(1705314600000);

  assertInstanceOf(instant, Temporal.Instant);
  assertEquals(instant.toString(), '2024-01-15T10:30:00Z');
  assertEquals(epochMillisToInstant.encode(instant), 1705314600000);
});
