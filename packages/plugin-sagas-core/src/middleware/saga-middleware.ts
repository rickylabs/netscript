import type { SagaInstanceId, SagaMessage, SagaState, SagaStateEnvelope } from '../domain/mod.ts';
import type { SagaBusPort, SagaPublishOptions, SagaStorePort } from '../ports/mod.ts';

/** Saga helpers injected into Hono request context. */
export interface HonoSagaContext {
  readonly bus: SagaBusPort;
  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void>;
  getSagaState<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined>;
}

/** Hono variables added by `createSagaMiddleware()`. */
export type SagaMiddlewareVariables = Readonly<{
  sagas: HonoSagaContext;
}>;

/** Request surface required by saga middleware. */
export type SagaMiddlewareRequest = Readonly<{
  header(name: string): string | undefined;
}>;

/** Context surface required by saga middleware. */
export type SagaMiddlewareContext = {
  readonly req: SagaMiddlewareRequest;
  set(key: 'sagas', value: HonoSagaContext): void;
};

/** Continuation invoked by saga middleware. */
export type SagaMiddlewareNext = () => Promise<void> | void;

/** Package-owned structural middleware handler compatible with Hono middleware. */
export type SagaMiddlewareHandler = (
  context: SagaMiddlewareContext,
  next: SagaMiddlewareNext,
) => Promise<void>;

/** Options for Hono saga middleware. */
export type CreateSagaMiddlewareOptions = Readonly<{
  bus: SagaBusPort;
  store?: SagaStorePort;
  traceparentHeader?: string;
  tracestateHeader?: string;
}>;

/** Create Hono middleware that injects saga runtime helpers into request context. */
export function createSagaMiddleware(
  options: CreateSagaMiddlewareOptions,
): SagaMiddlewareHandler {
  const traceparentHeader = options.traceparentHeader ?? 'traceparent';
  const tracestateHeader = options.tracestateHeader ?? 'tracestate';

  return async (
    context: SagaMiddlewareContext,
    next: SagaMiddlewareNext,
  ): Promise<void> => {
    const traceparent = context.req.header(traceparentHeader);
    const tracestate = context.req.header(tracestateHeader);
    context.set('sagas', createHonoSagaContext(options, traceparent, tracestate));
    await next();
  };
}

function createHonoSagaContext(
  options: CreateSagaMiddlewareOptions,
  traceparent?: string,
  tracestate?: string,
): HonoSagaContext {
  return Object.freeze({
    bus: options.bus,
    publish: (message: SagaMessage, publishOptions?: SagaPublishOptions) =>
      options.bus.publish(withTraceContext(message, traceparent, tracestate), {
        ...publishOptions,
        traceparent: publishOptions?.traceparent ?? traceparent,
        tracestate: publishOptions?.tracestate ?? tracestate,
      }),
    getSagaState: <TState extends SagaState>(
      instanceId: SagaInstanceId,
    ) => options.store?.load<TState>(instanceId) ?? Promise.resolve(undefined),
  });
}

function withTraceContext(
  message: SagaMessage,
  traceparent?: string,
  tracestate?: string,
): SagaMessage {
  return Object.freeze({
    ...message,
    traceparent: message.traceparent ?? traceparent,
    tracestate: message.tracestate ?? tracestate,
  });
}
