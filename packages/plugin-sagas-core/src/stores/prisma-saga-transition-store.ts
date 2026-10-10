import { SAGA_DURABILITY_TIERS, SAGA_INSTANCE_STATUSES } from '../domain/mod.ts';
import { z } from 'zod';
import { bindPostgresCommandOutbox } from '@netscript/database/commands/postgres';
import type {
  PostgresCommandClient,
  TransactionClientPort,
} from '@netscript/database/commands/postgres';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '../domain/mod.ts';
import type { SagaCorrelationIndexEntry, SagaStoreWriteOptions } from '../ports/saga-store-port.ts';
import type {
  SagaTransitionCommitRequest,
  SagaTransitionCommitResult,
  SagaTransitionStore,
} from '../ports/saga-transition-commit-port.ts';
import { snapshotTransitionCommit } from '../application/validate-transition-commit.ts';

/** Finite physical transaction deadline; the host owns provider connections and migration. */
export type PrismaSagaTransitionStoreOptions = Readonly<{ transactionTimeoutMs: number }>;

/** Atomic PostgreSQL saga store with detached diagnostic state/history reads. */
export interface PrismaSagaTransitionStore extends SagaTransitionStore {
  /** Read state envelopes in instance-id order. */
  entries<TState extends SagaState = SagaState>(): Promise<readonly SagaStateEnvelope<TState>[]>;
  /** Read immutable history in version order. */
  transitions<TState extends SagaState = SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<readonly SagaTransitionRecord<TState>[]>;
}

/**
 * Commit native saga rows and command intents on the true Prisma/PostgreSQL callback.
 * Requires the reviewed saga runtime/replay and command outbox migration. Construction
 * starts no resources and executes no DDL. Opted-in engine paths call commitTransition
 * once; inherited granular port methods remain separate writes for legacy callers.
 * Replay keys cover this protocol only, not general Prisma SagaIdempotencyPort parity.
 * Cancellation checkpoints roll back the callback; in-flight SQL uses the finite deadline.
 *
 * @example
 * ```ts
 * import { createPrismaSagaTransitionStore } from '@netscript/plugin-sagas-core/stores';
 * import type { PostgresCommandClient, TransactionClientPort } from '@netscript/database/commands/postgres';
 * declare const root: PostgresCommandClient & TransactionClientPort<PostgresCommandClient>;
 * const store = createPrismaSagaTransitionStore(root, { transactionTimeoutMs: 5000 });
 * await store.entries();
 * ```
 */
export function createPrismaSagaTransitionStore<TTx extends PostgresCommandClient>(
  root: PostgresCommandClient & TransactionClientPort<TTx>,
  options: PrismaSagaTransitionStoreOptions,
): PrismaSagaTransitionStore {
  const timeout = options.transactionTimeoutMs;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60000) {
    throw new TypeError('Atomic saga store requires a finite transaction timeout.');
  }
  return new BoundPrismaSagaStore(root, timeout);
}

class BoundPrismaSagaStore<TTx extends PostgresCommandClient> implements PrismaSagaTransitionStore {
  readonly id = 'prisma-saga-transition-store';
  readonly transitionCommitCapabilities = Object.freeze({
    transitionOutbox: 'same_commit' as const,
    optimisticVersion: true as const,
    replay: 'same_commit' as const,
  });
  readonly #root: PostgresCommandClient & TransactionClientPort<TTx>;
  readonly #timeout: number;
  constructor(root: PostgresCommandClient & TransactionClientPort<TTx>, timeout: number) {
    this.#root = root;
    this.#timeout = timeout;
  }

