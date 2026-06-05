/**
 * Sagas Router - Version 1
 *
 * Implements V1 contract handlers for saga management, instances, and SSE streaming.
 * Uses saga-bus native methods for cross-service message publishing.
 * Uses PrismaSagaStore for durable saga instance queries.
 *
 * @module
 */

import { withEventMeta } from '@orpc/server';
import {
  type PublishMessageInput,
  type PublishMessageOutput,
  sagasContractV1,
  type SagaSSEEvent,
} from '../../../contracts/v1/mod.ts';
import { getKv } from '@netscript/kv';
import { collection, createNetscriptDb, type KvObject, model } from '@netscript/kv/kvdex';
import { notFound } from '@netscript/contracts';
import { getTraceContext } from '@netscript/telemetry/context';
import { z } from 'zod';
import { getSagaMetadata, listSagaMetadata, type SagaMetadata } from '../saga-registry.ts';
import {
  type SagaCorrelationKey,
  type SagaMessage,
  SagasError,
} from '@netscript/plugin-sagas-core/domain';
import type { SagaRuntime } from '@netscript/plugin-sagas-core/runtime';

// --- kvdex schema for saga instances (used in KV fallback path) ---

const SagaInstanceKvSchema = z.object({
  sagaName: z.string(),
  correlationId: z.string(),
  state: z.record(z.string(), z.unknown()),
  status: z.enum(['pending', 'active', 'completed', 'failed', 'compensating']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  version: z.number(),
  messageCount: z.number(),
  lastMessageType: z.string().optional(),
});

type SagaInstanceKv = z.infer<typeof SagaInstanceKvSchema>;

// kvdex's model() accepts an optional transform *function*, NOT a Zod schema.
// We use `model<KvObject>()` to satisfy the compile-time KvValue constraint.
// We validate before add/set; type safety is restored via casts at read sites.
const _sagaModel = model<KvObject>();
const _sagaIdGen = (instance: KvObject) =>
  `${String(instance.sagaName)}:${String(instance.correlationId)}`;

const sagaInstancesSchema = {
  sagaInstances: collection(_sagaModel, {
    idGenerator: _sagaIdGen,
    indices: {
      sagaName: 'secondary',
      status: 'secondary',
    },
  }),
};

let _sagaDb: Awaited<ReturnType<typeof createNetscriptDb<typeof sagaInstancesSchema>>> | null =
  null;

async function getSagaDb() {
  if (!_sagaDb) {
    await getKv(); // Ensure KV provider is initialized first
    _sagaDb = await createNetscriptDb(sagaInstancesSchema);
  }
  return _sagaDb;
}

type SagaServiceContext = Readonly<{
  db: SagaServiceDatabaseClient;
  sagaRuntime?: SagaRuntime;
}>;

export type SagaPublishEventWriter = (
  event: SagaSSEEvent,
) => Promise<void>;

export type PublishSagaMessageOptions = Readonly<{
  runtime: SagaRuntime;
  writeEvent?: SagaPublishEventWriter;
  traceHeaders?: Readonly<Record<string, string>>;
}>;

const router = sagasContractV1.$context<SagaServiceContext>();

// Type for saga state returned by PrismaSagaStore
interface SagaInstanceState {
  id: string;
  correlationId: string;
  version: number;
  isCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    sagaId?: string;
    version?: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    isCompleted?: boolean;
    traceParent?: string | null;
    traceState?: string | null;
  };
  [key: string]: unknown;
}

/**
 * Raw Prisma record returned by findMany (before recordToState transformation)
 */
