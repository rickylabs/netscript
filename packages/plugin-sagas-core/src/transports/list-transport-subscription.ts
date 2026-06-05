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

  constructor(
    readonly topic: string,
    readonly queueKey: string,
    readonly processingKey: string,
    readonly handler: (
      envelope: SagaTransportMessage,
      ack: SagaTransportAck,
    ) => Promise<void>,
  ) {}

  get blockingClient(): ListBlockingClient | undefined {
    return this.#blockingClient;
  }

  get readLoopPromise(): Promise<void> | undefined {
    return this.#readLoopPromise;
  }

  get stopping(): boolean {
    return this.#stopping;
  }

  attachBlockingClient(client: ListBlockingClient): void {
    this.#blockingClient = client;
  }

  attachReadLoop(readLoop: Promise<void>): void {
    this.#readLoopPromise = readLoop;
  }

  requestStop(): void {
    this.#stopping = true;
  }

  resetStop(): void {
    this.#stopping = false;
  }

  clearRuntime(): void {
    this.#blockingClient = undefined;
    this.#readLoopPromise = undefined;
  }
}

/** Blocking list client required by one subscription read loop. */
export interface ListBlockingClient {
  quit(): Promise<unknown>;
  blmove(
    source: string,
    destination: string,
    sourceDirection: 'RIGHT',
    destinationDirection: 'LEFT',
    timeoutSeconds: number,
  ): Promise<string | null>;
  brpoplpush(source: string, destination: string, timeoutSeconds: number): Promise<string | null>;
}

/** Ack handle for one processing-list message. */
export class ListTransportAck implements SagaTransportAck {
  #settled = false;

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

  get settled(): boolean {
    return this.#settled;
  }

  async ack(): Promise<void> {
    if (this.#settled) return;
    await this.acknowledge(this.processingKey, this.messageJson, this.metadataKey);
    this.#settled = true;
  }

  nack(_reason?: string): Promise<void> {
    this.#settled = true;
    return Promise.resolve();
  }
}

/** Runtime list subscription returned to callers. */
export class ListTransportSubscription implements SagaTransportSubscription {
  constructor(
    readonly topic: string,
    private readonly remove: (topic: string) => Promise<void>,
  ) {}

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
