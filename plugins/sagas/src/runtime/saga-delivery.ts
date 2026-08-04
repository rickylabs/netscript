import { createQueue, type MessageContext, type MessageQueue } from '@netscript/queue';
import type { CascadedMessage, SagaMessage } from '@netscript/plugin-sagas-core/domain';
import { SagasError } from '@netscript/plugin-sagas-core/domain';
import type {
  SagaPublishOptions,
  SagaRuntime,
  SagaSchedulerPort,
} from '@netscript/plugin-sagas-core/runtime';
import { getTraceContext } from '@netscript/telemetry/context';

/** Shared queue name used by saga API publishers and background runners. */
export const SAGA_DELIVERY_QUEUE = 'sagas' as const;

/** JSON-safe saga message carried between the API and runner processes. */
export type SagaDeliveryMessage = Readonly<{
  id?: string;
  type: string;
  payload: unknown;
  correlationKey?: string;
  idempotencyKey?: string;
  concurrencyKey?: string;
  occurredAt?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Runtime publisher plus owned delivery-resource shutdown. */
export interface SagaDeliveryPublisher {
  /** Durably enqueue one saga message. */
  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void>;
  /** Close the publisher's queue resources. */
  stop(): Promise<void>;
}

/** Long-running delivery component owned by the runtime supervisor. */
export interface SagaRuntimeDeliveryPort {
  /** Begin consuming messages into a started runtime. */
  start(runtime: SagaRuntime): Promise<void>;
  /** Wait until the listener stops or fails. */
  wait(): Promise<void>;
  /** Stop consumption and release queue resources. */
  stop(): Promise<void>;
}

/** Options for queue-backed saga publishing. */
export type SagaDeliveryPublisherOptions = Readonly<{
  queue?: MessageQueue<SagaDeliveryMessage>;
}>;

/** Create the default provider-neutral queue used for saga delivery. */
export function createSagaDeliveryQueue(): MessageQueue<SagaDeliveryMessage> {
  return createQueue<SagaDeliveryMessage>(SAGA_DELIVERY_QUEUE);
}

/** Create an API-facing publisher that acknowledges durable queue acceptance. */
export function createSagaDeliveryPublisher(
  options: SagaDeliveryPublisherOptions = {},
): SagaDeliveryPublisher {
  const queue = options.queue ?? createSagaDeliveryQueue();
  return Object.freeze({
    publish: async (message: SagaMessage, publishOptions: SagaPublishOptions = {}) => {
      const deliveryMessage = toDeliveryMessage(message, publishOptions);
      await queue.enqueue(deliveryMessage, {
        deduplicationId: deliveryMessage.idempotencyKey,
        headers: traceHeaders(deliveryMessage),
      });
    },
    stop: () => queue.stop(),
  });
}

/** Queue listener that delivers accepted API messages to the saga engine. */
export class SagaQueueDelivery implements SagaRuntimeDeliveryPort {
  readonly #queue: MessageQueue<SagaDeliveryMessage>;
  #controller?: AbortController;
  #completion?: Promise<void>;

  /** Create delivery around a queue owned by this component. */
  constructor(queue: MessageQueue<SagaDeliveryMessage>) {
    this.#queue = queue;
  }

  /** Start one queue listener for the supplied started runtime. */
  async start(runtime: SagaRuntime): Promise<void> {
    if (this.#completion) {
      throw SagasError.validationFailed('Saga delivery is already running.');
    }
    this.#controller = new AbortController();
    this.#completion = this.#queue.listen(
      async (message, context) => await deliver(runtime, message, context),
      { signal: this.#controller.signal },
    );

    // Give synchronous/lazy initialization failures one microtask to surface while preserving the
    // listener as a long-running resource owned by the supervisor.
    await Promise.race([
      this.#completion.then(() => undefined),
      new Promise<void>((resolve) => queueMicrotask(resolve)),
    ]);
  }

  /** Wait for the queue listener to stop or fail. */
  wait(): Promise<void> {
    return this.#completion ?? Promise.reject(
      SagasError.validationFailed('Saga delivery has not been started.'),
    );
  }

  /** Abort the listener and close its queue. */
  async stop(): Promise<void> {
    this.#controller?.abort();
    await this.#queue.stop();
    await this.#completion;
    this.#completion = undefined;
    this.#controller = undefined;
  }
}

