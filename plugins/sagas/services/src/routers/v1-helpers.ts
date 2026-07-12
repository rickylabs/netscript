import { getKv } from '@netscript/kv';
import { collection, createNetscriptDb, type KvObject, model } from '@netscript/kv/kvdex';
import type {
  PrismaRecord,
  SagaDefinitionResponse,
  SagaHistoryEntry,
  SagaHistoryResponseEntry,
  SagaInstanceApiStatus,
  SagaInstanceResponse,
  SagaInstanceState,
  SagaInstanceWhereInput,
  SagaMetadataView,
  SagaServiceDatabaseClient,
} from './v1-types.ts';

/** Kvdex saga instance shape used by the fallback list path. */
export type SagaInstanceKv = Readonly<{
  /** Saga definition name. */
  sagaName: string;
  /** Correlation identifier. */
  correlationId: string;
  /** Persisted saga state. */
  state: Record<string, unknown>;
  /** Instance status. */
  status: SagaInstanceApiStatus;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
  /** Optional completion timestamp. */
  completedAt?: string;
  /** State version. */
  version: number;
  /** Approximate message count. */
  messageCount: number;
  /** Optional last message type. */
  lastMessageType?: string;
}>;

/** KV fallback document shape returned by kvdex queries. */
export type SagaKvDocument = Readonly<{
  /** Stored saga instance value. */
  value: unknown;
}>;

/** KV fallback query result shape. */
export type SagaKvQueryResult = Readonly<{
  /** Query result documents. */
  result: readonly SagaKvDocument[];
}>;

/** KV fallback collection operations used by V1 handlers. */
export interface SagaKvCollection {
  /** Find documents by a secondary index. */
  findBySecondaryIndex(
    index: 'sagaName' | 'status',
    value: string,
    options?: { filter?: (doc: SagaKvDocument) => boolean },
  ): Promise<SagaKvQueryResult>;
  /** Return all saga instance documents. */
  getMany(): Promise<SagaKvQueryResult>;
}

/** KV fallback database shape used by V1 handlers. */
export interface SagaKvDatabase {
  /** Saga instance collection. */
  sagaInstances: SagaKvCollection;
}

const sagaModel = model<KvObject>();
const sagaIdGen = (instance: KvObject) =>
  `${String(instance.sagaName)}:${String(instance.correlationId)}`;

const sagaInstancesSchema = {
  sagaInstances: collection(sagaModel, {
    idGenerator: sagaIdGen,
    indices: {
      sagaName: 'secondary',
      status: 'secondary',
    },
  }),
};

let sagaDb: Awaited<ReturnType<typeof createNetscriptDb<typeof sagaInstancesSchema>>> | null = null;

/** Return the KV-backed fallback saga database. */
export async function getSagaDb(): Promise<SagaKvDatabase> {
  if (!sagaDb) {
    await getKv();
    sagaDb = await createNetscriptDb(sagaInstancesSchema);
  }
  return sagaDb as unknown as SagaKvDatabase; // quality-allow: Prisma extension erases the concrete saga KV database methods from its generated client type
}

/** Whether a database value exposes the Prisma saga instance subset. */
export function hasPrismaSagaInstanceClient(
  db: SagaServiceDatabaseClient | unknown,
): db is SagaServiceDatabaseClient {
  return typeof db === 'object' && db !== null && 'sagaInstance' in db &&
    'sagaExecutionHistory' in db;
}

/** Build a provider-aware Prisma where clause for saga instance lists. */
export function buildSagaInstanceWhere(
  sagaName: string | undefined,
  status: SagaInstanceApiStatus | null | undefined,
): SagaInstanceWhereInput {
  const dbProvider = Deno.env.get('DB_PROVIDER') || 'mysql';
  const jsonPath = dbProvider === 'postgres' ? ['status'] : '$.status';
  const whereClause: {
    sagaName?: string;
    isCompleted?: boolean;
    state?: { path: string[] | string; equals: string };
  } = {};

  if (sagaName) {
    whereClause.sagaName = sagaName;
  }
  if (status === 'completed') {
    whereClause.isCompleted = true;
  } else if (status) {
    whereClause.state = { path: jsonPath, equals: status };
  }

  return whereClause;
}

/** Convert a nullable date-like value to an ISO string. */
export function toISOString(value: string | Date | undefined | null): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') {
    if (value.includes('T') && (value.includes('Z') || value.includes('+'))) return value;
    return new Date(value).toISOString();
  }
  return value.toISOString();
}

