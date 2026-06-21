import { assert, assertEquals, assertRejects } from '@std/assert';
import { delay } from '@std/async';
import type { MessageContext } from '../ports/mod.ts';
import { MemoryDeadLetterStore, MemoryQueueAdapter } from '../testing/mod.ts';

Deno.test('memory queue preserves requeued item settlement state', async () => {
  const queue = new MemoryQueueAdapter<string>({ pollInterval: 1 });
  await queue.enqueue('job');

  const firstController = new AbortController();
  await queue.listen(
    async (_message, context) => {
      await context.nack({ requeue: true });
      firstController.abort();
    },
    { signal: firstController.signal },
  );

  let secondContext: MessageContext | undefined;
  const secondController = new AbortController();
  await assertRejects(
    () =>
      queue.listen(
        (_message, context) => {
          secondContext = context;
          secondController.abort();
          return Promise.reject(new Error('retry me'));
        },
        { signal: secondController.signal },
      ),
    Error,
    'retry me',
  );

  assertEquals(secondContext?.deliveryCount, 2);
  assertEquals(queue.drain(), ['job']);
});

Deno.test('memory queue listen exits when caller signal is already aborted', async () => {
  const queue = new MemoryQueueAdapter<string>({ pollInterval: 1 });
  await queue.enqueue('job');
  const controller = new AbortController();
  controller.abort();
  let handled = false;

  const listening = queue.listen(
    () => {
      handled = true;
      return Promise.resolve();
    },
    { signal: controller.signal },
  );
  const result = await Promise.race([
    listening.then(() => 'completed'),
    delay(20).then(() => 'timed out'),
  ]);
  if (result !== 'completed') {
    await queue.stop();
    await listening;
  }

  assertEquals(result, 'completed');
  assertEquals(handled, false);
  assertEquals(queue.drain(), ['job']);
});

Deno.test('memory queue wait removes abort listeners after empty polls', async () => {
  const originalAdd = AbortSignal.prototype.addEventListener;
  const originalRemove = AbortSignal.prototype.removeEventListener;
  const listeners = new WeakMap<AbortSignal, Set<EventListenerOrEventListenerObject>>();

  AbortSignal.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'abort' && listener !== null) {
      const signalListeners = listeners.get(this) ?? new Set<EventListenerOrEventListenerObject>();
      signalListeners.add(listener);
      listeners.set(this, signalListeners);
    }
    if (listener === null) {
      return;
    }
    return originalAdd.call(this, type, listener, options);
  };
  AbortSignal.prototype.removeEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    if (type === 'abort' && listener !== null) {
      listeners.get(this)?.delete(listener);
    }
    if (listener === null) {
      return;
    }
    return originalRemove.call(this, type, listener, options);
  };

  try {
    const queue = new MemoryQueueAdapter<string>({ pollInterval: 1 });
    const controller = new AbortController();
    const listening = queue.listen(async () => {}, { signal: controller.signal });
    await delay(20);

    const internalSignal =
      (queue as unknown as { abortController: AbortController }).abortController
        .signal;
    const activeWaitListeners = listeners.get(internalSignal)?.size ?? 0;
    controller.abort();
    await listening;

    assert(activeWaitListeners <= 1, 'only the current idle wait should have an abort listener');
  } finally {
    AbortSignal.prototype.addEventListener = originalAdd;
    AbortSignal.prototype.removeEventListener = originalRemove;
  }
});

Deno.test('memory queue dead-letters terminal nacks into the configured store', async () => {
  const deadLetters = new MemoryDeadLetterStore<string>();
  const queue = new MemoryQueueAdapter<string>({
    pollInterval: 1,
    deadLetterStore: deadLetters,
  });
  await queue.enqueue('poison', { headers: { traceparent: '00-test' } });

  const controller = new AbortController();
  await queue.listen(
    async (_message, context) => {
      await context.nack({ requeue: false, reason: 'validation_failed' });
      controller.abort();
    },
    { signal: controller.signal },
  );

  const records = await deadLetters.list();
  assertEquals(records.length, 1);
  assertEquals(records[0].reason, 'validation_failed');
  assertEquals(records[0].payload, 'poison');
  assertEquals(records[0].headers, { traceparent: '00-test' });
});
