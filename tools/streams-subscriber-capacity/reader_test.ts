import { assertEquals, assertThrows } from '@std/assert';
import { Delivery, readFrames } from './reader.ts';

const data = (revision: number) => ({
  eventName: 'data',
  data: JSON.stringify([{
    type: 'revision',
    key: 'revision',
    headers: {
      operation: 'upsert',
      correlationId: 'revision',
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
    },
    value: { id: 'revision', revision },
  }]),
});

const control = (streamNextOffset: string) => ({
  eventName: 'control',
  data: JSON.stringify({ streamNextOffset, upToDate: true }),
});

Deno.test('SSE framing survives split CRLF and UTF-8 and omits an unfinished tail', async () => {
  const bytes = new TextEncoder().encode(
    'event: data\r\ndata: café\r\ndata: two\r\n\r\n: comment\n\nevent: control\ndata: {}',
  );
  async function* chunks() {
    for (const byte of bytes) {
      yield await Promise.resolve(Uint8Array.of(byte));
    }
  }
  assertEquals(await Array.fromAsync(readFrames(chunks())), [{
    eventName: 'data',
    data: 'café\ntwo',
  }]);
});

Deno.test('only a committing control counts delivery or advances the resume offset', () => {
  const ledger = new Delivery([1, 2]);
  assertEquals(ledger.observe(control('opening-offset'), 0).caughtUp, true);
  ledger.observe(data(1), 1);
  assertEquals(ledger.commits.size, 0);
  ledger.resetForReconnect();
  assertEquals(ledger.offset, 'opening-offset');
  ledger.observe(control('opening-offset'), 2);
  assertEquals(ledger.commits.size, 0);
  ledger.observe(data(1), 3);
  ledger.observe(control('after-first-append'), 4);
  assertEquals([...ledger.commits], [[1, 4]]);
  assertEquals(ledger.offset, 'after-first-append');
});

Deno.test('delivery ledger detects gaps, out-of-order and duplicate revisions', () => {
  const ledger = new Delivery([1, 2]);
  ledger.observe(control('opening-offset'), 0);
  ledger.observe(data(2), 1);
  ledger.observe(control('after-second'), 2);
  assertEquals(ledger.expected.filter((revision) => !ledger.commits.has(revision)), [1]);
  assertEquals(ledger.outOfOrder, 1);
  ledger.observe(data(2), 3);
  ledger.observe(control('after-duplicate'), 4);
  assertEquals(ledger.duplicates, 1);
  assertEquals([...ledger.commits], [[2, 2]]);
  ledger.observe(data(1), 5);
  assertThrows(() => ledger.observe(control('after-duplicate'), 6), Error, 'repeated');
});
