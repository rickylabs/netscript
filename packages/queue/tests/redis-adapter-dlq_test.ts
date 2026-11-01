import { assert, assertEquals } from '@std/assert';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';
import { bounded, leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';

class RecordingDeadLetterStore implements DeadLetterStorePort {
  readonly records: DeadLetterRecord[] = [];
  append(record: DeadLetterRecord): Promise<void> {
    if (!this.records.some((existing) => existing.messageId === record.messageId)) {
      this.records.push(record);
    }
    return Promise.resolve();
  }
  list(): Promise<DeadLetterRecord[]> {
    return Promise.resolve([...this.records]);
  }
  reprocess(): Promise<number> {
    return Promise.resolve(0);
  }
  depth(): Promise<number> {
    return Promise.resolve(this.records.length);
  }
}

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name: backend +
      ' RedisAdapter durably dead-letters explicit terminal nacks to its configured store',
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const store = new RecordingDeadLetterStore();
      const queue = harness.queue(store);
      await queue.enqueue({ id: 'msg-1' }, { headers: { traceparent: '00-test' } });
      const complete = Promise.withResolvers<void>();
      const { done, controller } = harness.listen(queue, async (_message, context) => {
        await context.nack({ requeue: false, errorMessage: 'poison' });
        controller.abort();
        complete.resolve();
      });
      await bounded(complete.promise);
      await done;
      await until(async () =>
        await store.depth() === 1 && (await queue.getHealth()).outboxDepth === 0
      );
      assertEquals(store.records.length, 1);
      assertEquals(store.records[0].reason, 'nack_without_requeue');
      assertEquals(store.records[0].payload, { id: 'msg-1' });
      assertEquals(store.records[0].errorMessage, 'poison');
      assertEquals(store.records[0].headers, { traceparent: '00-test' });
      assertEquals((await queue.getHealth()).outboxDepth, 0);
      assertEquals((await queue.getMetrics()).deadLettered, 1);
    },
  });
}
