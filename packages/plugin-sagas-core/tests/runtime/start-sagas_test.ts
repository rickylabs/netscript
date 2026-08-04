import { assertEquals } from '@std/assert';
import { defineSaga } from '@netscript/plugin-sagas-core';
import type {
  SagaCorrelationKey,
  SagaDefinition,
  SagaState,
} from '@netscript/plugin-sagas-core/domain';
import { startSagas } from '@netscript/plugin-sagas-core/presets';

Deno.test('startSagas returns a runtime that accepts publish immediately', async () => {
  let handled = 0;
  const definition = defineSaga('started-surface')
    .state<SagaState>({ status: 'waiting' })
    .on<string, unknown>('surface.started', () => {
      handled += 1;
      return [];
    })
    .build() as SagaDefinition;
  const started = await startSagas({ definitions: [definition] });

  try {
    await started.runtime.publish({
      type: 'surface.started',
      payload: {},
      correlationKey: 'surface-started' as SagaCorrelationKey,
    });
    assertEquals(handled, 1);
    assertEquals(started.sagaCount, 1);
  } finally {
    await started.shutdown();
  }
});
