import { ORPCError, withEventMeta } from '@orpc/server';
import { abortable } from '@std/async';
import { KvSagaEventFeed } from '@netscript/plugin-sagas-core/adapters';
import type { PluginCapabilities } from '@netscript/plugin/contract-base';
import { getKv } from '@netscript/kv';
import { notFound } from '@netscript/contracts';
import { getTraceContext } from '@netscript/telemetry/context';
import { getSagaMetadata, listSagaMetadata } from '../saga-registry.ts';
import { SagaEventFeedError, SagasError } from '@netscript/plugin-sagas-core/domain';
import { router, type SagasHandlers } from './router-context.ts';
import {
  buildSagaInstanceWhere,
  findSagaInstanceKv,
  hasPrismaSagaInstanceClient,
  listSagaInstanceKv,
  mapHistoryEntry,
  mapPrismaRecordToInstance,
  mapSagaToResponse,
} from './v1-helpers.ts';
import type { SagaInstanceKv } from './v1-helpers.ts';
import type {
  PublishSagaMessageOptions,
  SagaPublishEvent,
  SagaPublishMessageInput,
  SagaPublishMessageOutput,
  SagaRuntimeMessage,
  SagaServiceContext,
} from './v1-types.ts';

const DEFAULT_SAGA_PUBLISH_TIMEOUT_MS = 5_000;

/**
 * Capabilities document advertised by the running sagas service.
 *
 * Grounded in sagas ground truth: the published plugin package name, the served
 * contract versions, the v1 contract route groups, and the plugin's advertised
 * capability tags.
 */
const sagasCapabilities: PluginCapabilities = {
  pluginName: '@netscript/plugin-sagas',
  contractVersions: ['v1'],
  routeGroups: ['sagas', 'instances', 'history', 'publish', 'subscribe'],
  capabilities: [
    'saga-orchestration',
    'message-publishing',
    'instance-tracking',
    'sse-streaming',
  ],
};

/** Every v1 route key the sagas contract exposes (incl. the base `describe`). */
type SagasV1RouteKey =
  | 'describe'
  | 'listSagas'
  | 'getSaga'
  | 'listInstances'
  | 'getInstance'
  | 'getInstanceHistory'
  | 'publish'
  | 'subscribe';

