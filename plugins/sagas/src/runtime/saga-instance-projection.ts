import type {
  SagaCorrelationIndexEntry,
  SagaStorePort,
  SagaStoreWriteOptions,
} from '@netscript/plugin-sagas-core/runtime';
import type {
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '@netscript/plugin-sagas-core/domain';
import { getKv, type WatchableKv } from '@netscript/kv';

/** Query-model projection written after one durable saga transition. */
export type SagaInstanceProjection = Readonly<{
  sagaId: string;
  instanceId: string;
  correlationKey: string;
  envelope: SagaStateEnvelope;
  transition: SagaTransitionRecord;
}>;

/** Projection boundary used by the durable saga store decorator. */
export interface SagaInstanceProjectionPort {
  /** Insert or update the API-facing saga instance row. */
  upsert(projection: SagaInstanceProjection): Promise<void>;
}

/** KV-backed read-model document consumed by the sagas HTTP API fallback. */
export type SagaInstanceReadModel = Readonly<{
  sagaName: string;
  sagaId: string;
  instanceId: string;
  correlationId: string;
  correlationKey: string;
  state: Record<string, unknown>;
  status: SagaStateEnvelope['metadata']['status'];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  version: number;
  messageCount: number;
  lastMessageType?: string;
}>;

/** KV implementation used when the generated Prisma client has no saga delegates. */
export class KvSagaInstanceProjection implements SagaInstanceProjectionPort {
  readonly #injectedKv?: WatchableKv;

  /** Create a projector around an injected or environment-discovered KV backend. */
  constructor(kv?: WatchableKv) {
    this.#injectedKv = kv;
  }

  /** Persist one API read-model document under the `saga_instances` prefix. */
  async upsert(projection: SagaInstanceProjection): Promise<void> {
    const kv = this.#injectedKv ?? await getKv();
    await kv.set(
      ['saga_instances', projection.sagaId, projection.instanceId],
      readModel(projection),
    );
  }
}

/** Prisma subset required to update the `saga_instances` projection. */
export type PrismaSagaInstanceProjectionClient = Readonly<{
  sagaInstance: Readonly<{
    upsert(args: Readonly<Record<string, unknown>>): Promise<unknown>;
  }>;
}>;

/** Prisma implementation of the API-facing saga instance projection. */
export class PrismaSagaInstanceProjection implements SagaInstanceProjectionPort {
  readonly #prisma: PrismaSagaInstanceProjectionClient;

  /** Create a projector around the host-owned Prisma client. */
  constructor(prisma: PrismaSagaInstanceProjectionClient) {
    this.#prisma = prisma;
  }

  /** Upsert a stable row keyed by saga definition and engine instance id. */
  async upsert(projection: SagaInstanceProjection): Promise<void> {
    const state = projectionState(projection);
    const dates = projectionDates(projection.envelope.metadata);
    const create = {
      id: projection.instanceId,
      sagaName: projection.sagaId,
      correlationId: projection.correlationKey,
      version: projection.envelope.metadata.version,
      isCompleted: projection.envelope.metadata.status === 'completed',
      state,
      createdAt: dates.createdAt,
      updatedAt: dates.updatedAt,
    };
    await this.#prisma.sagaInstance.upsert({
      where: {
        sagaName_id: {
          sagaName: projection.sagaId,
          id: projection.instanceId,
        },
      },
      create,
      update: {
        correlationId: projection.correlationKey,
        version: projection.envelope.metadata.version,
        isCompleted: projection.envelope.metadata.status === 'completed',
        state,
        updatedAt: dates.updatedAt,
      },
    });
  }
}

/** Store decorator that projects only after the engine transition ledger persists. */
export class ProjectingSagaStore implements SagaStorePort {
  /** Stable decorated-store identifier. */
  readonly id: string;
  readonly #delegate: SagaStorePort;
  readonly #projection: SagaInstanceProjectionPort;
  readonly #correlations = new Map<string, SagaCorrelationIndexEntry>();

  /** Decorate a canonical saga store with a query-model projection. */
  constructor(delegate: SagaStorePort, projection: SagaInstanceProjectionPort) {
    this.id = `${delegate.id}:projecting`;
    this.#delegate = delegate;
    this.#projection = projection;
  }

