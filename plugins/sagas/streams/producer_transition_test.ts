import { assertEquals } from '@std/assert';
import { MemoryStreamProducer } from '@netscript/plugin-streams-core/testing';
import type { SagaInstanceProjection } from '../src/runtime/saga-instance-projection.ts';
import { SagaStreamInstanceProjection } from './producer.ts';

Deno.test('saga stream projection emits one upsert for every durable transition', async () => {
  const producer = new MemoryStreamProducer();
  const projection = new SagaStreamInstanceProjection(producer);

  await projection.upsert(sagaProjection(1, 'running', 'OrderStarted'));
  await projection.upsert(sagaProjection(2, 'compensating', 'PaymentFailed'));
  await projection.upsert(sagaProjection(3, 'completed', 'RefundCompleted'));

  assertEquals(
    producer.events().map(({ entityType, value = {} }) => ({
      entityType,
      instanceId: value.instanceId,
      status: value.status,
      version: value.version,
      lastMessageType: value.lastMessageType,
    })),
    [
      {
        entityType: 'sagaInstance',
        instanceId: 'checkout:order-42',
        status: 'running',
        version: 1,
        lastMessageType: 'OrderStarted',
      },
      {
        entityType: 'sagaInstance',
        instanceId: 'checkout:order-42',
        status: 'compensating',
        version: 2,
        lastMessageType: 'PaymentFailed',
      },
      {
        entityType: 'sagaInstance',
        instanceId: 'checkout:order-42',
        status: 'completed',
        version: 3,
        lastMessageType: 'RefundCompleted',
      },
    ],
  );
});

function sagaProjection(
  version: number,
  status: 'running' | 'compensating' | 'completed',
  messageType: string,
): SagaInstanceProjection {
  const occurredAt = new Date(`2026-08-04T12:00:0${version}.000Z`);
  return {
    sagaId: 'checkout',
    instanceId: 'order-42',
    correlationKey: 'order-42',
    envelope: {
      state: { orderId: 'order-42' },
      metadata: {
        instanceId: 'order-42' as SagaInstanceProjection['envelope']['metadata']['instanceId'],
        version,
        status,
        durability: 't1',
        createdAt: new Date('2026-08-04T12:00:00.000Z'),
        updatedAt: occurredAt,
      },
    },
    transition: {
      version,
      transition: {
        from: { orderId: 'order-42' },
        to: { orderId: 'order-42' },
        status,
        message: {
          type: messageType,
          payload: {},
        },
        occurredAt,
      },
    },
  };
}
