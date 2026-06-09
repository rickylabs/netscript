import { withEventMeta } from '@orpc/server';
import { sagasContractV1, type SagaSSEEvent } from '../../../contracts/v1/mod.ts';
import { getKv } from '@netscript/kv';
import { notFound } from '@netscript/contracts';
import { getTraceContext } from '@netscript/telemetry/context';
import { getSagaMetadata, listSagaMetadata } from '../saga-registry.ts';
import { SagasError } from '@netscript/plugin-sagas-core/domain';
import {
  buildSagaInstanceWhere,
  getSagaDb,
  hasPrismaSagaInstanceClient,
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

const router = sagasContractV1.$context<SagaServiceContext>();

/** V1 saga contract handlers. */
export const sagasV1: Record<string, unknown> = {
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

    if (hasPrismaSagaInstanceClient(db)) {
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

    const kvDb = await getSagaDb();
    const sagaColl = kvDb.sagaInstances;
    let instances: SagaInstanceKv[];

    if (sagaName && status) {
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

    return mapPrismaRecordToInstance(record, sagaName);
  }),

  /** Publish a message to trigger saga state transitions. */
  publish: router.publish.handler(async ({ input, context }) => {
    const traceContext = getTraceContext();
    return await publishSagaMessage(input, {
      runtime: contextSagaRuntime(context),
      traceHeaders: traceContextToHeaders(traceContext),
    });
  }),

  /** Subscribe to real-time saga state updates over SSE. */
  subscribe: router.subscribe.handler(async function* ({ input, signal }) {
    const sagaNameFilter = input?.sagaName;
    const kv = await getKv();
    let lastHeartbeat = Date.now();
    let eventId = 0;

    yield withEventMeta(
      {
        type: 'heartbeat' as const,
        timestamp: new Date().toISOString(),
        data: { connected: true },
      } as SagaSSEEvent,
      { id: String(++eventId), retry: 5000 },
    );

    const eventStream = kv.watchPrefix<SagaSSEEvent>(['saga', 'events'], {
      signal,
      pollInterval: 100,
    });

    for await (const watchEvent of eventStream) {
      if (signal?.aborted) break;
      if (watchEvent.type === 'delete' || !watchEvent.value) continue;

      const event = watchEvent.value;
      if (sagaNameFilter && event.sagaName !== sagaNameFilter) continue;

      yield withEventMeta(event, { id: String(++eventId), retry: 5000 });
      await kv.delete(watchEvent.key);

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
  const { type, payload, correlationId } = input;
  const message: SagaRuntimeMessage = Object.freeze({
    type,
    payload: payload ?? {},
    correlationKey: correlationId,
    occurredAt: new Date(),
    traceparent: options.traceHeaders?.traceparent,
    tracestate: options.traceHeaders?.tracestate,
  });

  await options.runtime.publish(message, {
    traceparent: message.traceparent,
    tracestate: message.tracestate,
  });

  const event: SagaPublishEvent = {
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

function contextSagaRuntime(context: SagaServiceContext) {
  if (context.sagaRuntime) {
    return context.sagaRuntime;
  }
  throw SagasError.validationFailed('Sagas API publish requires a started saga runtime.');
}

async function writeSagaPublishEvent(event: SagaPublishEvent): Promise<void> {
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