/** Map saga instance state to the API response shape. */
export function mapStateToInstance(
  sagaName: string,
  correlationId: string,
  state: SagaInstanceState,
): SagaInstanceResponse {
  const metadata = (state as { metadata?: SagaInstanceState['metadata'] }).metadata;
  const isCompleted = metadata?.isCompleted ?? state.isCompleted ?? false;
  const version = metadata?.version ?? state.version ?? 1;
  const stateRecord = state as Record<string, unknown>;
  const lastMessageType = (stateRecord.lastMessageType as string) ||
    (stateRecord.status as string) ||
    undefined;

  return {
    sagaName,
    // Decision-B identifiers: surfaced from durable-store metadata/state when
    // present. They are optional on the contract, so undefined is conformant.
    sagaId: metadata?.sagaId ?? (stateRecord.sagaId as string | undefined),
    instanceId: state.id ?? (stateRecord.instanceId as string | undefined),
    correlationId,
    correlationKey: (stateRecord.correlationKey as string | undefined) ?? correlationId,
    state: state as Record<string, unknown>,
    // Non-completed instances normalize to the canonical `'running'` status
    // (the contract vocabulary has no `'active'`).
    status: isCompleted ? 'completed' : 'running',
    createdAt: toISOString(metadata?.createdAt ?? state.createdAt),
    updatedAt: toISOString(metadata?.updatedAt ?? state.updatedAt),
    completedAt: isCompleted ? toISOString(metadata?.updatedAt ?? state.updatedAt) : undefined,
    version,
    messageCount: version,
    lastMessageType,
  };
}

/** Map a raw Prisma record to the saga instance API response shape. */
export function mapPrismaRecordToInstance(
  record: PrismaRecord,
  sagaName: string = record.sagaName,
): SagaInstanceResponse {
  const state = (record.state ?? {}) as SagaInstanceState;
  return mapStateToInstance(sagaName, record.correlationId, {
    ...state,
    id: record.id,
    correlationId: record.correlationId,
    version: record.version,
    isCompleted: record.isCompleted,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** Map a registered saga definition to the API response shape. */
export function mapSagaToResponse(saga: SagaMetadataView): SagaDefinitionResponse {
  return {
    id: saga.id,
    name: saga.name,
    description: saga.name,
    topic: saga.topic || 'default',
    enabled: saga.enabled ?? true,
    entrypoint: '',
    tags: [] as string[],
    // Decision-B: durability tier defaults to the contract's `'t1'` baseline
    // until per-saga tier metadata is surfaced by the registry.
    durabilityTier: 't1',
    timeout: undefined as { completionTimeout?: number } | undefined,
    retry: undefined as {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
    } | undefined,
  };
}

/** Map one history row to the API history response shape. */
export function mapHistoryEntry(entry: SagaHistoryEntry): SagaHistoryResponseEntry {
  const validOutcomes = ['success', 'error', 'compensated'] as const;
  let newState: Record<string, unknown> = {};
  if (entry.newState && typeof entry.newState === 'object' && !Array.isArray(entry.newState)) {
    newState = entry.newState as Record<string, unknown>;
  } else if (entry.newState !== null && entry.newState !== undefined) {
    newState = { value: entry.newState };
  }

  let previousState: Record<string, unknown> | undefined;
  if (
    entry.previousState && typeof entry.previousState === 'object' &&
    !Array.isArray(entry.previousState)
  ) {
    previousState = entry.previousState as Record<string, unknown>;
  } else if (entry.previousState !== null && entry.previousState !== undefined) {
    previousState = { value: entry.previousState };
  }

  const rawOutcome = entry.outcome?.toLowerCase() || 'success';
  const outcome = validOutcomes.includes(rawOutcome as typeof validOutcomes[number])
    ? rawOutcome as typeof validOutcomes[number]
    : 'success';

  return {
    id: entry.id,
    sagaName: entry.sagaName,
    sagaId: entry.sagaId,
    correlationId: entry.correlationId,
    messageType: entry.messageType,
    messageId: entry.messageId || undefined,
    previousState,
    newState,
    outcome,
    error: entry.error || undefined,
    duration: entry.duration ?? undefined,
    transitionAt: entry.transitionAt.toISOString(),
  };
}
