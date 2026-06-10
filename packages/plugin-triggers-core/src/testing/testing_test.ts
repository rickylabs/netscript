import { assertEquals } from '@std/assert';
import { defineFileWatch, defineScheduledTrigger, defineWebhook } from '../builders/mod.ts';
import type { TriggerEvent, TriggerEventId, TriggerId } from '../domain/mod.ts';
import {
  InlineTriggerProcessor,
  MemoryFileWatcherAdapter,
  MemoryTriggerEventStore,
  MemoryTriggerIdempotencyStore,
  MemoryTriggerSchedulerAdapter,
  RecordingTriggerEventStore,
  TriggerTestClock,
} from './mod.ts';

Deno.test('testing stores record and filter trigger events', async () => {
  const store = new RecordingTriggerEventStore(
    new MemoryTriggerEventStore({
      now: fixedNow,
    }),
  );
  const event = webhookEvent();

  await store.save(event);
  await store.updateStatus(event.id, 'completed', { actionsDispatched: 0 });
  const completed = await store.list({ status: 'completed' });

  assertEquals(completed.length, 1);
  assertEquals(completed[0].status, 'completed');
  assertEquals(store.operations.map((operation) => operation.type), [
    'save',
    'updateStatus',
    'list',
  ]);
});

Deno.test('MemoryTriggerIdempotencyStore applies caller, header, and payload-hash precedence', async () => {
  const store = new MemoryTriggerIdempotencyStore({ now: fixedNow });

  const caller = await store.resolveKey({ event: webhookEvent({ idempotencyKey: 'caller-key' }) });
  const header = await store.resolveKey({
    event: webhookEvent({ id: 'evt_2' as TriggerEventId, idempotencyKey: undefined }),
    requestHeaders: { 'x-idempotency-key': 'header-key' },
  });
  const fallback = await store.resolveKey({
    event: webhookEvent({ id: 'evt_3' as TriggerEventId, idempotencyKey: undefined }),
  });

  assertEquals(caller.source, 'caller');
  assertEquals(header.source, 'request-header');
  assertEquals(fallback.source, 'payload-hash');
  await store.markCompleted(caller.key, 60_000);
  const duplicate = await store.resolveKey({
    event: webhookEvent({ idempotencyKey: 'caller-key' }),
  });
  assertEquals(duplicate.claimed, false);
});

Deno.test('inline processor invokes handler and reports deferred status', async () => {
  const processor = new InlineTriggerProcessor({ now: fixedNow });
  const definition = defineWebhook(
    () => Promise.resolve([{ kind: 'defer', until: fixedNow().toISOString() }]),
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );

  const result = await processor.process(webhookEvent(), definition);

  assertEquals(result.status, 'deferred');
  assertEquals(result.actionsDispatched, 1);
  assertEquals(processor.processed.length, 1);
});

Deno.test('memory scheduler and file watcher emit unified trigger events', async () => {
  const schedulerEvents: TriggerEvent[] = [];
  const fileEvents: TriggerEvent[] = [];
  const scheduler = new MemoryTriggerSchedulerAdapter({ now: fixedNow });
  const watcher = new MemoryFileWatcherAdapter({ now: fixedNow });
  const scheduled = defineScheduledTrigger(
    () => Promise.resolve([]),
    { id: 'nightly', cron: '0 0 * * *' },
  );
  const fileWatch = defineFileWatch(
    () => Promise.resolve([]),
    { id: 'inbox', paths: ['./inbox'], patterns: ['**/*.json'], on: ['create'] },
  );

  await scheduler.schedule(scheduled.id, scheduled, (event) => {
    schedulerEvents.push(event);
    return Promise.resolve();
  });
  await watcher.watch(fileWatch, (event) => {
    fileEvents.push(event);
    return Promise.resolve();
  });

  assertEquals(await scheduler.fireNow(scheduled.id), true);
  assertEquals(
    await watcher.emit(fileWatch.id, { path: './inbox/order.json', kind: 'create' }),
    true,
  );
  assertEquals(schedulerEvents[0].kind, 'scheduled');
  assertEquals(fileEvents[0].kind, 'file-watch');
});

Deno.test('TriggerTestClock advances deterministically', async () => {
  const clock = new TriggerTestClock(fixedNow());

  await clock.sleep(250);

  assertEquals(clock.now().toISOString(), '2026-05-17T00:00:00.250Z');
  assertEquals(clock.sleeps(), [250]);
});

function webhookEvent(overrides: Partial<TriggerEvent<'webhook'>> = {}): TriggerEvent<'webhook'> {
  return {
    id: 'evt_1' as TriggerEventId,
    triggerId: 'stripe-payments' as TriggerId,
    kind: 'webhook',
    status: 'pending',
    payload: {
      body: { type: 'payment_intent.succeeded' },
      headers: {},
      method: 'POST',
      path: '/webhooks/stripe',
    },
    attempt: 0,
    detectedAt: fixedNow().toISOString(),
    updatedAt: fixedNow().toISOString(),
    idempotencyKey: 'evt_1',
    ...overrides,
  };
}

function fixedNow(): Date {
  return new Date('2026-05-17T00:00:00.000Z');
}
