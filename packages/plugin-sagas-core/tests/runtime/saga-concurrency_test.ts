import { assertEquals, assertRejects } from '@std/assert';

import { defineSaga, send } from '../../mod.ts';
import { SagasError, type SagaState } from '../../src/domain/mod.ts';
import { createSagaRuntime } from '../../src/runtime/mod.ts';

Deno.test('native runtime rejects overlapping publishes for the same concurrency key', async () => {
  let handled = 0;
  let nestedPublish: Promise<void> | undefined;
  const runtime = createSagaRuntime();
  const definition = defineSaga('same-key-concurrency')
    .state<SagaState>({})
    .concurrency({ limit: 1 })
    .on<string, unknown>('work.requested', () => {
      handled += 1;
      if (handled === 1) {
        nestedPublish = runtime.publish({
          type: 'work.requested',
          payload: {},
          concurrencyKey: 'tenant-a',
        });
        nestedPublish.catch(() => undefined);
      }
      return [];
    })
    .build();

  await runtime.start();
  try {
    await runtime.register([definition]);
    await runtime.publish({
      type: 'work.requested',
      payload: {},
      concurrencyKey: 'tenant-a',
    });

    const rejected = requireNestedPublish(nestedPublish);
    await assertRejects(
      () => rejected,
      SagasError,
      'Saga concurrency limit reached for key same-key-concurrency:tenant-a.',
    );
    assertEquals(handled, 1);
  } finally {
    await runtime.stop('concurrency test complete');
  }
});

Deno.test('native runtime allows overlapping publishes for different concurrency keys', async () => {
  let handled = 0;
  let nestedPublish: Promise<void> | undefined;
  const runtime = createSagaRuntime();
  const definition = defineSaga('different-key-concurrency')
    .state<SagaState>({})
    .concurrency({ limit: 1 })
    .on<string, unknown>('work.requested', () => {
      handled += 1;
      if (handled === 1) {
        nestedPublish = runtime.publish({
          type: 'work.requested',
          payload: {},
          concurrencyKey: 'tenant-b',
        });
      }
      return [];
    })
    .build();

  await runtime.start();
  try {
    await runtime.register([definition]);
    await runtime.publish({
      type: 'work.requested',
      payload: {},
      concurrencyKey: 'tenant-a',
    });
    await requireNestedPublish(nestedPublish);

    assertEquals(handled, 2);
  } finally {
    await runtime.stop('concurrency test complete');
  }
});

Deno.test('native bridge carries cascaded send concurrency keys into saga messages', async () => {
  let observedConcurrencyKey: string | undefined;
  const runtime = createSagaRuntime();
  const definition = defineSaga('cascaded-concurrency')
    .state<SagaState>({})
    .on<string, unknown>('work.requested', (_saga, event) => {
      observedConcurrencyKey = event.concurrencyKey;
      return [];
    })
    .build();

  await runtime.start();
  try {
    await runtime.register([definition]);
    await runtime.dispatchCascaded([
      send('work.requested', {}, { concurrencyKey: 'tenant-a' }),
    ]);

    assertEquals(observedConcurrencyKey, 'tenant-a');
  } finally {
    await runtime.stop('concurrency test complete');
  }
});

function requireNestedPublish(promise: Promise<void> | undefined): Promise<void> {
  if (!promise) {
    throw new Error('Expected nested publish to be created.');
  }
  return promise;
}
