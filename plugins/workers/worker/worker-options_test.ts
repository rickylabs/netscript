import { assert, assertEquals } from '@std/assert';
import { type QueueTriggerConfig, resolveWorkerQueueTriggers } from './worker-options.ts';

Deno.test('resolveWorkerQueueTriggers does not add sample triggers by default', () => {
  const queueTriggers = resolveWorkerQueueTriggers(undefined);

  assertEquals(queueTriggers, []);
  assert(Object.isFrozen(queueTriggers));
});

Deno.test('resolveWorkerQueueTriggers preserves explicit triggers without aliasing the input', () => {
  const configured: QueueTriggerConfig[] = [{
    queueName: 'orders',
    jobId: 'process-order',
    concurrency: 2,
  }];

  const queueTriggers = resolveWorkerQueueTriggers(configured);
  configured.push({ queueName: 'invoices', jobId: 'send-invoice' });

  assert(queueTriggers !== configured);
  assertEquals(queueTriggers, [{
    queueName: 'orders',
    jobId: 'process-order',
    concurrency: 2,
  }]);
  assert(Object.isFrozen(queueTriggers));
});
