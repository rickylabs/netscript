import type { SagaCorrelationKey, SagaMessage, SagaState } from '../domain/mod.ts';

/** Saga event kinds emitted for live dashboards and history sinks. */
export type SagaEventType =
  | 'saga:started'
  | 'saga:state_changed'
  | 'saga:completed'
  | 'saga:failed'
  | 'saga:compensating'
  | 'heartbeat';

/** SSE-compatible saga event. */
export type SagaSSEEvent = Readonly<{
  type: SagaEventType;
  sagaName: string;
  correlationId: SagaCorrelationKey | string;
  timestamp: string;
  data?: Readonly<Record<string, unknown>>;
}>;

/** Event sink used by SSE delivery implementations. */
export interface SagaEventSink {
  emit(event: SagaSSEEvent): Promise<void>;
}

/** Durable history writer for saga timeline persistence. */
export interface SagaHistoryWriter {
  write(entry: SagaHistoryEntry): Promise<void>;
}

/** Saga history entry derived from a pipeline transition. */
export type SagaHistoryEntry = Readonly<{
  sagaName: string;
  sagaId: string;
  correlationId: SagaCorrelationKey | string;
  messageType: string;
  messageId?: string;
  previousState?: Readonly<Record<string, unknown>>;
  newState: Readonly<Record<string, unknown>>;
  outcome: SagaHistoryOutcome;
  error?: string;
  durationMs: number;
}>;

/** Durable history outcome. */
export type SagaHistoryOutcome = 'success' | 'error' | 'compensated';

/** Callback invoked after an SSE event is emitted. */
export type SagaStreamHook = (event: SagaSSEEvent) => Promise<void> | void;

/** Pipeline context consumed by saga event middleware. */
export type SagaPipelineContext<TState extends SagaState = SagaState> = Readonly<{
  sagaName: string;
  correlationId: SagaCorrelationKey | string;
  message: SagaMessage;
  sagaId?: string;
  existingState?: TState;
  preState?: TState;
  postState?: TState;
  completed?: boolean;
  compensating?: boolean;
  metadata?: Readonly<Record<string, unknown>>;
  error?: unknown;
}>;

/** Saga pipeline middleware function. */
export type SagaMiddleware = (
  context: SagaPipelineContext,
  next: () => Promise<void>,
) => Promise<void>;

/** Options for saga SSE event middleware. */
export type SSEEventsMiddlewareOptions = Readonly<{
  sink: SagaEventSink;
  history?: SagaHistoryWriter;
  streamHook?: SagaStreamHook;
  persistHistory?: boolean;
  now?: () => Date;
  onError?: (error: unknown) => void;
}>;

/** Create middleware that emits SSE and optional durable history after saga handling. */
export function createSSEEventsMiddleware(
  options: SSEEventsMiddlewareOptions,
): SagaMiddleware {
  const now = options.now ?? (() => new Date());

  return async (context: SagaPipelineContext, next: () => Promise<void>): Promise<void> => {
    const startedAt = now().getTime();
    await next();
    const durationMs = now().getTime() - startedAt;

    try {
      await emitStateChangeEvent(context, durationMs, options, now);
    } catch (error) {
      options.onError?.(error);
    }
  };
}

/** Emit a saga event through the provided sink and optional stream hook. */
export async function emitSagaEvent(
  event: SagaSSEEvent,
  options: Readonly<{
    sink: SagaEventSink;
    streamHook?: SagaStreamHook;
  }>,
): Promise<void> {
  await options.sink.emit(event);
  await options.streamHook?.(event);
}

async function emitStateChangeEvent(
  context: SagaPipelineContext,
  durationMs: number,
  options: SSEEventsMiddlewareOptions,
  now: () => Date,
): Promise<void> {
  const event = toSagaSSEEvent(context, now);
  if (!event) return;

  await emitSagaEvent(event, {
    sink: options.sink,
    streamHook: options.streamHook,
  });

  if ((options.persistHistory ?? true) && options.history) {
    await options.history.write(toHistoryEntry(context, durationMs));
  }
}

function toSagaSSEEvent(
  context: SagaPipelineContext,
  now: () => Date,
): SagaSSEEvent | undefined {
  const eventType = resolveEventType(context);
  if (!eventType) return undefined;

  return Object.freeze({
    type: eventType,
    sagaName: context.sagaName,
    correlationId: context.correlationId,
    timestamp: now().toISOString(),
    data: Object.freeze({
      sagaId: context.sagaId ?? stringFromUnknown(context.postState?.id),
      messageType: context.message.type,
      version: context.postState?.version,
      compensating: context.compensating ?? false,
    }),
  });
}

function resolveEventType(context: SagaPipelineContext): SagaEventType | undefined {
  if (context.error) return 'saga:failed';
  if (context.compensating) return 'saga:compensating';
  if (!context.existingState && context.postState) return 'saga:started';
  if (context.completed || context.postState?.isCompleted) return 'saga:completed';
  if (context.postState) return 'saga:state_changed';
  return undefined;
}

function toHistoryEntry(
  context: SagaPipelineContext,
  durationMs: number,
): SagaHistoryEntry {
  return Object.freeze({
    sagaName: context.sagaName,
    sagaId: context.sagaId ?? stringFromUnknown(context.postState?.id) ?? 'unknown',
    correlationId: context.correlationId,
    messageType: context.message.type,
    messageId: context.message.id,
    previousState: context.existingState ? sanitizeState(context.existingState) : undefined,
    newState: context.postState ? sanitizeState(context.postState) : Object.freeze({ empty: true }),
    outcome: context.error ? 'error' : context.compensating ? 'compensated' : 'success',
    error: stringifyError(context.error),
    durationMs,
  });
}

function sanitizeState(state: SagaState): Readonly<Record<string, unknown>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(state)
        .filter(([key]) => !INTERNAL_STATE_KEYS.has(key))
        .map(([key, value]) => [key, sanitizeValue(value)]),
    ),
  );
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length > 1000 ? `${value.slice(0, 1000)}...[truncated]` : value;
  }
  if (typeof value === 'object' && value !== null) {
    return isLargeJson(value) ? '[object too large]' : value;
  }
  return value;
}

function isLargeJson(value: object): boolean {
  try {
    return JSON.stringify(value).length > 5000;
  } catch {
    return true;
  }
}

function stringifyError(error: unknown): string | undefined {
  if (!error) return undefined;
  return error instanceof Error ? error.message : String(error);
}

function stringFromUnknown(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

const INTERNAL_STATE_KEYS = new Set(['id', 'correlationId', 'version', 'createdAt', 'updatedAt']);
