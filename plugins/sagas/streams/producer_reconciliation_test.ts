import { assert, assertEquals } from '@std/assert';
import { z } from 'zod';
import {
  PrismaSagaInstanceProjection,
  type SagaInstanceProjection,
} from '../src/runtime/saga-instance-projection.ts';
import { mapSagaRecordToEntity } from './producer.ts';

Deno.test('stream reconciliation of versioned Prisma rows preserves business state and runtime status', async () => {
  const state = {
    status: 'refund_pending',
    metadata: { status: 'business', version: 900, updatedAt: 'business-date' },
    state: { nested: true },
    lastMessageType: 'business-message',
  };
  const now = new Date('2030-01-01T00:00:00Z');
  const value: SagaInstanceProjection = {
    sagaId: 'checkout',
    instanceId: 'checkout:one',
    correlationKey: 'one',
    envelope: {
      state,
      metadata: {
        instanceId: 'checkout:one' as SagaInstanceProjection['envelope']['metadata']['instanceId'],
        version: 3,
        status: 'compensating',
        durability: 't1',
        createdAt: now,
        updatedAt: now,
      },
    },
    transition: {
      version: 3,
      transition: {
        from: {},
        to: state,
        status: 'compensating',
        message: { type: 'PaymentFailed', payload: {} },
        occurredAt: now,
      },
    },
  };
  let persisted: unknown;
  await new PrismaSagaInstanceProjection({
    sagaInstance: {
      upsert(args) {
        persisted = args.create;
        return Promise.resolve();
      },
    },
  }).upsert(value);
  const row = z.object({
    correlationId: z.string(),
    sagaName: z.string(),
    state: z.unknown(),
    version: z.number(),
    isCompleted: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }).parse(JSON.parse(JSON.stringify(persisted)));
  const entity = mapSagaRecordToEntity(row);
  assertEquals(entity.state, state);
  assertEquals(entity.status, 'compensating');
  assertEquals(entity.version, 3);
  assertEquals(entity.messageCount, 3);
  assertEquals(entity.lastMessageType, 'PaymentFailed');
  assertEquals(entity.startedAt, now.toISOString());
  assertEquals(entity.updatedAt, now.toISOString());
  assertEquals(entity.completedAt, undefined);
  assertEquals(entity.instanceId, 'checkout:one');
  assert(typeof entity.state === 'object' && entity.state !== null);
  assert(!('projectionVersion' in entity.state));
});

Deno.test('stream reconciliation leaves unversioned legacy state intact', () => {
  const now = new Date('2030-01-01T00:00:00Z');
  const state = { status: 'business', state: { nested: true }, metadata: { version: 2 } };
  const entity = mapSagaRecordToEntity({
    sagaName: 'legacy',
    correlationId: 'one',
    state,
    version: 1,
    isCompleted: true,
    createdAt: now,
    updatedAt: now,
  });
  assertEquals(entity.state, state);
  assertEquals(entity.status, 'completed');
  assertEquals(entity.version, 2);
  assertEquals(entity.completedAt, now.toISOString());
});
