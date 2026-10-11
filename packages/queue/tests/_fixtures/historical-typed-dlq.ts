import { assertEquals, AssertionError, assertRejects } from '@std/assert';
import type { DeadLetterRecord, DeadLetterStorePort } from '../../ports/mod.ts';
import { typedDlqRedelivery } from './typed-dlq.ts';

/** Reconstruct the original test store's append-only semantics, without altering message IDs. */
export function createHistoricalTypedDlqStore(): DeadLetterStorePort {
  // Source: 9a26c107a, packages/queue/testing/memory-queue.ts:43-93.
  // The original typed-queue test enqueued before listening on :memory: and polled depth before
  // aborting. Keep its append-only storage semantics and enqueue-before-listen ordering, but
  // replace scheduling luck with the existing real KV fixture's persisted-nack signals.
  // That fixture injects a lost acknowledgement, then cancels during the second append and
  // drains both deliveries. This reconstructs a candidate failure path, not the cause of #1665.
  const records: DeadLetterRecord[] = [];
  return {
    append(record) {
      records.push(record);
      return Promise.resolve();
    },
    list: (options = {}) => Promise.resolve(records.slice(0, options.limit)),
    depth: () => Promise.resolve(records.length),
    async reprocess(enqueue, options = {}) {
      const selected = records.slice(0, options.limit);
      for (const record of selected) await enqueue(record);
      records.splice(0, selected.length);
      return selected.length;
    },
  };
}

/** Reconstruct the original append-only store under a controlled persisted-nack redelivery. */
export async function historicalTypedDlqDuplicate(): Promise<void> {
  const historicalStore = createHistoricalTypedDlqStore();
  // The current one-record invariant must fail with the actual historical append algorithm.
  // No record identity is corrupted to force duplication; Deno retries the same envelope.
  await assertRejects(
    () => typedDlqRedelivery('memory', () => historicalStore),
    AssertionError,
    'one terminal record per message despite lost acknowledgement',
  );
  const records = await historicalStore.list();
  assertEquals(records.length, 2, 'historical storage retains both native deliveries');
  assertEquals(records[0].messageId, records[1].messageId, 'same envelope, not two producers');
  assertEquals(records.map((record) => record.payload), [{ id: 123 }, { id: 123 }]);
  assertEquals(records.map((record) => record.reason), ['validation_failed', 'validation_failed']);
  assertEquals(records.map((record) => record.errorCode), ['VALIDATION_ERROR', 'VALIDATION_ERROR']);
  assertEquals(records.map((record) => record.failedAt), [
    '2026-10-01T00:00:01.000Z',
    '2026-10-01T00:00:02.000Z',
  ]);
}
