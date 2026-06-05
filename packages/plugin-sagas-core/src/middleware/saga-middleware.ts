import type { Context, MiddlewareHandler, Next } from 'hono';
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
): MiddlewareHandler<{ Variables: SagaMiddlewareVariables }> {
  const traceparentHeader = options.traceparentHeader ?? 'traceparent';
  const tracestateHeader = options.tracestateHeader ?? 'tracestate';

  return async (
    context: Context<{ Variables: SagaMiddlewareVariables }>,
    next: Next,
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