/** Scheduler adapter that uses the delivery queue's native delayed-message support. */
export class SagaQueueScheduler implements SagaSchedulerPort {
  readonly id = 'saga-delivery-queue-scheduler';
  readonly #queue: MessageQueue<SagaDeliveryMessage>;
  #running = false;

  /** Create a scheduler that shares the runner delivery queue. */
  constructor(queue: MessageQueue<SagaDeliveryMessage>) {
    this.#queue = queue;
  }

  /** Enable scheduled cascade acceptance. */
  start(): Promise<void> {
    this.#running = true;
    return Promise.resolve();
  }

  /** Disable scheduled cascade acceptance. */
  stop(): Promise<void> {
    this.#running = false;
    return Promise.resolve();
  }

  /** Enqueue a scheduled cascade with a provider-native delay. */
  async scheduleCascaded(message: CascadedMessage<'scheduled'>): Promise<void> {
    if (!this.#running) {
      throw SagasError.validationFailed(
        'Saga queue scheduler must be started before scheduling messages.',
      );
    }
    const scheduled = scheduledSagaMessage(message.message);
    await this.#queue.enqueue(toDeliveryMessage(scheduled), {
      delay: Math.max(0, message.scheduledFor.getTime() - Date.now()),
      deduplicationId: scheduled.idempotencyKey,
      headers: traceHeaders(scheduled),
    });
  }
}

function toDeliveryMessage(
  message: SagaMessage,
  options: SagaPublishOptions = {},
): SagaDeliveryMessage {
  return Object.freeze({
    id: message.id,
    type: message.type,
    payload: message.payload,
    correlationKey: message.correlationKey,
    idempotencyKey: options.idempotencyKey ?? message.idempotencyKey,
    concurrencyKey: options.concurrencyKey ?? message.concurrencyKey,
    occurredAt: message.occurredAt?.toISOString(),
    traceparent: options.traceparent ?? message.traceparent,
    tracestate: options.tracestate ?? message.tracestate,
  });
}

async function deliver(
  runtime: SagaRuntime,
  deliveryMessage: SagaDeliveryMessage,
  _context: MessageContext,
): Promise<void> {
  const activeTrace = getTraceContext();
  await runtime.publish(
    Object.freeze({
      ...deliveryMessage,
      id: deliveryMessage.id,
      occurredAt: deliveryMessage.occurredAt === undefined
        ? undefined
        : new Date(deliveryMessage.occurredAt),
      traceparent: activeTrace?.traceparent ?? deliveryMessage.traceparent,
      tracestate: activeTrace?.tracestate ?? deliveryMessage.tracestate,
    }) as SagaMessage,
    {
      idempotencyKey: deliveryMessage.idempotencyKey,
      concurrencyKey: deliveryMessage.concurrencyKey,
      traceparent: activeTrace?.traceparent ?? deliveryMessage.traceparent,
      tracestate: activeTrace?.tracestate ?? deliveryMessage.tracestate,
    },
  );
}

function scheduledSagaMessage(message: SagaMessage | CascadedMessage): SagaMessage {
  if ('type' in message) {
    return message;
  }
  if (message.kind === 'send') {
    return Object.freeze({
      type: message.target.id,
      payload: message.payload,
      idempotencyKey: message.idempotencyKey,
      concurrencyKey: message.concurrencyKey,
    });
  }
  throw SagasError.notImplemented(
    `Scheduled ${message.kind} cascades cannot be delivered as saga messages.`,
  );
}

function traceHeaders(
  message: Pick<SagaDeliveryMessage, 'traceparent' | 'tracestate'>,
): Record<string, string> {
  return {
    ...(message.traceparent ? { traceparent: message.traceparent } : {}),
    ...(message.tracestate ? { tracestate: message.tracestate } : {}),
  };
}
