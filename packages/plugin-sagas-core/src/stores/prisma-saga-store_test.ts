import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { SagasError } from '@netscript/plugin-sagas-core/domain';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '@netscript/plugin-sagas-core/runtime';

import { PrismaSagaStore, type PrismaSagaStoreClient } from './prisma-saga-store.ts';

Deno.test('PrismaSagaStore round-trips state envelopes', async () => {
  const store = new PrismaSagaStore({ prisma: new MemoryPrismaSagaClient() });
  const envelope = createEnvelope({ count: 1 }, 1);

  await store.save(envelope);

  assertEquals(await store.load(envelope.metadata.instanceId), envelope);
  assertEquals(await store.entries(), [envelope]);
});

Deno.test('PrismaSagaStore saves and resolves correlations', async () => {
  const store = new PrismaSagaStore({ prisma: new MemoryPrismaSagaClient() });
  const sagaId = 'billing-saga' as SagaId;
  const correlationKey = 'order-1' as SagaCorrelationKey;
  const instanceId = 'billing-saga:order-1' as SagaInstanceId;

  await store.saveCorrelation({ sagaId, correlationKey, instanceId });

  assertEquals(await store.findByCorrelation(sagaId, correlationKey), instanceId);
});

Deno.test('PrismaSagaStore appends transition log records in version order', async () => {
  const store = new PrismaSagaStore({ prisma: new MemoryPrismaSagaClient() });
  const instanceId = 'billing-saga:order-1' as SagaInstanceId;
  const first = createTransition(1, { status: 'started' }, { status: 'charged' });
  const second = createTransition(2, { status: 'charged' }, { status: 'completed' });

  await store.appendTransition(instanceId, second);
  await store.appendTransition(instanceId, first);

  assertEquals(await store.transitions(instanceId), [first, second]);
});

Deno.test('PrismaSagaStore rejects stale expected versions with KV parity message', async () => {
  const store = new PrismaSagaStore({ prisma: new MemoryPrismaSagaClient() });
  const first = createEnvelope({ count: 1 }, 1);
  const second = createEnvelope({ count: 2 }, 2);

  await store.save(first);

  const error = await assertRejects(
    () => store.save(second, { expectedVersion: 0 }),
    SagasError,
    'Saga store version mismatch',
  );
  assertEquals(error.code, 'SAGA_VALIDATION_FAILED');
  assertEquals(error.message, 'Saga store version mismatch for billing-saga:order-1.');
});

Deno.test('PrismaSagaStore deletes state, transitions, and matching correlations', async () => {
  const store = new PrismaSagaStore({ prisma: new MemoryPrismaSagaClient() });
  const envelope = createEnvelope({ count: 1 }, 1);
  const sagaId = 'billing-saga' as SagaId;
  const correlationKey = 'order-1' as SagaCorrelationKey;
  const transition = createTransition(1, { status: 'started' }, { status: 'charged' });

  await store.save(envelope);
  await store.saveCorrelation({
    sagaId,
    correlationKey,
    instanceId: envelope.metadata.instanceId,
  });
  await store.appendTransition(envelope.metadata.instanceId, transition);

  await store.delete(envelope.metadata.instanceId);

  assertEquals(await store.load(envelope.metadata.instanceId), undefined);
  assertEquals(await store.findByCorrelation(sagaId, correlationKey), undefined);
  assertEquals(await store.transitions(envelope.metadata.instanceId), []);
});

function createEnvelope<TState extends SagaState>(
  state: TState,
  version: number,
): SagaStateEnvelope<TState> {
  const now = new Date('2026-06-20T10:00:00.000Z');
  return Object.freeze({
    metadata: Object.freeze({
      instanceId: 'billing-saga:order-1' as SagaInstanceId,
      version,
      status: 'running',
      durability: 't1',
      createdAt: now,
      updatedAt: now,
    }),
    state,
  });
}

function createTransition<TState extends SagaState>(
  version: number,
  from: TState,
  to: TState,
): SagaTransitionRecord<TState> {
  return Object.freeze({
    version,
    transition: Object.freeze({
      from,
      to,
      status: 'running',
      message: Object.freeze({
        type: 'billing.updated',
        payload: {},
        occurredAt: new Date('2026-06-20T10:00:00.000Z'),
      }),
      occurredAt: new Date('2026-06-20T10:00:00.000Z'),
    }),
  });
}

type StateRow = {
  instanceId: string;
  sagaId: string;
  version: number;
  envelope: unknown;
};

type TransitionRow = {
  instanceId: string;
  version: number;
  record: unknown;
};

