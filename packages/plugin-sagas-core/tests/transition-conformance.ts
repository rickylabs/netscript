import { assertEquals, assertRejects } from '@std/assert';
import type { SagaCorrelationKey, SagaId, SagaInstanceId } from '../src/domain/mod.ts';
import type {
  SagaTransitionCommitRequest,
  SagaTransitionStore,
} from '../src/ports/saga-transition-commit-port.ts';

type MutableFixture<T> = {
  -readonly [K in keyof T]: T[K] extends
    string | number | boolean | bigint | symbol | null | undefined ? T[K]
    : T[K] extends Date ? Date
    : T[K] extends readonly (infer Item)[] ? MutableFixture<Item>[]
    : T[K] extends object ? MutableFixture<T[K]>
    : T[K];
};

export function transitionRequest(
  version: number = 1,
  commandId: string = 'outbox-one',
  hash: string = 'a'.repeat(64),
): MutableFixture<SagaTransitionCommitRequest> {
  const at = new Date(0);
  return {
    expectedVersion: version - 1,
    envelope: {
      metadata: {
        instanceId: 'document:one' as SagaInstanceId,
        version,
        status: 'running' as const,
        durability: 't2' as const,
        createdAt: at,
        updatedAt: at,
      },
      state: { count: version, createdAt: 'business-string' },
    },
    correlation: {
      sagaId: 'document' as SagaId,
      correlationKey: 'one' as SagaCorrelationKey,
      instanceId: 'document:one' as SagaInstanceId,
    },
    record: {
      version,
      transition: {
        from: { count: version - 1 },
        to: { count: version, createdAt: 'business-string' },
        status: 'running' as const,
        message: { type: 'start', payload: {}, occurredAt: at },
        occurredAt: at,
      },
    },
    commands: [{
      id: commandId,
      executionId: commandId,
      commandName: 'saga.worker-job:document',
      commandVersion: 1,
      destination: 'workers',
      topic: 'document',
      payloadJson: '{"documentId":"one"}',
      dedupeKey: commandId,
      correlationId: 'one',
      availableAt: at,
    }],
    appliedKeyHash: hash,
  };
}

/** Identical semantic contract exercised against memory and the physical provider. */
export async function assertAtomicTransitionConformance(store: SagaTransitionStore): Promise<void> {
  const initial = transitionRequest();
  assertEquals(await store.commitTransition(initial), { committed: true });
  const replay = transitionRequest(2, 'replay-command');
  assertEquals(await store.commitTransition(replay), { committed: false });
  assertEquals((await store.load(initial.correlation.instanceId))?.metadata.version, 1);
  await assertRejects(() => store.commitTransition(transitionRequest(1, 'stale', 'b'.repeat(64))));
  assertEquals((await store.load(initial.correlation.instanceId))?.state, initial.envelope.state);
  const next = transitionRequest(2, 'outbox-two', 'c'.repeat(64));
  assertEquals(await store.commitTransition(next), { committed: true });
  next.envelope.state.count = 99;
  assertEquals((await store.load(initial.correlation.instanceId))?.state.count, 2);
  assertEquals(
    (await store.load(initial.correlation.instanceId))?.state.createdAt,
    'business-string',
  );
  const conflicting = transitionRequest(1, 'other', 'd'.repeat(64));
  conflicting.envelope.metadata.instanceId = 'document:other' as SagaInstanceId;
  conflicting.correlation.instanceId = conflicting.envelope.metadata.instanceId;
  await assertRejects(() => store.commitTransition(conflicting));
  assertEquals(await store.load(conflicting.correlation.instanceId), undefined);
  assertEquals(
    await store.findByCorrelation(initial.correlation.sagaId, initial.correlation.correlationKey),
    initial.correlation.instanceId,
  );
}
