import { assertEquals } from '@std/assert';
import { MemoryQueueAdapter, MemoryDeadLetterStore } from '@netscript/queue/testing';
import type { DeadLetterRecord } from '@netscript/queue';

Deno.test('durable DLQ inspection and reprocessing worked example', async () => {
  const dlqStore = new MemoryDeadLetterStore<string>();
  const queue = new MemoryQueueAdapter<string>({ deadLetterStore: dlqStore });

  // 1. Enqueue a poison message
  await queue.enqueue('poison-message-payload');

  // 2. Consume and nack without requeueing (sending to DLQ)
  const controller = new AbortController();
  const listenPromise = queue.listen(
    async (message, context) => {
      if (message.startsWith('poison')) {
        await context.nack({
          requeue: false,
          reason: 'validation_failed',
          errorCode: 'POISON_DETECTED',
          errorMessage: 'Invalid format: poison payload detected',
        });
        controller.abort();
      } else {
        await context.ack();
      }
    },
    { signal: controller.signal },
  );

  await listenPromise;

  // 3. Inspect the DLQ store
  const depth = await dlqStore.depth();
  assertEquals(depth, 1);

  const failures = await dlqStore.list({ limit: 10 });
  assertEquals(failures.length, 1);
  const failureRecord: DeadLetterRecord<string> = failures[0];
  assertEquals(failureRecord.payload, 'poison-message-payload');
  assertEquals(failureRecord.reason, 'validation_failed');

  // 4. Reprocess the DLQ (correcting the message payload and enqueuing it again)
  const processedPayloads: string[] = [];
  const reprocessController = new AbortController();

  // Define how to re-enqueue or process the recovered message
  const reprocessedCount = await dlqStore.reprocess(async (record) => {
    // Correct the payload (e.g. sanitizing the poison string)
    const corrected = record.payload.replace('poison-', 'clean-');
    await queue.enqueue(corrected);
  });

  assertEquals(reprocessedCount, 1);
  assertEquals(await dlqStore.depth(), 0); // Reprocessed records are removed from DLQ

  // 5. Consume the clean reprocessed message
  const cleanListenPromise = queue.listen(
    async (message, context) => {
      processedPayloads.push(message);
      await context.ack();
      reprocessController.abort();
    },
    { signal: reprocessController.signal },
  );

  await cleanListenPromise;
  assertEquals(processedPayloads, ['clean-message-payload']);
});
