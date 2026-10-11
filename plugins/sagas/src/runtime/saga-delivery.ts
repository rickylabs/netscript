import { createQueue } from '@netscript/queue';
import type {
  CascadedMessage,
  SagaInstanceId,
  SagaMessage,
  SagaStateEnvelope,
} from '@netscript/plugin-sagas-core/domain';
import { SagasError } from '@netscript/plugin-sagas-core/domain';
import type {
  SagaPublishOptions,
  SagaRuntime,
  SagaSchedulerPort,
  SagaStorePort,
} from '@netscript/plugin-sagas-core/runtime';
import { sagaRetentionRemaining } from '@netscript/plugin-sagas-core/stores';
import { getTraceContext } from '@netscript/telemetry/context';

/** Shared queue name used by saga API publishers and background runners. */
export const SAGA_DELIVERY_QUEUE = 'sagas' as const;
const DELIVERY_STOP_GRACE_MS = 1_000;

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
  /** Durable originating instance for scheduled deliveries only. */
  scheduledFrom?: SagaInstanceId;
}>;

/** Queue metadata made available while the runner handles one delivery. */
export type SagaDeliveryContext = Readonly<{
  /** Provider-assigned message identifier. */
  messageId: string;
  /** Number of times the provider has delivered this message. */
  deliveryCount: number;
  /** Time at which the provider accepted the message. */
  enqueuedAt: Date;
  /** Propagated application and trace headers. */
  headers: Record<string, string>;
}>;

/** Provider-neutral queue subset required by saga delivery. */
export interface SagaDeliveryQueuePort {
  /** Whether the provider owns retry/redelivery behavior. */
  readonly nativeRetrial: boolean;
  /** Durably accept one saga delivery, optionally after a delay. */
  enqueue(
    message: SagaDeliveryMessage,
    options?: Readonly<{
      delay?: number;
      deduplicationId?: string;
      headers?: Record<string, string>;
      retentionId?: string;
    }>,
  ): Promise<void>;
  /** Cancel one bounded page of pending messages using canonical instance identities. */
  cancelPending?(
    resolve: (ids: readonly string[]) => Promise<readonly string[]>,
    onCancelled?: (retentionId: string) => void,
  ): Promise<boolean>;
  /** Consume messages until stopped or aborted. */
  listen(
    handler: (
      message: SagaDeliveryMessage,
      context: SagaDeliveryContext,
    ) => Promise<void>,
    options?: Readonly<{ signal?: AbortSignal }>,
  ): Promise<void>;
  /** Stop listening and close provider resources. */
  stop(): Promise<void>;
}

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
  queue?: SagaDeliveryQueuePort;
}>;

