import type {
  PrismaSagaStoreClient,
  SagaRuntimeCorrelationRow as CorrelationRow,
  SagaRuntimeStateRow as StateRow,
  SagaRuntimeTransitionRow as TransitionRow,
} from '@netscript/plugin-sagas-core/stores';
import { SAGA_RUNTIME_CORRELATION_SELECTOR } from '@netscript/plugin-sagas-core/stores';

/** Typed host client fixture; exercises store wiring, not SQL engine semantics. */
export class RunnerPrismaClient implements PrismaSagaStoreClient {
  queryReads = 0;
  readonly sagaInstance = {
    findMany: (): Promise<[]> => {
      this.queryReads++;
      return Promise.resolve([]);
    },
    count: (): Promise<number> => Promise.resolve(0),
    upsert: (): Promise<void> => Promise.resolve(),
  };
  readonly sagaExecutionHistory = {
    findMany: (): Promise<[]> => Promise.resolve([]),
    count: (): Promise<number> => Promise.resolve(0),
  };
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
      where: {
        [SAGA_RUNTIME_CORRELATION_SELECTOR]: { sagaId: string; correlationKey: string };
      };
    }): Promise<CorrelationRow | null> =>
      Promise.resolve(
        this.#correlations.get(
          correlationKey(args.where[SAGA_RUNTIME_CORRELATION_SELECTOR]),
        ) ?? null,
      ),
    upsert: (args: {
      where: {
        [SAGA_RUNTIME_CORRELATION_SELECTOR]: { sagaId: string; correlationKey: string };
      };
      update: { instanceId: string };
      create: CorrelationRow;
    }): Promise<unknown> => {
      const key = correlationKey(args.where[SAGA_RUNTIME_CORRELATION_SELECTOR]);
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
