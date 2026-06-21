import { assertEquals } from '@std/assert';

import { defineSaga } from '../../mod.ts';
import type {
  SagaCorrelationKey,
  SagaDefinition,
  SagaInstanceId,
  SagaState,
} from '../../src/domain/mod.ts';
import type { SagaAppliedKeyOutcome, SagaAppliedKeyStore } from '../../src/ports/mod.ts';
import { createSagaRuntime } from '../../src/runtime/mod.ts';

Deno.test('createSagaRuntime forwards engineOptions.appliedKeys to the native engine', async () => {
  const appliedKeys = new RecordingAppliedKeyStore();
  const runtime = createSagaRuntime({
    native: {
      engineOptions: { appliedKeys },
    },
  });
  const definition = defineSaga('runtime-applied')
    .state<SagaState>({})
    .on('orders.created', () => [])
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'orders.created',
      payload: {},
      correlationKey: 'order:ord_123' as SagaCorrelationKey,
      idempotencyKey: 'orders.created:ord_123',
    });

    assertEquals(appliedKeys.records, [{
      instanceId: 'runtime-applied:order:ord_123',
      idempotencyKey: 'orders.created:ord_123',
    }]);
  } finally {
    await runtime.stop('runtime applied-key wiring test complete');
  }
});

class RecordingAppliedKeyStore implements SagaAppliedKeyStore {
  readonly records: Array<{
    instanceId: SagaInstanceId;
    idempotencyKey: string;
  }> = [];

  recordApplied(
    instanceId: SagaInstanceId,
    idempotencyKey: string,
  ): Promise<SagaAppliedKeyOutcome> {
    this.records.push({ instanceId, idempotencyKey });
    return Promise.resolve({ applied: true });
  }
}