/** Create the default provider-neutral queue used for saga delivery. */
export function createSagaDeliveryQueue(): SagaDeliveryQueuePort {
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
  readonly #queue: SagaDeliveryQueuePort;
  readonly #scheduler?: Readonly<{ wait(): Promise<void> }>;
  #controller?: AbortController;
  #completion?: Promise<void>;

  /** Create delivery around a queue owned by this component. */
  constructor(queue: SagaDeliveryQueuePort, scheduler?: Readonly<{ wait(): Promise<void> }>) {
    this.#queue = queue;
    this.#scheduler = scheduler;
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
    if (this.#completion && this.#scheduler) {
      return Promise.race([this.#completion, this.#scheduler.wait()]);
    }
    return this.#completion ?? Promise.reject(
      SagasError.validationFailed('Saga delivery has not been started.'),
    );
  }

  /** Abort the listener and close its queue. */
  async stop(): Promise<void> {
    this.#controller?.abort();
    await this.#queue.stop();
    const completion = this.#completion;
    if (completion) {
      await Promise.race([
        completion,
        new Promise<void>((resolve) => setTimeout(resolve, DELIVERY_STOP_GRACE_MS)),
      ]);
      // A provider that cannot acknowledge cancellation must not keep shutdown pending or surface
      // a detached rejection after its owned resources have been closed.
      completion.catch(() => undefined);
    }
    this.#completion = undefined;
    this.#controller = undefined;
  }
}

/** Scheduler adapter that uses the delivery queue's native delayed-message support. */
export class SagaQueueScheduler implements SagaSchedulerPort {
  /** Stable identifier used by runtime diagnostics. */
  readonly id = 'saga-delivery-queue-scheduler';
  readonly #queue: SagaDeliveryQueuePort;
  readonly #scheduledQueue?: SagaDeliveryQueuePort;
  #store?: SagaStorePort;
  #completedRetentionDays: number | ((envelope: SagaStateEnvelope) => number) = 7;
  #cancellable = false;
  #retentionDrops = 0;
  #controller?: AbortController;
  #completion?: Promise<void>;
  #running = false;

  /** Create a scheduler that shares the runner delivery queue. */
  constructor(queue: SagaDeliveryQueuePort, scheduledQueue?: SagaDeliveryQueuePort) {
    this.#queue = queue;
    this.#scheduledQueue = scheduledQueue;
  }

  /** Bind canonical state before starting a cancellable scheduling queue. */
  bindRetentionStore(
    store: SagaStorePort,
    options: Readonly<{
      completedRetentionDays?: number | ((envelope: SagaStateEnvelope) => number);
    }> = {},
  ): void {
    this.#store = store;
    this.#completedRetentionDays = options.completedRetentionDays ?? 7;
  }

  /** Number of messages deleted or dropped after their origin's retention deadline. */
  get retentionDrops(): number {
    return this.#retentionDrops;
  }

  /** Enable scheduled cascade acceptance. */
  start(): Promise<void> {
    if (this.#running) {
      throw SagasError.validationFailed('Saga queue scheduler is already running.');
    }
    this.#cancellable = !!(this.#scheduledQueue?.cancelPending && this.#store);
    if (this.#scheduledQueue && !this.#cancellable) {
      console.warn(
        '[Sagas Scheduler] Canonical retention or queue cancellation unavailable; using native delays.',
      );
    }
    if (this.#scheduledQueue && this.#cancellable) {
      this.#controller = new AbortController();
      this.#completion = this.#scheduledQueue.listen(async (message) => {
        if (message.scheduledFrom && (await this.#cancelled([message.scheduledFrom])).length > 0) {
          this.#retentionDrops++;
          return;
        }
        await this.#queue.enqueue(message, {
          deduplicationId: message.idempotencyKey,
          headers: traceHeaders(message),
        });
      }, { signal: this.#controller.signal });
      // stop() observes errors; suppress detached rejections while the supervisor is running.
      this.#completion.catch(() => undefined);
    }
    this.#running = true;
    return Promise.resolve();
  }

  /** Observe the scheduled listener through the runner's existing delivery supervision. */
  wait(): Promise<void> {
    return this.#completion ?? new Promise<void>(() => {});
  }

  /** Disable scheduled cascade acceptance. */
  async stop(): Promise<void> {
    this.#running = false;
    this.#controller?.abort();
    await this.#scheduledQueue?.stop();
    await this.#completion;
    this.#completion = undefined;
  }

  /** Cancel at most 100 pending messages; persisted queue progress survives scheduler restart. */
  async cleanupRetention(): Promise<boolean> {
    const queue = this.#scheduledQueue;
    if (!this.#store || !queue?.cancelPending) return false;
    return await queue.cancelPending((ids) => this.#cancelled(ids), () => {
      this.#retentionDrops++;
    });
  }

  async #cancelled(ids: readonly string[]): Promise<readonly string[]> {
    const store = this.#store;
    if (!store) return [];
    const instanceIds = ids as readonly SagaInstanceId[];
    const envelopes = store.loadMany
      ? await store.loadMany(instanceIds)
      : await Promise.all(instanceIds.map((id) => store.load(id)));
    return ids.filter((_id, index) => {
      const envelope = envelopes[index];
      if (envelope === undefined) return true;
      const days = typeof this.#completedRetentionDays === 'function'
        ? this.#completedRetentionDays(envelope)
        : this.#completedRetentionDays;
      const remaining = sagaRetentionRemaining(envelope, days, new Date());
      return remaining !== undefined && remaining <= 0;
    });
  }

  /** Enqueue a scheduled cascade with a provider-native delay. */
  async scheduleCascaded(
    message: CascadedMessage<'scheduled'>,
    context?: Readonly<{ instanceId: SagaInstanceId }>,
  ): Promise<void> {
    if (!this.#running) {
      throw SagasError.validationFailed(
        'Saga queue scheduler must be started before scheduling messages.',
      );
    }
    const scheduled = scheduledSagaMessage(message.message);
    if (!Number.isFinite(message.scheduledFor.getTime())) {
      throw SagasError.validationFailed('Scheduled message date must be valid.');
    }
    const queue = this.#cancellable ? this.#scheduledQueue : this.#queue;
    if (!queue) throw SagasError.validationFailed('Scheduled queue is unavailable.');
    await queue.enqueue({
      ...toDeliveryMessage(scheduled),
      ...(context ? { scheduledFrom: context.instanceId } : {}),
    }, {
      delay: Math.max(0, message.scheduledFor.getTime() - Date.now()),
      deduplicationId: scheduled.idempotencyKey,
      headers: traceHeaders(scheduled),
      retentionId: context?.instanceId,
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
  _context: SagaDeliveryContext,
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
