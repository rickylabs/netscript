import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { reconnectSnapshotResult } from '../../src/e2e/probes/producer-reconnect.ts';

Deno.test('reconnectSnapshotResult preserves FIFO and extracts the committed trace identity', () => {
  const traceId = '0123456789abcdef0123456789abcdef';
  const result = reconnectSnapshotResult([
    { key: 'one', headers: { traceparent: `00-${traceId}-0123456789abcdef-01` } },
    { key: 'two', headers: {} },
    { key: 'three', headers: {} },
  ], ['one', 'two', 'three']);

  assertEquals(result, { keys: ['one', 'two', 'three'], traceId });
});

Deno.test('reconnectSnapshotResult rejects out-of-order recovery', () => {
  assertThrows(
    () =>
      reconnectSnapshotResult([
        {
          key: 'two',
          headers: {
            traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
          },
        },
        { key: 'one', headers: {} },
      ], ['one', 'two']),
    Error,
    'Reconnect FIFO mismatch',
  );
});
