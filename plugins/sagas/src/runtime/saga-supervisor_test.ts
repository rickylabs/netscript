import { assertEquals } from 'jsr:@std/assert@^1';
import { resetKv } from '@netscript/kv';

import type {
  SagaCorrelationKey,
  SagaDefinition,
  SagaMessage,
  SagaRuntime,
  SagaState,
} from '@netscript/plugin-sagas-core/runtime';
import { defineSaga } from '../../../../packages/plugin-sagas-core/mod.ts';

import { SagaRuntimeSupervisor } from './saga-supervisor.ts';

Deno.test('SagaRuntimeSupervisor default native runtime persists correlated state', async () => {
  await using _env = await withSagaKvPath();
  const observedCounts: number[] = [];
  const supervisor = new SagaRuntimeSupervisor({
    definitions: [createCounterSaga(observedCounts)],
  });

  await supervisor.start();
  const runtime = runtimeFromSupervisor(supervisor);
  try {
    await runtime.publish(counterMessage('counter-1'));
    await runtime.publish(counterMessage('counter-1'));

    assertEquals(observedCounts, [1, 2]);
    assertEquals(supervisor.snapshot(), {
      status: 'running',
      adapter: 'native',
      definitionCount: 1,
      failure: undefined,
    });
  } finally {
    await supervisor.stop('standalone durable runtime test complete');
  }
});

function createCounterSaga(observedCounts: number[]): SagaDefinition {
  return defineSaga('standalone-durable-counter')
    .state<SagaState>({ count: 0 })
    .on('counter.incremented', (saga) => {
      const count = Number(saga.state.count ?? 0) + 1;
      observedCounts.push(count);
      saga.state = { count };
      return [];
    })
    .build() as SagaDefinition;
}

function counterMessage(correlationKey: string): SagaMessage {
  return {
    type: 'counter.incremented',
    payload: {},
    correlationKey: correlationKey as SagaCorrelationKey,
  };
}

function runtimeFromSupervisor(supervisor: SagaRuntimeSupervisor): SagaRuntime {
  return (supervisor as unknown as { runtime: SagaRuntime }).runtime;
}

type EnvFixture = AsyncDisposable;

async function withSagaKvPath(): Promise<EnvFixture> {
  const previous = Deno.env.get('NETSCRIPT_SAGA_KV_PATH');
  const path = await Deno.makeTempFile({ prefix: 'netscript-sagas-', suffix: '.kv' });
  await resetKv();
  Deno.env.set('NETSCRIPT_SAGA_KV_PATH', path);
  return {
    async [Symbol.asyncDispose](): Promise<void> {
      await resetKv();
      if (previous === undefined) {
        Deno.env.delete('NETSCRIPT_SAGA_KV_PATH');
      } else {
        Deno.env.set('NETSCRIPT_SAGA_KV_PATH', previous);
      }
      try {
        await Deno.remove(path);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    },
  };
}