interface PrismaRecord {
  id: string;
  sagaName: string;
  correlationId: string;
  version: number;
  isCompleted: boolean;
  state: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Saga execution history record from Prisma
 */
interface SagaHistoryEntry {
  id: string;
  sagaName: string;
  sagaId: string;
  correlationId: string;
  stepName: string;
  messageType: string;
  messageId?: string | null;
  outcome?: string | null;
  error?: string | null;
  duration?: number | null;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  transitionAt: Date;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

interface SagaServiceDatabaseClient {
  sagaInstance: {
    findMany(args: {
      where?: {
        sagaName?: string;
        correlationId?: string;
        isCompleted?: boolean;
        state?: { path: string[] | string; equals: string };
      };
      orderBy: { createdAt: 'desc' };
      take?: number;
      skip?: number;
    }): Promise<PrismaRecord[]>;
    count(args: {
      where?: {
        sagaName?: string;
        correlationId?: string;
        isCompleted?: boolean;
        state?: { path: string[] | string; equals: string };
      };
    }): Promise<number>;
  };
  sagaExecutionHistory: {
    findMany(args: {
      where: { sagaName: string; correlationId: string };
      orderBy: { transitionAt: 'desc' };
      take?: number;
      skip?: number;
    }): Promise<SagaHistoryEntry[]>;
    count(args: {
      where: { sagaName: string; correlationId: string };
    }): Promise<number>;
  };
}

function hasPrismaSagaInstanceClient(
  db: SagaServiceDatabaseClient | unknown,
): db is SagaServiceDatabaseClient {
  return typeof db === 'object' && db !== null && 'sagaInstance' in db;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to ensure ISO 8601 format for datetime strings
 */
function toISOString(value: string | Date | undefined | null): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') {
    // If already ISO format, return as-is
    if (value.includes('T') && (value.includes('Z') || value.includes('+'))) return value;
    // Otherwise parse and convert
    return new Date(value).toISOString();
  }
  return value.toISOString();
}

/**
 * Maps a saga instance state to the API response format
 * Handles both flat state and nested metadata structures
 */
function mapStateToInstance(
  sagaName: string,
  correlationId: string,
  state: SagaInstanceState,
): {
  sagaName: string;
  correlationId: string;
  state: Record<string, unknown>;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'compensating';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  version: number;
  messageCount: number;
  lastMessageType?: string;
} {
  // The Prisma store returns the saga state with metadata nested inside
  const metadata = (state as { metadata?: SagaInstanceState['metadata'] }).metadata;
  const isCompleted = metadata?.isCompleted ?? state.isCompleted ?? false;
  const version = metadata?.version ?? state.version ?? 1;

  // Extract lastMessageType from state if available (set by SSE middleware)
  const stateRecord = state as Record<string, unknown>;
  const lastMessageType = (stateRecord.lastMessageType as string) ||
    (stateRecord.status as string) || // Use business status as fallback
    undefined;

  // Use version as message count (version increments on each message)
  // Version starts at 1 for new sagas, so messageCount = version
  const messageCount = version;

  return {
    sagaName,
    correlationId,
    state: state as Record<string, unknown>,
    status: isCompleted ? 'completed' as const : 'active' as const,
    createdAt: toISOString(metadata?.createdAt ?? state.createdAt),
    updatedAt: toISOString(metadata?.updatedAt ?? state.updatedAt),
    completedAt: isCompleted ? toISOString(metadata?.updatedAt ?? state.updatedAt) : undefined,
    version,
    messageCount,
    lastMessageType,
  };
}

/**
 * Maps a saga registration to the API response format
 */
function mapSagaToResponse(
  saga: SagaMetadata,
) {
  return {
    id: saga.id,
    name: saga.name,
    description: saga.name,
    topic: saga.topic || 'default',
    enabled: saga.enabled ?? true,
    entrypoint: '',
    tags: [] as string[],
    timeout: undefined as { completionTimeout?: number } | undefined,
    retry: undefined as {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
    } | undefined,
  };
}

// ============================================================================
// SAGA DEFINITIONS HANDLERS
// ============================================================================

export const sagasV1 = {
  /**
   * List all registered saga definitions with optional filtering
   */
  listSagas: router.listSagas.handler(async ({ input }) => {
    const { limit, offset, topic, enabled } = input;
    const allSagas = await listSagaMetadata({ topic });

    // Apply enabled filter using the metadata persisted in KV
    const filtered = enabled !== undefined
      ? allSagas.filter((s) => (s.enabled ?? true) === enabled)
      : allSagas;

    const paginated = filtered.slice(offset, offset + limit);

    return {
      sagas: paginated.map((saga) => mapSagaToResponse(saga)),
      total: filtered.length,
      limit,
      offset,
    };
  }),

  /**
   * Get a specific saga definition by ID
   */
  getSaga: router.getSaga.handler(async ({ input, errors, path }) => {
    const saga = await getSagaMetadata(input.id);

    if (!saga) {
      notFound({ errors, path, resourceId: input.id });
      // TypeScript needs this unreachable return for type narrowing
      throw new Error('Not found');
    }

    return mapSagaToResponse(saga);
  }),

  /**
   * List saga instances with optional filtering
   *
   * Uses direct Prisma queries to get correlationId which is not returned
   * by PrismaSagaStore's findByName() method.
   */
  listInstances: router.listInstances.handler(async ({ input, context }) => {
    const { db } = context;
    const { limit, offset, sagaName, status } = input;

    if (hasPrismaSagaInstanceClient(db)) {
      // Build Prisma where clause for status filtering (JSON state.status for non-completed)
      // JSON path syntax differs by engine: PostgreSQL uses array ["status"], MySQL/MSSQL use "$.status"
      const dbProvider = Deno.env.get('DB_PROVIDER') || 'mysql';
      const jsonPath = dbProvider === 'postgres' ? ['status'] : '$.status';

      const buildWhereClause = (name?: string) => {
        const whereClause: {
          sagaName?: string;
          isCompleted?: boolean;
          state?: { path: string[] | string; equals: string };
        } = {};

        if (name) whereClause.sagaName = name;

        if (status === 'completed') {
          whereClause.isCompleted = true;
        } else if (status) {
          whereClause.state = { path: jsonPath, equals: status };
        }

        return whereClause;
      };

      if (sagaName) {
        // Query single saga type using direct Prisma to get correlationId
        const whereClause = buildWhereClause(sagaName);

        const [records, total] = await Promise.all([
          db.sagaInstance.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          db.sagaInstance.count({ where: whereClause }),
        ]);

        const instances = records.map((record) => {
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
        });

        return { instances, total, limit, offset };
      }

      const whereClause = buildWhereClause();

      const [records, total] = await Promise.all([
        db.sagaInstance.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.sagaInstance.count({ where: whereClause }),
      ]);

      const instances = records.map((record) => {
        const state = (record.state ?? {}) as SagaInstanceState;
        return mapStateToInstance(record.sagaName, record.correlationId, {
          ...state,
          id: record.id,
          correlationId: record.correlationId,
          version: record.version,
          isCompleted: record.isCompleted,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        });
      });

      return {
        instances,
        total,
        limit,
        offset,
      };
    }

    // Fallback to kvdex-based listing for non-Prisma stores
    const kvDb = await getSagaDb();
    const sagaColl = kvDb.sagaInstances;

    let instances: SagaInstanceKv[];

    if (sagaName && status) {
      // Use sagaName index + filter by status
      const { result } = await sagaColl.findBySecondaryIndex('sagaName', sagaName, {
        filter: (doc) => (doc.value as unknown as SagaInstanceKv).status === status,
      });
      instances = result.map((doc) => doc.value as unknown as SagaInstanceKv);
    } else if (sagaName) {
      const { result } = await sagaColl.findBySecondaryIndex('sagaName', sagaName);
      instances = result.map((doc) => doc.value as unknown as SagaInstanceKv);
    } else if (status) {
      const { result } = await sagaColl.findBySecondaryIndex('status', status);
      instances = result.map((doc) => doc.value as unknown as SagaInstanceKv);
    } else {
      const { result } = await sagaColl.getMany();
      instances = result.map((doc) => doc.value as unknown as SagaInstanceKv);
    }

    const total = instances.length;
    const paginatedInstances = instances.slice(offset, offset + limit);

    return {
      instances: paginatedInstances,
      total,
      limit,
      offset,
    };
  }),

  /**
   * Get a specific saga instance by name and correlation ID
   *
   * Uses PrismaSagaStore's getByCorrelationId() for full instance metadata,
   * or falls back to saga-bus getSagaState() for other stores.
   */
  getInstance: router.getInstance.handler(async ({ input, errors, path, context }) => {
    const { sagaName, correlationId } = input;
    const records = await context.db.sagaInstance.findMany({
      where: { sagaName, correlationId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    const record = records[0];

    if (!record) {
      notFound({ errors, path, resourceId: `${sagaName}/${correlationId}` });
      throw new Error('Not found');
    }

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
  }),

  /**
   * Publish a message to trigger saga state transitions
   *
   * Uses saga-bus native publish() method which routes messages via the configured
   * transport (Redis, RabbitMQ, or InMemory) to all registered saga handlers.
   *
   * Message format follows saga-bus convention:
   * - `type` field is used for handler routing (maps to handler name)
   * - `correlationId` field is used for saga instance correlation
   * - Additional payload fields are passed to the handler context
   */
  publish: router.publish.handler(async ({ input, context }) => {
    // Extract trace context from the current active span (set by HTTP request)
    // This allows saga processing to be linked to the original request trace
    const traceContext = getTraceContext();
    return await publishSagaMessage(input, {
      runtime: contextSagaRuntime(context),
      traceHeaders: traceContextToHeaders(traceContext),
    });
  }),

  /**
   * SSE subscription for real-time saga state updates
   *
   * Streams saga events (started, state_changed, completed, failed) to connected clients.
   * Uses KV watchPrefix for real-time event delivery instead of polling.
   */
  subscribe: router.subscribe.handler(async function* ({ input, lastEventId, signal }) {
    const sagaNameFilter = input?.sagaName;
    const kv = await getKv();
    let lastHeartbeat = Date.now();
    let eventId = 0;

    // Initial connection heartbeat
    yield withEventMeta(
      {
        type: 'heartbeat' as const,
        timestamp: new Date().toISOString(),
        data: { connected: true },
      } as SagaSSEEvent,
      { id: String(++eventId), retry: 5000 },
    );

    // Watch for saga events in real-time using KV watchPrefix
    // This uses Redis pub/sub under the hood for instant delivery
    const eventStream = kv.watchPrefix<SagaSSEEvent>(['saga', 'events'], {
      signal,
      pollInterval: 100, // Fast polling fallback if pub/sub unavailable
    });

    for await (const watchEvent of eventStream) {
      // Check if aborted
      if (signal?.aborted) break;

      // Skip delete events
      if (watchEvent.type === 'delete' || !watchEvent.value) continue;

      const event = watchEvent.value;

      // Apply saga name filter
      if (sagaNameFilter && event.sagaName !== sagaNameFilter) continue;

      yield withEventMeta(event, { id: String(++eventId), retry: 5000 });

      // Remove processed event to avoid re-delivery
      await kv.delete(watchEvent.key);

      // Heartbeat every 30 seconds
      const now = Date.now();
      if (now - lastHeartbeat > 30000) {
        yield withEventMeta(
          {
            type: 'heartbeat' as const,
            timestamp: new Date().toISOString(),
            data: { connected: true },
          } as SagaSSEEvent,
          { id: String(++eventId), retry: 5000 },
        );
        lastHeartbeat = now;
      }
    }
  }),

  /**
   * Get execution history for a saga instance
   *
   * Returns timeline events from the SagaExecutionHistory table,
   * ordered by transition time (newest first).
   */
  getInstanceHistory: router.getInstanceHistory.handler(async ({ input, context }) => {
    const { db } = context;
    const { sagaName, correlationId, limit = 50, offset = 0 } = input;

    try {
      // Query history from Prisma
      const [history, total] = await Promise.all([
        db.sagaExecutionHistory.findMany({
          where: {
            sagaName,
            correlationId,
          },
          orderBy: {
            transitionAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        db.sagaExecutionHistory.count({
          where: {
            sagaName,
            correlationId,
          },
        }),
      ]);

      // Valid outcome values
      const validOutcomes = ['success', 'error', 'compensated'] as const;

      return {
        history: history.map((entry) => {
          // Ensure newState is always a valid object
          let newState: Record<string, unknown> = {};
          if (
            entry.newState && typeof entry.newState === 'object' && !Array.isArray(entry.newState)
          ) {
            newState = entry.newState as Record<string, unknown>;
          } else if (entry.newState !== null && entry.newState !== undefined) {
            newState = { value: entry.newState };
          }

          // Ensure previousState is valid object or undefined
          let previousState: Record<string, unknown> | undefined;
          if (
            entry.previousState && typeof entry.previousState === 'object' &&
            !Array.isArray(entry.previousState)
          ) {
            previousState = entry.previousState as Record<string, unknown>;
          } else if (entry.previousState !== null && entry.previousState !== undefined) {
            previousState = { value: entry.previousState };
          }

          // Validate and normalize outcome
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
        }),
        total,
      };
    } catch (error) {
      console.error('[Sagas API] Error fetching instance history:', error);
      return {
        history: [],
        total: 0,
      };
    }
  }),
};

/** Publish a contract message through the real saga runtime before acknowledging it. */
export async function publishSagaMessage(
  input: PublishMessageInput,
  options: PublishSagaMessageOptions,
): Promise<PublishMessageOutput> {
  const { type, payload, correlationId } = input;
  const message: SagaMessage = Object.freeze({
    type,
    payload: payload ?? {},
    correlationKey: correlationId as SagaCorrelationKey | undefined,
    occurredAt: new Date(),
    traceparent: options.traceHeaders?.traceparent,
    tracestate: options.traceHeaders?.tracestate,
  });

  await options.runtime.publish(message, {
    traceparent: message.traceparent,
    tracestate: message.tracestate,
  });

  const event: SagaSSEEvent = {
    type: 'saga:message_received',
    timestamp: new Date().toISOString(),
    correlationId,
    data: { messageType: type, correlationId, payload, headers: options.traceHeaders ?? {} },
  };
  await (options.writeEvent ?? writeSagaPublishEvent)(event);

  return {
    published: true,
    messageType: type,
    correlationId,
  };
}

function contextSagaRuntime(context: SagaServiceContext): SagaRuntime {
  if (context.sagaRuntime) {
    return context.sagaRuntime;
  }
  throw SagasError.validationFailed('Sagas API publish requires a started saga runtime.');
}

async function writeSagaPublishEvent(event: SagaSSEEvent): Promise<void> {
  const kv = await getKv();
  await kv.set(['saga', 'events', crypto.randomUUID()], event);
}

function traceContextToHeaders(
  traceContext: ReturnType<typeof getTraceContext>,
): Readonly<Record<string, string>> {
  if (!traceContext) {
    return Object.freeze({});
  }
  return Object.freeze({
    traceparent: traceContext.traceparent,
    ...(traceContext.tracestate ? { tracestate: traceContext.tracestate } : {}),
  });
}
