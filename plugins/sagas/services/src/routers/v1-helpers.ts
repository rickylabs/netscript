import { getKv } from '@netscript/kv';
import { z } from 'zod';
import { KvSagaStore, openSagaRuntimeKv } from '@netscript/plugin-sagas-core/stores';
import type { SagaStorePort } from '@netscript/plugin-sagas-core/runtime';
import type { SagaCorrelationKey, SagaId } from '@netscript/plugin-sagas-core/domain';
import { SAGA_INSTANCE_STATUSES } from '@netscript/plugin-sagas-core/domain';
import {
  parseSagaInstanceReadModel,
  SAGA_INSTANCE_PROJECTION_VERSION,
  type SagaInstanceReadModel,
  sagaInstanceReadModel,
} from '../../../src/runtime/saga-instance-projection.ts';
import type {
  PrismaRecord,
  SagaDefinitionResponse,
  SagaHistoryEntry,
  SagaHistoryResponseEntry,
  SagaInstanceApiStatus,
  SagaInstanceResponse,
  SagaInstanceWhereInput,
  SagaMetadataView,
  SagaServiceDatabaseClient,
} from './v1-types.ts';

/** Kvdex saga instance shape used by the fallback list path. */
export type SagaInstanceKv = SagaInstanceReadModel;

/** List runner-written KV saga instance projections. */
export async function listSagaInstanceKv(): Promise<SagaInstanceKv[]> {
  const kv = await getKv();
  const instances: SagaInstanceKv[] = [];
  for await (const entry of kv.list<unknown>({ prefix: ['saga_instances'] })) {
    instances.push(parseSagaInstanceKv(entry.value));
  }
  return instances.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

/** Read one canonical instance through its correlation index and direct store load. */
export async function findSagaInstanceKv(
  sagaName: string,
  correlationId: string,
  store?: Pick<SagaStorePort, 'findByCorrelation' | 'load'>,
): Promise<SagaInstanceKv | undefined> {
  const canonical = store ?? new KvSagaStore({ kv: await openSagaRuntimeKv() });
  const instanceId = await canonical.findByCorrelation(
    sagaName as SagaId,
    correlationId as SagaCorrelationKey,
  );
  if (instanceId === undefined) return undefined;
  const envelope = await canonical.load(instanceId);
  return envelope === undefined ? undefined : sagaInstanceReadModel({
    sagaId: sagaName,
    correlationKey: correlationId,
    instanceId,
    envelope,
  });
}

/** Validate and return one KV-backed saga instance. */
export function parseSagaInstanceKv(value: unknown): SagaInstanceKv {
  return parseSagaInstanceReadModel(value);
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

/** Map a versioned Prisma projection or an unchanged legacy payload to the API. */
export function mapPrismaRecordToInstance(
  record: PrismaRecord,
  sagaName: string = record.sagaName,
): SagaInstanceResponse {
  if (record.state.projectionVersion === SAGA_INSTANCE_PROJECTION_VERSION) {
    return parseSagaInstanceKv({
      ...record.state,
      sagaName,
      instanceId: record.id,
      correlationId: record.correlationId,
      version: record.version,
      createdAt: toISOString(record.createdAt),
      updatedAt: toISOString(record.updatedAt),
    });
  }
  // Old flat rows may already have lost business fields. Do not guess a nested payload.
  const runtimeStatus = z.enum(SAGA_INSTANCE_STATUSES).safeParse(record.state.status);
  return {
    sagaName,
    sagaId: sagaName,
    instanceId: record.id,
    correlationId: record.correlationId,
    correlationKey: record.correlationId,
    state: record.state,
    status: record.isCompleted
      ? 'completed'
      : runtimeStatus.success
      ? runtimeStatus.data
      : 'running',
    createdAt: toISOString(record.createdAt),
    updatedAt: toISOString(record.updatedAt),
    completedAt: record.isCompleted ? toISOString(record.updatedAt) : undefined,
    version: record.version,
    messageCount: record.version,
    lastMessageType: typeof record.state.lastMessageType === 'string'
      ? record.state.lastMessageType
      : undefined,
  };
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