  /** Load canonical engine state from the decorated store. */
  load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    return this.#delegate.load<TState>(instanceId);
  }

  /** Save canonical engine state to the decorated store. */
  save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options?: SagaStoreWriteOptions,
  ): Promise<void> {
    return this.#delegate.save(envelope, options);
  }

  /** Persist a transition before updating the query projection. */
  async appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    await this.#delegate.appendTransition(instanceId, record);
    const correlation = this.#correlations.get(instanceId);
    const envelope = await this.#delegate.load(instanceId);
    if (!correlation || !envelope) {
      throw new Error(`Saga projection context is missing for instance ${instanceId}.`);
    }
    await this.#projection.upsert({
      sagaId: correlation.sagaId,
      instanceId,
      correlationKey: correlation.correlationKey,
      envelope,
      transition: record,
    });
  }

  /** Resolve a canonical instance through the decorated correlation index. */
  findByCorrelation(
    sagaId: Parameters<SagaStorePort['findByCorrelation']>[0],
    correlationKey: Parameters<SagaStorePort['findByCorrelation']>[1],
  ): Promise<SagaInstanceId | undefined> {
    return this.#delegate.findByCorrelation(sagaId, correlationKey);
  }

  /** Persist and retain correlation context for the following transition projection. */
  async saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    await this.#delegate.saveCorrelation(entry);
    this.#correlations.set(entry.instanceId, entry);
  }

  /** Delete canonical state and local projection context. */
  delete(instanceId: SagaInstanceId): Promise<void> {
    this.#correlations.delete(instanceId);
    return this.#delegate.delete(instanceId);
  }
}

function projectionState(projection: SagaInstanceProjection): Readonly<Record<string, unknown>> {
  const { metadata } = projection.envelope;
  const dates = projectionDates(metadata);
  return Object.freeze({
    ...projection.envelope.state,
    sagaId: projection.sagaId,
    instanceId: projection.instanceId,
    correlationKey: projection.correlationKey,
    status: metadata.status,
    lastMessageType: projection.transition.transition.message.type,
    metadata: {
      sagaId: projection.sagaId,
      instanceId: projection.instanceId,
      version: metadata.version,
      status: metadata.status,
      durability: metadata.durability,
      createdAt: dates.createdAt.toISOString(),
      updatedAt: dates.updatedAt.toISOString(),
      completedAt: dates.completedAt?.toISOString(),
      traceparent: metadata.traceparent,
      tracestate: metadata.tracestate,
    },
  });
}

function readModel(projection: SagaInstanceProjection): SagaInstanceReadModel {
  const metadata = projection.envelope.metadata;
  const dates = projectionDates(metadata);
  return Object.freeze({
    sagaName: projection.sagaId,
    sagaId: projection.sagaId,
    instanceId: projection.instanceId,
    correlationId: projection.correlationKey,
    correlationKey: projection.correlationKey,
    state: projectionState(projection),
    status: metadata.status,
    createdAt: dates.createdAt.toISOString(),
    updatedAt: dates.updatedAt.toISOString(),
    completedAt: dates.completedAt?.toISOString(),
    version: metadata.version,
    messageCount: metadata.version,
    lastMessageType: projection.transition.transition.message.type,
  });
}

function projectionDates(metadata: SagaStateEnvelope['metadata']): Readonly<{
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}> {
  return Object.freeze({
    createdAt: revivePersistedDate(metadata.createdAt, 'createdAt'),
    updatedAt: revivePersistedDate(metadata.updatedAt, 'updatedAt'),
    completedAt: metadata.completedAt === undefined
      ? undefined
      : revivePersistedDate(metadata.completedAt, 'completedAt'),
  });
}

function revivePersistedDate(value: unknown, field: string): Date {
  const revived = value instanceof Date
    ? value
    : typeof value === 'string'
    ? new Date(value)
    : null;
  if (revived === null || Number.isNaN(revived.getTime())) {
    throw new TypeError(
      `Saga projection metadata.${field} must be a valid Date or persisted date string.`,
    );
  }
  return revived;
}