  async commitTransition(
    request: SagaTransitionCommitRequest,
    signal?: AbortSignal,
  ): Promise<SagaTransitionCommitResult> {
    const snapshot = snapshotTransitionCommit(request);
    signal?.throwIfAborted();
    let invoked = false;
    return await this.#root.$transaction(async (tx) => {
      if (invoked) throw new TypeError('Atomic saga callback reentry refused.');
      invoked = true;
      const writer = bindPostgresCommandOutbox(tx);
      signal?.throwIfAborted();
      const { envelope, correlation, record, commands, expectedVersion, appliedKeyHash } = snapshot;
      if (appliedKeyHash !== undefined) {
        const marked = await tx.$queryRawUnsafe<{ instance_id: string }[]>(
          'INSERT INTO saga_runtime_command_applied_key (instance_id,key_hash) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING instance_id',
          envelope.metadata.instanceId,
          appliedKeyHash,
        );
        if (marked.length === 0) return { committed: false };
      }
      signal?.throwIfAborted();
      await writeState(tx, envelope, correlation.sagaId, expectedVersion);
      signal?.throwIfAborted();
      await writeCorrelation(tx, correlation);
      signal?.throwIfAborted();
      await writeHistory(tx, envelope.metadata.instanceId, record);
      signal?.throwIfAborted();
      await writer.append(commands);
      signal?.throwIfAborted();
      return { committed: true };
    }, { timeout: this.#timeout });
  }

  async load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    const rows = await this.#root.$queryRawUnsafe<{ envelope: unknown }[]>(
      'SELECT envelope FROM saga_runtime_state WHERE instance_id=$1',
      instanceId,
    );
    return rows[0] ? hydrateEnvelope<TState>(rows[0].envelope) : undefined;
  }

  async save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options: SagaStoreWriteOptions = {},
  ): Promise<void> {
    await writeState(
      this.#root,
      envelope,
      String(envelope.metadata.instanceId).split(':')[0],
      options.expectedVersion,
    );
  }

  async appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    await writeHistory(this.#root, instanceId, record);
  }

  async findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    const rows = await this.#root.$queryRawUnsafe<{ instance_id: string }[]>(
      'SELECT instance_id FROM saga_runtime_correlation WHERE saga_id=$1 AND correlation_key=$2',
      sagaId,
      correlationKey,
    );
    return rows[0]?.instance_id as SagaInstanceId | undefined;
  }

  async saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    await writeCorrelation(this.#root, entry);
  }

  async delete(instanceId: SagaInstanceId): Promise<void> {
    await this.#root.$transaction(async (tx) => {
      bindPostgresCommandOutbox(tx);
      await tx.$executeRawUnsafe(
        'DELETE FROM saga_runtime_correlation WHERE instance_id=$1',
        instanceId,
      );
      await tx.$executeRawUnsafe(
        'DELETE FROM saga_runtime_transition WHERE instance_id=$1',
        instanceId,
      );
      await tx.$executeRawUnsafe('DELETE FROM saga_runtime_state WHERE instance_id=$1', instanceId);
      // Committed commands and replay markers retain their independent delivery lifetime.
    }, { timeout: this.#timeout });
  }

  async entries<TState extends SagaState = SagaState>(): Promise<
    readonly SagaStateEnvelope<TState>[]
  > {
    const rows = await this.#root.$queryRawUnsafe<{ envelope: unknown }[]>(
      'SELECT envelope FROM saga_runtime_state ORDER BY instance_id',
    );
    return Object.freeze(rows.map((row) => hydrateEnvelope<TState>(row.envelope)));
  }

  async transitions<TState extends SagaState = SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<readonly SagaTransitionRecord<TState>[]> {
    const rows = await this.#root.$queryRawUnsafe<{ record: unknown }[]>(
      'SELECT record FROM saga_runtime_transition WHERE instance_id=$1 ORDER BY version',
      instanceId,
    );
    return Object.freeze(rows.map((row) => hydrateHistory<TState>(row.record)));
  }
}

