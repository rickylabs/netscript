import { defineSaga, type SagaDefinition, type SagaMessage } from '@netscript/plugin-sagas-core';
import { workerJobEffect } from '@netscript/plugin-sagas-core/integration/workers';
import { defineJob, type JobDefinition } from '@netscript/plugin-workers-core';
import { z } from 'zod';

// Arrival order is preserved by the runtime. This workflow converges from either order;
// there is no transport sequence-number reordering contract.
export type PublishOrderState = {
  status: 'waiting' | 'waiting-first' | 'waiting-second' | 'ready';
  first: boolean;
  second: boolean;
};
export const publishOrderJob: JobDefinition<'publish-order-effect', { correlationKey: string }> =
  defineJob('publish-order-effect')
    .payload(z.object({ correlationKey: z.string() }))
    .handler(() => ({ success: true }))
    .build();

export const publishOrderSaga: SagaDefinition<
  'publish-order',
  PublishOrderState,
  SagaMessage<'First', Record<string, never>> | SagaMessage<'Second', Record<string, never>>
> = defineSaga('publish-order')
  .durableWorkerCommands()
  .state<PublishOrderState>({ status: 'waiting', first: false, second: false })
  .on<'First', Record<string, never>>('First', (saga, _event, context) => {
    const ready = saga.state.second;
    const wasReady = saga.state.status === 'ready';
    saga.state = { first: true, second: ready, status: ready ? 'ready' : 'waiting-second' };
    return ready && !wasReady
      ? [workerJobEffect(publishOrderJob, { correlationKey: context.correlationKey }, {
        destination: 'workers',
        topic: 'publish-order',
      })]
      : [];
  })
  .on<'Second', Record<string, never>>('Second', (saga, _event, context) => {
    const ready = saga.state.first;
    const wasReady = saga.state.status === 'ready';
    saga.state = { first: ready, second: true, status: ready ? 'ready' : 'waiting-first' };
    return ready && !wasReady
      ? [workerJobEffect(publishOrderJob, { correlationKey: context.correlationKey }, {
        destination: 'workers',
        topic: 'publish-order',
      })]
      : [];
  })
  .build();
