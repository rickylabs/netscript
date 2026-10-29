import { defineSaga, sagaCompensate } from '@netscript/plugin-sagas-core';
import type { SagaMessage, SagaState } from '@netscript/plugin-sagas-core/domain';

interface OrderState extends SagaState {
  orderId: string;
  status: 'pending' | 'paid' | 'cancelled';
}
const initial: OrderState = { orderId: '', status: 'pending' };

export const order = defineSaga('order')
  .durability('t1')
  .state(initial)
  .correlate<SagaMessage>((message) => message.correlationKey)
  .on<'PaymentReceived', { orderId: string }>('PaymentReceived', (saga, event) => {
    saga.state.orderId = event.payload.orderId;
    saga.state.status = 'paid';
    return [];
  })
  .on<'PaymentFailed', { reason: string }>('PaymentFailed', (_saga, event) => [
    sagaCompensate(event, event.payload.reason),
  ])
  .compensate('PaymentFailed', (saga) => {
    saga.state.status = 'cancelled';
    return [];
  })
  .build();