async function writeState(
  tx: PostgresCommandClient,
  envelope: SagaStateEnvelope,
  sagaId: string,
  expectedVersion?: number,
): Promise<void> {
  const values = [
    envelope.metadata.instanceId,
    sagaId,
    envelope.metadata.version,
    JSON.stringify(envelope),
  ];
  let rows: { instance_id: string }[];
  if (expectedVersion === undefined) {
    rows = await tx.$queryRawUnsafe(
      'INSERT INTO saga_runtime_state (instance_id,saga_id,version,envelope,updated_at) VALUES ($1,$2,$3,$4::jsonb,NOW()) ON CONFLICT(instance_id) DO UPDATE SET saga_id=$2,version=$3,envelope=$4::jsonb,updated_at=NOW() RETURNING instance_id',
      ...values,
    );
  } else if (expectedVersion === 0) {
    rows = await tx.$queryRawUnsafe(
      'INSERT INTO saga_runtime_state (instance_id,saga_id,version,envelope,updated_at) VALUES ($1,$2,$3,$4::jsonb,NOW()) ON CONFLICT DO NOTHING RETURNING instance_id',
      ...values,
    );
  } else {
    rows = await tx.$queryRawUnsafe(
      'UPDATE saga_runtime_state SET version=$3,envelope=$4::jsonb,updated_at=NOW() WHERE instance_id=$1 AND saga_id=$2 AND version=$5 RETURNING instance_id',
      ...values,
      expectedVersion,
    );
  }
  if (rows.length !== 1) throw new Error('Atomic saga version mismatch.');
}

async function writeCorrelation(
  tx: PostgresCommandClient,
  entry: SagaCorrelationIndexEntry,
): Promise<void> {
  const rows = await tx.$queryRawUnsafe<{ instance_id: string }[]>(
    'INSERT INTO saga_runtime_correlation (id,saga_id,correlation_key,instance_id,updated_at) VALUES ($1::uuid,$2,$3,$4,NOW()) ON CONFLICT(saga_id,correlation_key) DO UPDATE SET updated_at=NOW() WHERE saga_runtime_correlation.instance_id=EXCLUDED.instance_id RETURNING instance_id',
    crypto.randomUUID(),
    entry.sagaId,
    entry.correlationKey,
    entry.instanceId,
  );
  if (rows.length !== 1) throw new Error('Atomic saga correlation ownership conflict.');
}

async function writeHistory(
  tx: PostgresCommandClient,
  instanceId: SagaInstanceId,
  record: SagaTransitionRecord,
): Promise<void> {
  await tx.$executeRawUnsafe(
    'INSERT INTO saga_runtime_transition (instance_id,version,record) VALUES ($1,$2,$3::jsonb)',
    instanceId,
    record.version,
    JSON.stringify(record),
  );
}

const metadataSchema = z.object({
  instanceId: z.string(),
  version: z.number().int().nonnegative(),
  status: z.enum(SAGA_INSTANCE_STATUSES),
  durability: z.enum(SAGA_DURABILITY_TIERS),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
  compensationError: z.object({ name: z.string(), message: z.string() }).optional(),
});
const envelopeSchema = z.object({
  metadata: metadataSchema,
  state: z.record(z.string(), z.unknown()),
});
const historySchema = z.object({
  version: z.number().int().positive(),
  transition: z.object({
    from: z.record(z.string(), z.unknown()),
    to: z.record(z.string(), z.unknown()),
    status: metadataSchema.shape.status,
    occurredAt: z.iso.datetime(),
    message: z.object({
      type: z.string(),
      payload: z.unknown(),
      occurredAt: z.iso.datetime().optional(),
    }).passthrough(),
  }),
});
function hydrateEnvelope<TState extends SagaState>(value: unknown): SagaStateEnvelope<TState> {
  const parsed = envelopeSchema.parse(value);
  const metadata = parsed.metadata;
  return {
    metadata: {
      ...metadata,
      instanceId: metadata.instanceId as SagaInstanceId,
      createdAt: new Date(metadata.createdAt),
      updatedAt: new Date(metadata.updatedAt),
      ...(metadata.completedAt
        ? { completedAt: new Date(metadata.completedAt) }
        : { completedAt: undefined }),
    },
    state: parsed.state as TState,
  };
}
function hydrateHistory<TState extends SagaState>(value: unknown): SagaTransitionRecord<TState> {
  const parsed = historySchema.parse(value);
  return {
    version: parsed.version,
    transition: {
      ...parsed.transition,
      from: parsed.transition.from as TState,
      to: parsed.transition.to as TState,
      occurredAt: new Date(parsed.transition.occurredAt),
      message: {
        ...parsed.transition.message,
        ...(parsed.transition.message.occurredAt
          ? { occurredAt: new Date(parsed.transition.message.occurredAt) }
          : { occurredAt: undefined }),
      },
    },
  };
}
