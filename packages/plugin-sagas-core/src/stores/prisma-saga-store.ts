import { SagasError } from '../domain/mod.ts';
import type {
  SagaCorrelationIndexEntry,
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaStorePort,
  SagaStoreWriteOptions,
  SagaTransitionRecord,
} from '../runtime/mod.ts';

/** Result returned by Prisma write operations that report affected row count. */
export type WriteResult = Readonly<{ count: number }>;

/** Prisma row shape for persisted saga runtime state. */
export type SagaRuntimeStateRow = Readonly<{
  instanceId: string;
  sagaId: string;
  version: number;
  envelope: unknown;
}>;

/** Prisma row shape for persisted saga transition history. */
export type SagaRuntimeTransitionRow = Readonly<{
  instanceId: string;
  version: number;
  record: unknown;
}>;

/** Prisma row shape for the saga correlation index. */
export type SagaRuntimeCorrelationRow = Readonly<{
  sagaId: string;
  correlationKey: string;
  instanceId: string;
}>;

/** Prisma delegate surface required for saga runtime state rows. */
export type SagaRuntimeStateDelegate = Readonly<{
  findUnique(args: { where: { instanceId: string } }): Promise<SagaRuntimeStateRow | null>;
  findMany(args?: {
    orderBy?: { instanceId?: 'asc' | 'desc' };
  }): Promise<readonly SagaRuntimeStateRow[]>;
  create(args: { data: SagaRuntimeStateWrite }): Promise<unknown>;
  upsert(args: {
    where: { instanceId: string };
    update: SagaRuntimeStateUpdate;
    create: SagaRuntimeStateWrite;
  }): Promise<unknown>;
  updateMany(args: {
    where: { instanceId: string; version: number };
    data: SagaRuntimeStateUpdate;
  }): Promise<WriteResult>;
  deleteMany(args: { where: { instanceId: string } }): Promise<WriteResult>;
}>;

/** Prisma delegate surface required for saga transition history rows. */
export type SagaRuntimeTransitionDelegate = Readonly<{
  findMany(args: {
    where: { instanceId: string };
    orderBy: { version: 'asc' | 'desc' };
  }): Promise<readonly SagaRuntimeTransitionRow[]>;
  create(args: { data: SagaRuntimeTransitionWrite }): Promise<unknown>;
  deleteMany(args: { where: { instanceId: string } }): Promise<WriteResult>;
}>;

/** Prisma delegate surface required for saga correlation rows. */
export type SagaRuntimeCorrelationDelegate = Readonly<{
  findUnique(args: {
    where: { sagaId_correlationKey: { sagaId: string; correlationKey: string } };
  }): Promise<SagaRuntimeCorrelationRow | null>;
  upsert(args: {
    where: { sagaId_correlationKey: { sagaId: string; correlationKey: string } };
    update: { instanceId: string };
    create: SagaRuntimeCorrelationWrite;
  }): Promise<unknown>;
  deleteMany(args: { where: { instanceId: string } }): Promise<WriteResult>;
}>;

/** Prisma create payload for saga runtime state rows. */
export type SagaRuntimeStateWrite = Readonly<{
  instanceId: string;
  sagaId: string;
  version: number;
  envelope: unknown;
}>;

/** Prisma update payload for saga runtime state rows. */
export type SagaRuntimeStateUpdate = Readonly<{
  sagaId: string;
  version: number;
  envelope: unknown;
}>;

/** Prisma create payload for saga transition history rows. */
export type SagaRuntimeTransitionWrite = Readonly<{
  instanceId: string;
  version: number;
  record: unknown;
}>;

/** Prisma create payload for saga correlation rows. */
export type SagaRuntimeCorrelationWrite = Readonly<{
  sagaId: string;
  correlationKey: string;
  instanceId: string;
}>;

/** Prisma client shape consumed by `PrismaSagaStore`. */
export type PrismaSagaStoreClient = Readonly<{
  sagaRuntimeState: SagaRuntimeStateDelegate;
  sagaRuntimeTransition: SagaRuntimeTransitionDelegate;
  sagaRuntimeCorrelation: SagaRuntimeCorrelationDelegate;
  $transaction<T>(handler: (tx: PrismaSagaStoreClient) => Promise<T>): Promise<T>;
}>;

/** Options for the Prisma-backed saga runtime store. */
export type PrismaSagaStoreOptions = Readonly<{
  prisma: PrismaSagaStoreClient;
}>;

/** Prisma/Postgres-backed saga state store for durable native saga execution. */
export class PrismaSagaStore implements SagaStorePort {
  /** Stable store identifier used by runtime diagnostics. */
  readonly id = 'prisma-saga-store';
  readonly #prisma: PrismaSagaStoreClient;

  /** Create a saga store over a host-owned Prisma client. */
  constructor(options: PrismaSagaStoreOptions) {
    this.#prisma = options.prisma;
  }

