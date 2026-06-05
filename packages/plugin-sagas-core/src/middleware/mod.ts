/**
 * @module @netscript/plugin-sagas-core/middleware
 *
 * Hono and saga pipeline middleware.
 */

export { createSagaMiddleware } from './saga-middleware.ts';
export { createSSEEventsMiddleware, emitSagaEvent } from './sse-events-middleware.ts';
export type {
  CreateSagaMiddlewareOptions,
  HonoSagaContext,
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
