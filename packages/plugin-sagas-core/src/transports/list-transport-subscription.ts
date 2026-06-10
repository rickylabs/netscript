import type { SagaMessage } from '../domain/mod.ts';
import type {
  SagaTransportAck,
  SagaTransportMessage,
  SagaTransportSubscription,
} from '../ports/mod.ts';

/** Stored list-transport envelope. */
export type ListStoredEnvelope = Readonly<{
  schemaVersion: 1;
  id: string;
  topic: string;
  message: SagaMessage;
  timestamp: string;
}>;

/** Decoded list-transport message with transport metadata. */
export type ListDecodedTransportMessage = Readonly<{
  envelopeId: string;
  transportMessage: SagaTransportMessage;
}>;

/** Subscription record for one list queue and processing list. */
export class ListTransportSubscriptionRecord {
  #blockingClient?: ListBlockingClient;
  #readLoopPromise?: Promise<void>;
  #stopping = false;

  /** Create the runtime record for one topic subscription. */
  constructor(
    /** Topic consumed by this subscription. */
    readonly topic: string,
    /** Ready queue key for the topic. */
    readonly queueKey: string,
    /** Processing list key used while a handler runs. */
    readonly processingKey: string,
    /** User handler invoked for each decoded saga message. */
    readonly handler: (
      envelope: SagaTransportMessage,
      ack: SagaTransportAck,
    ) => Promise<void>,
  ) {}

  /** Blocking Redis client currently assigned to the read loop. */
  get blockingClient(): ListBlockingClient | undefined {
    return this.#blockingClient;
  }

  /** Promise for the active read loop, when the subscription is running. */
  get readLoopPromise(): Promise<void> | undefined {
    return this.#readLoopPromise;
  }

  /** Whether the subscription has been asked to stop. */
  get stopping(): boolean {
    return this.#stopping;
  }

  /** Attach the blocking client used by the read loop. */
  attachBlockingClient(client: ListBlockingClient): void {
    this.#blockingClient = client;
  }

  /** Attach the active read-loop promise. */
  attachReadLoop(readLoop: Promise<void>): void {
    this.#readLoopPromise = readLoop;
  }

  /** Request shutdown for the subscription read loop. */
  requestStop(): void {
    this.#stopping = true;
  }

  /** Clear the stop flag before starting a fresh read loop. */
  resetStop(): void {
    this.#stopping = false;
  }

  /** Drop runtime-only client and promise references. */
  clearRuntime(): void {
    this.#blockingClient = undefined;
    this.#readLoopPromise = undefined;
  }
}

/** Blocking list client required by one subscription read loop. */
export interface ListBlockingClient {
  /** Close the blocking client connection. */
  quit(): Promise<unknown>;
  /** Atomically move one item between lists using Redis BLMOVE. */
  blmove(
    source: string,
    destination: string,
    sourceDirection: 'RIGHT',
    destinationDirection: 'LEFT',
    timeoutSeconds: number,
  ): Promise<string | null>;
  /** Atomically move one item between lists using Redis BRPOPLPUSH. */
  brpoplpush(source: string, destination: string, timeoutSeconds: number): Promise<string | null>;
}

/** Ack handle for one processing-list message. */
export class ListTransportAck implements SagaTransportAck {
  #settled = false;

  /** Create an ack handle for one processing-list message. */
  constructor(
    private readonly processingKey: string,
    private readonly messageJson: string,
    private readonly metadataKey: string,
    private readonly acknowledge: (
      processingKey: string,
      messageJson: string,
      metadataKey: string,
    ) => Promise<void>,
  ) {}

  /** Whether the message has already been acknowledged or rejected. */
  get settled(): boolean {
    return this.#settled;
  }

  /** Acknowledge and remove the message from the processing list. */
  async ack(): Promise<void> {
    if (this.#settled) return;
    await this.acknowledge(this.processingKey, this.messageJson, this.metadataKey);
    this.#settled = true;
  }

  /** Mark the message rejected so orphan recovery can handle it later. */
  nack(_reason?: string): Promise<void> {
    this.#settled = true;
    return Promise.resolve();
  }
}

/** Runtime list subscription returned to callers. */
export class ListTransportSubscription implements SagaTransportSubscription {
  /** Create a caller-facing LIST subscription handle. */
  constructor(
    /** Subscribed topic name. */
    readonly topic: string,
    private readonly remove: (topic: string) => Promise<void>,
  ) {}

  /** Unsubscribe from the topic and stop its read loop. */
  unsubscribe(): Promise<void> {
    return this.remove(this.topic);
  }
}

/** Encode a saga message for LIST queue storage. */
export function encodeListTransportMessage(
  id: string,
  topic: string,
  message: SagaMessage,
  now: Date,
): string {
  const envelope: ListStoredEnvelope = Object.freeze({
    schemaVersion: 1,
    id,
    topic,
    message,
    timestamp: now.toISOString(),
  });
  return JSON.stringify(envelope);
}

/** Decode and validate a LIST queue message. */
export function decodeListTransportMessage(value: string): ListDecodedTransportMessage {
  const parsed: unknown = JSON.parse(value);
  if (!isListStoredEnvelope(parsed)) {
    throw new TypeError('List transport message envelope is invalid.');
  }
  return Object.freeze({
    envelopeId: parsed.id,
    transportMessage: Object.freeze({
      topic: parsed.topic,
      message: parsed.message,
      receivedAt: new Date(parsed.timestamp),
      deliveryAttempt: 1,
    }),
  });
}

function isListStoredEnvelope(value: unknown): value is ListStoredEnvelope {
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1 &&
    typeof value.id === 'string' &&
    typeof value.topic === 'string' &&
    typeof value.timestamp === 'string' &&
    isSagaMessage(value.message);
}

function isSagaMessage(value: unknown): value is SagaMessage {
  return isRecord(value) && typeof value.type === 'string' && 'payload' in value;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