  /** Load a saga state envelope by instance id. */
  async load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    const row = await this.#prisma.sagaRuntimeState.findUnique({
      where: { instanceId },
    });
    return row ? reviveSagaJson(row.envelope) as SagaStateEnvelope<TState> : undefined;
  }

  /** Save a saga state envelope with optimistic version checking. */
  async save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options: SagaStoreWriteOptions = {},
  ): Promise<void> {
    await this.#prisma.$transaction(async (tx) => {
      const write = stateWriteFromEnvelope(envelope);
      if (options.expectedVersion === undefined) {
        await tx.sagaRuntimeState.upsert({
          where: { instanceId: write.instanceId },
          update: {
            sagaId: write.sagaId,
            version: write.version,
            envelope: write.envelope,
          },
          create: write,
        });
        return;
      }

      const result = await tx.sagaRuntimeState.updateMany({
        where: {
          instanceId: write.instanceId,
          version: options.expectedVersion,
        },
        data: {
          sagaId: write.sagaId,
          version: write.version,
          envelope: write.envelope,
        },
      });
      if (result.count > 0) {
        return;
      }

      const current = await tx.sagaRuntimeState.findUnique({
        where: { instanceId: write.instanceId },
      });
      if (current) {
        throw versionMismatch(envelope.metadata.instanceId);
      }

      await tx.sagaRuntimeState.create({ data: write });
    });
  }

  /** Append a transition record for one saga instance. */
  async appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    await this.#prisma.sagaRuntimeTransition.create({
      data: {
        instanceId,
        version: record.version,
        record: serializeSagaJson(record),
      },
    });
  }

  /** Find an instance id by saga id and correlation key. */
  async findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    const row = await this.#prisma.sagaRuntimeCorrelation.findUnique({
      where: { sagaId_correlationKey: { sagaId, correlationKey } },
    });
    return row?.instanceId as SagaInstanceId | undefined;
  }

  /** Save or update the correlation index for an instance. */
  async saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    await this.#prisma.sagaRuntimeCorrelation.upsert({
      where: {
        sagaId_correlationKey: {
          sagaId: entry.sagaId,
          correlationKey: entry.correlationKey,
        },
      },
      update: { instanceId: entry.instanceId },
      create: {
        sagaId: entry.sagaId,
        correlationKey: entry.correlationKey,
        instanceId: entry.instanceId,
      },
    });
  }

  /** Delete persisted state, transition history, and matching correlation indexes. */
  async delete(instanceId: SagaInstanceId): Promise<void> {
    await this.#prisma.$transaction(async (tx) => {
      await tx.sagaRuntimeCorrelation.deleteMany({ where: { instanceId } });
      await tx.sagaRuntimeTransition.deleteMany({ where: { instanceId } });
      await tx.sagaRuntimeState.deleteMany({ where: { instanceId } });
    });
  }

  /** Return all stored state envelopes for diagnostics and tests. */
  async entries<TState extends SagaState = SagaState>(): Promise<
    readonly SagaStateEnvelope<TState>[]
  > {
    const rows = await this.#prisma.sagaRuntimeState.findMany({
      orderBy: { instanceId: 'asc' },
    });
    return Object.freeze(
      rows.map((row) => reviveSagaJson(row.envelope) as SagaStateEnvelope<TState>),
    );
  }

  /** Return transition records for one instance in version order. */
  async transitions<TState extends SagaState = SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<readonly SagaTransitionRecord<TState>[]> {
    const rows = await this.#prisma.sagaRuntimeTransition.findMany({
      where: { instanceId },
      orderBy: { version: 'asc' },
    });
    return Object.freeze(
      rows.map((row) => reviveSagaJson(row.record) as SagaTransitionRecord<TState>),
    );
  }

  /** Host owns the Prisma client lifecycle; close is intentionally a no-op. */
  close(): void {}
}

function stateWriteFromEnvelope<TState extends SagaState>(
  envelope: SagaStateEnvelope<TState>,
): SagaRuntimeStateWrite {
  return {
    instanceId: envelope.metadata.instanceId,
    sagaId: sagaIdFromInstanceId(envelope.metadata.instanceId),
    version: envelope.metadata.version,
    envelope: serializeSagaJson(envelope),
  };
}

function sagaIdFromInstanceId(instanceId: SagaInstanceId): string {
  return String(instanceId).split(':', 1)[0] ?? String(instanceId);
}

function serializeSagaJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function reviveSagaJson(value: unknown): unknown {
  return reviveDates(value);
}

function reviveDates(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(reviveDates));
  }
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const entries = Object.entries(source).map(([key, entry]) => [
      key,
      DATE_KEYS.has(key) && typeof entry === 'string' && isIsoDate(entry)
        ? new Date(entry)
        : reviveDates(entry),
    ]);
    return Object.freeze(Object.fromEntries(entries));
  }
  return value;
}

const DATE_KEYS = new Set(['createdAt', 'updatedAt', 'completedAt', 'occurredAt']);

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
}

function versionMismatch(instanceId: SagaInstanceId): SagasError {
  return SagasError.validationFailed(`Saga store version mismatch for ${instanceId}.`);
}