/** V1 saga contract handlers, contract-bound and precisely typed per route. */
export const sagasV1: SagasHandlers<SagasV1RouteKey> = {
  /** Mandatory base seam `describe` route. */
  describe: router.describe.handler(() => sagasCapabilities),

  /** List all registered saga definitions with optional filtering. */
  listSagas: router.listSagas.handler(async ({ input }) => {
    const { limit, offset, topic, enabled } = input;
    const allSagas = await listSagaMetadata({ topic });
    const filtered = enabled !== undefined
      ? allSagas.filter((saga) => (saga.enabled ?? true) === enabled)
      : allSagas;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      sagas: paginated.map((saga) => mapSagaToResponse(saga)),
      total: filtered.length,
      limit,
      offset,
    };
  }),

  /** Get a specific saga definition by ID. */
  getSaga: router.getSaga.handler(async ({ input, errors, path }) => {
    const saga = await getSagaMetadata(input.id);
    if (!saga) {
      notFound({ errors, path, resourceId: input.id });
      throw new Error('Not found');
    }
    return mapSagaToResponse(saga);
  }),

  /** List saga instances with optional filtering. */
  listInstances: router.listInstances.handler(async ({ input, context }) => {
    const { db } = context;
    const { limit, offset, sagaName, status } = input;

    if (context.useKvProjection !== true && hasPrismaSagaInstanceClient(db)) {
      const whereClause = buildSagaInstanceWhere(sagaName, status);
      const [records, total] = await Promise.all([
        db.sagaInstance.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.sagaInstance.count({ where: whereClause }),
      ]);

      return {
        instances: records.map((record) => mapPrismaRecordToInstance(record, sagaName)),
        total,
        limit,
        offset,
      };
    }

    const instances: SagaInstanceKv[] = (await listSagaInstanceKv()).filter((instance) =>
      (sagaName === undefined || instance.sagaName === sagaName) &&
      (status === undefined || status === null || instance.status === status)
    );

    const total = instances.length;
    return {
      instances: instances.slice(offset, offset + limit),
      total,
      limit,
      offset,
    };
  }),

  /** Get a specific saga instance by name and correlation ID. */
  getInstance: router.getInstance.handler(async ({ input, errors, path, context }) => {
    const { sagaName, correlationId } = input;
    if (
      context.sagaStore || context.useKvProjection === true ||
      !hasPrismaSagaInstanceClient(context.db)
    ) {
      const instance = await findSagaInstanceKv(sagaName, correlationId, context.sagaStore);
      if (!instance) {
        notFound({ errors, path, resourceId: `${sagaName}/${correlationId}` });
        throw new Error('Not found');
      }
      return instance;
    }
    const record = await context.db.sagaInstance.findFirst({
      where: { sagaName, correlationId },
    });

    if (!record) {
      notFound({ errors, path, resourceId: `${sagaName}/${correlationId}` });
      throw new Error('Not found');
    }

    return mapPrismaRecordToInstance(record, sagaName);
  }),

  /** Publish a message to trigger saga state transitions. */
  publish: router.publish.handler(async ({ input, context, signal }) => {
    const traceContext = getTraceContext();
    return await publishSagaMessage(input, {
      runtime: contextSagaRuntime(context),
      traceHeaders: traceContextToHeaders(traceContext),
      timeoutMs: context.publishTimeoutMs,
      signal,
    });
  }),

  /** Subscribe to real-time saga state updates over SSE. */
  subscribe: router.subscribe.handler(async function* ({ input, signal, lastEventId }) {
    try {
      const kv = await getKv();
      const feed = new KvSagaEventFeed(kv);
      for await (const item of feed.subscribe({ afterId: lastEventId, signal })) {
        if (item.type === 'ready') {
          yield withEventMeta({
            type: 'heartbeat' as const,
            timestamp: new Date().toISOString(),
            data: { connected: true },
          }, { retry: 5000 });
        } else if (!input?.sagaName || item.event.sagaName === input.sagaName) {
          yield withEventMeta(item.event, { id: item.id, retry: 5000 });
        }
      }
    } catch (error) {
      if (!(error instanceof SagaEventFeedError)) throw error;
      const code = error.reason === 'invalid-cursor'
        ? 'BAD_REQUEST'
        : error.reason === 'history-lost'
        ? 'CONFLICT'
        : 'SERVICE_UNAVAILABLE';
      throw new ORPCError(code, {
        message: error.message,
        cause: error,
        data: { reason: error.reason, oldestId: error.oldestId, latestId: error.latestId },
      });
    }
  }),

  /** Get execution history for a saga instance. */
  getInstanceHistory: router.getInstanceHistory.handler(async ({ input, context }) => {
    const { db } = context;
    const { sagaName, correlationId, limit = 50, offset = 0 } = input;

    try {
      const [history, total] = await Promise.all([
        db.sagaExecutionHistory.findMany({
          where: { sagaName, correlationId },
          orderBy: { transitionAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.sagaExecutionHistory.count({ where: { sagaName, correlationId } }),
      ]);

      return { history: history.map((entry) => mapHistoryEntry(entry)), total };
    } catch (error) {
      console.error('[Sagas API] Error fetching instance history:', error);
      return { history: [], total: 0 };
    }
  }),
};

/** Publish a contract message through the real saga runtime before acknowledging it. */
export async function publishSagaMessage(
  input: SagaPublishMessageInput,
  options: PublishSagaMessageOptions,
): Promise<SagaPublishMessageOutput> {
  const { type, payload, correlationId, idempotencyKey } = input;
  const message: SagaRuntimeMessage = Object.freeze({
    type,
    payload: payload ?? {},
    correlationKey: correlationId,
    idempotencyKey,
    occurredAt: new Date(),
    traceparent: options.traceHeaders?.traceparent,
    tracestate: options.traceHeaders?.tracestate,
  });

  options.signal?.throwIfAborted();
  await publishWithinDeadline(
    options.runtime.publish(message, {
      idempotencyKey,
      traceparent: message.traceparent,
      tracestate: message.tracestate,
    }),
    options.timeoutMs ?? DEFAULT_SAGA_PUBLISH_TIMEOUT_MS,
    options.signal,
  );

  const event: SagaPublishEvent = {
    type: 'saga:message_received',
    timestamp: new Date().toISOString(),
    correlationId,
    data: { messageType: type, correlationId, payload, headers: options.traceHeaders ?? {} },
  };
  options.signal?.throwIfAborted();
  const write = options.writeEvent
    ? options.writeEvent(event)
    : writeSagaPublishEvent(event, options.signal);
  await (options.signal ? abortable(write, options.signal) : write);

  return {
    published: true,
    messageType: type,
    correlationId,
  };
}

async function publishWithinDeadline(
  publish: Promise<unknown>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<void> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw SagasError.validationFailed('Saga publish timeout must be a positive number.');
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(SagasError.retryable(`Saga publish did not settle within ${timeoutMs}ms.`)),
      timeoutMs,
    );
  });
  try {
    const pending = Promise.race([publish, timeout]);
    await (signal ? abortable(pending, signal) : pending);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

function contextSagaRuntime(context: SagaServiceContext) {
  if (context.sagaRuntime) {
    return context.sagaRuntime;
  }
  throw SagasError.validationFailed('Sagas API publish requires a started saga runtime.');
}

async function writeSagaPublishEvent(event: SagaPublishEvent, signal?: AbortSignal): Promise<void> {
  const kv = await getKv();
  await new KvSagaEventFeed(kv).append(event, { signal });
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