type CorrelationRow = {
  sagaId: string;
  correlationKey: string;
  instanceId: string;
};

class MemoryPrismaSagaClient implements PrismaSagaStoreClient {
  readonly #states = new Map<string, StateRow>();
  readonly #transitions = new Map<string, TransitionRow>();
  readonly #correlations = new Map<string, CorrelationRow>();

  readonly sagaRuntimeState = {
    findUnique: (args: { where: { instanceId: string } }): Promise<StateRow | null> =>
      Promise.resolve(this.#states.get(args.where.instanceId) ?? null),
    findMany: (): Promise<readonly StateRow[]> =>
      Promise.resolve(
        [...this.#states.values()].sort((left, right) =>
          left.instanceId.localeCompare(right.instanceId)
        ),
      ),
    create: (args: { data: StateRow }): Promise<unknown> => {
      this.#states.set(args.data.instanceId, { ...args.data });
      return Promise.resolve(args.data);
    },
    upsert: (args: {
      where: { instanceId: string };
      update: Omit<StateRow, 'instanceId'>;
      create: StateRow;
    }): Promise<unknown> => {
      const current = this.#states.get(args.where.instanceId);
      const next = current
        ? { instanceId: args.where.instanceId, ...args.update }
        : { ...args.create };
      this.#states.set(args.where.instanceId, next);
      return Promise.resolve(next);
    },
    updateMany: (args: {
      where: { instanceId: string; version: number };
      data: Omit<StateRow, 'instanceId'>;
    }): Promise<{ count: number }> => {
      const current = this.#states.get(args.where.instanceId);
      if (!current || current.version !== args.where.version) {
        return Promise.resolve({ count: 0 });
      }
      this.#states.set(args.where.instanceId, {
        instanceId: args.where.instanceId,
        ...args.data,
      });
      return Promise.resolve({ count: 1 });
    },
    deleteMany: (args: { where: { instanceId: string } }): Promise<{ count: number }> => {
      const deleted = this.#states.delete(args.where.instanceId);
      return Promise.resolve({ count: deleted ? 1 : 0 });
    },
  };

  readonly sagaRuntimeTransition = {
    findMany: (args: {
      where: { instanceId: string };
      orderBy: { version: 'asc' | 'desc' };
    }): Promise<readonly TransitionRow[]> => {
      const rows = [...this.#transitions.values()]
        .filter((row) => row.instanceId === args.where.instanceId)
        .sort((left, right) => left.version - right.version);
      return Promise.resolve(args.orderBy.version === 'desc' ? rows.reverse() : rows);
    },
    create: (args: { data: TransitionRow }): Promise<unknown> => {
      this.#transitions.set(`${args.data.instanceId}:${args.data.version}`, { ...args.data });
      return Promise.resolve(args.data);
    },
    deleteMany: (args: { where: { instanceId: string } }): Promise<{ count: number }> => {
      let count = 0;
      for (const [key, row] of this.#transitions) {
        if (row.instanceId === args.where.instanceId) {
          this.#transitions.delete(key);
          count++;
        }
      }
      return Promise.resolve({ count });
    },
  };

  readonly sagaRuntimeCorrelation = {
    findUnique: (args: {
      where: { sagaId_correlationKey: { sagaId: string; correlationKey: string } };
    }): Promise<CorrelationRow | null> =>
      Promise.resolve(
        this.#correlations.get(correlationKey(args.where.sagaId_correlationKey)) ?? null,
      ),
    upsert: (args: {
      where: { sagaId_correlationKey: { sagaId: string; correlationKey: string } };
      update: { instanceId: string };
      create: CorrelationRow;
    }): Promise<unknown> => {
      const key = correlationKey(args.where.sagaId_correlationKey);
      const current = this.#correlations.get(key);
      const next = current ? { ...current, ...args.update } : { ...args.create };
      this.#correlations.set(key, next);
      return Promise.resolve(next);
    },
    deleteMany: (args: { where: { instanceId: string } }): Promise<{ count: number }> => {
      let count = 0;
      for (const [key, row] of this.#correlations) {
        if (row.instanceId === args.where.instanceId) {
          this.#correlations.delete(key);
          count++;
        }
      }
      return Promise.resolve({ count });
    },
  };

  $transaction<T>(handler: (tx: PrismaSagaStoreClient) => Promise<T>): Promise<T> {
    return handler(this);
  }
}

function correlationKey(input: { sagaId: string; correlationKey: string }): string {
  return `${input.sagaId}:${input.correlationKey}`;
}
