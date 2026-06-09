/**
 * @module @netscript/plugin-sagas-core/middleware
 *
 * Hono and saga pipeline middleware.
 */

export type {
  SagaCorrelationKey,
  SagaInstanceId,
  SagaMessage,
  SagaState,
  SagaStateEnvelope,
} from '../domain/mod.ts';
export type {
  SagaBusPort,
  SagaCorrelationIndexEntry,
  SagaPublishOptions,
  SagaStorePort,
  SagaStoreWriteOptions,
} from '../ports/mod.ts';
export { createSagaMiddleware } from './saga-middleware.ts';
export { createSSEEventsMiddleware, emitSagaEvent } from './sse-events-middleware.ts';
export type {
  CreateSagaMiddlewareOptions,
  HonoSagaContext,
  SagaMiddlewareContext,
  SagaMiddlewareHandler,
  SagaMiddlewareNext,
  SagaMiddlewareRequest,
  SagaMiddlewareVariables,
} from './saga-middleware.ts';
export type {
  SagaEventSink,
  SagaEventType,
  SagaHistoryEntry,
  SagaHistoryOutcome,
  SagaHistoryWriter,
  SagaMiddleware,
  SagaPipelineContext,
  SagaSSEEvent,
  SagaStreamHook,
  SSEEventsMiddlewareOptions,
} from './sse-events-middleware.ts';
