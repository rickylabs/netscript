import {
  TRIGGER_INGRESS_MAX_RESPONSE_MS,
  type TriggerDefinition,
  type TriggerEvent,
  type TriggerEventId,
  type TriggerId,
  TriggersError,
  type WebhookDefinition,
  type WebhookTriggerPayload,
} from '../domain/mod.ts';
import type {
  TriggerEventStorePort,
  TriggerIngressPort,
  TriggerIngressRequest,
  TriggerIngressResponse,
  TriggerProcessorPort,
  WebhookVerifierPort,
} from '../ports/mod.ts';
import { type LoggerPort, NoopLogger } from './logger.ts';

/** Generates event ids for accepted ingress events. */
export type TriggerIngressEventIdFactory = (
  request: TriggerIngressRequest,
  definition: RuntimeWebhookDefinition,
) => TriggerEventId;

/** Webhook definition shape accepted by the trigger ingress runtime. */
export type RuntimeWebhookDefinition = WebhookDefinition<string, never, never>;

/** Options accepted by the trigger ingress composition root. */
export type TriggerIngressOptions = Readonly<{
  definitions: readonly RuntimeWebhookDefinition[];
  eventStore: TriggerEventStorePort;
  processor: TriggerProcessorPort;
  verifier: WebhookVerifierPort;
  selectVerifier?: (
    definition: RuntimeWebhookDefinition,
  ) => WebhookVerifierPort | undefined;
  logger?: LoggerPort;
  now?: () => Date;
  createEventId?: TriggerIngressEventIdFactory;
  resolveSecret?: (definition: RuntimeWebhookDefinition) => string | undefined;
}>;

/** Create an ack-then-process webhook ingress boundary. */
export function createTriggerIngress(options: TriggerIngressOptions): TriggerIngressPort {
  return new DefaultTriggerIngress(options);
}

class DefaultTriggerIngress implements TriggerIngressPort {
  readonly #definitions = new Map<string, RuntimeWebhookDefinition>();
  readonly #definitionsByPath = new Map<string, RuntimeWebhookDefinition>();
  readonly #eventStore: TriggerEventStorePort;
  readonly #processor: TriggerProcessorPort;
  readonly #verifier: WebhookVerifierPort;
  readonly #selectVerifier: (
    definition: RuntimeWebhookDefinition,
  ) => WebhookVerifierPort | undefined;
  readonly #logger: LoggerPort;
  readonly #now: () => Date;
  readonly #createEventId: TriggerIngressEventIdFactory;
  readonly #resolveSecret: (
    definition: RuntimeWebhookDefinition,
  ) => string | undefined;

  constructor(options: TriggerIngressOptions) {
    for (const definition of options.definitions) {
      this.#definitions.set(definition.id, definition);
      this.#definitionsByPath.set(normalizeWebhookPath(definition.path), definition);
    }
    this.#eventStore = options.eventStore;
    this.#processor = options.processor;
    this.#verifier = options.verifier;
    this.#selectVerifier = options.selectVerifier ?? (() => undefined);
    this.#logger = options.logger ?? new NoopLogger();
    this.#now = options.now ?? (() => new Date());
    this.#createEventId = options.createEventId ?? defaultEventId;
    this.#resolveSecret = options.resolveSecret ?? (() => undefined);
  }

  async accept(request: TriggerIngressRequest): Promise<TriggerIngressResponse> {
    const startedAt = performance.now();
    const definition = this.#lookup(request.triggerId);
    const body = new Uint8Array(await request.request.arrayBuffer());
    const verifier = this.#selectVerifier(definition) ?? this.#verifier;
    const verification = await verifier.verify({
      body,
      headers: request.request.headers,
      secret: this.#resolveSecret(definition),
    });
    if (!verification.ok) {
      throw TriggersError.validationFailed(
        `Webhook verification failed for trigger ${definition.id}.`,
        verification.reason,
      );
    }

    const event = await this.#createEvent(request, definition, body, verification.idempotencyKey);
    await this.#eventStore.save(event);
    this.#processLater(event, definition);

    const acceptedAt = this.#now().toISOString();
    const elapsedMs = performance.now() - startedAt;
    if (elapsedMs > TRIGGER_INGRESS_MAX_RESPONSE_MS) {
      this.#logger.warn('trigger.ingress.slow_ack', {
        triggerId: definition.id,
        eventId: event.id,
        elapsedMs,
      });
    }
    return { status: 202, event, acceptedAt };
  }

  #lookup(triggerId: TriggerId): RuntimeWebhookDefinition {
    const lookupKey = String(triggerId);
    const definition = this.#definitions.get(lookupKey) ??
      this.#definitionsByPath.get(normalizeWebhookPath(lookupKey));
    if (definition === undefined) {
      throw TriggersError.triggerNotFound(triggerId);
    }
    if (definition.kind !== 'webhook') {
      throw TriggersError.validationFailed(`Trigger ${triggerId} is not a webhook trigger.`);
    }
    return definition;
  }

  async #createEvent(
    request: TriggerIngressRequest,
    definition: RuntimeWebhookDefinition,
    body: Uint8Array,
    idempotencyKey: string | undefined,
  ): Promise<TriggerEvent<'webhook', WebhookTriggerPayload>> {
    const now = this.#now().toISOString();
    const headers = headersToRecord(request.request.headers);
    const payloadBody = parseWebhookBody(body, request.request.headers);
    return {
      id: this.#createEventId(request, definition),
      triggerId: definition.id,
      kind: 'webhook',
      status: 'pending',
      payload: {
        body: payloadBody,
        headers,
        method: 'POST',
        path: new URL(request.request.url).pathname,
      },
      attempt: 0,
      detectedAt: now,
      updatedAt: now,
      idempotencyKey,
      requestHeaders: headers,
      traceparent: headers.traceparent,
      tracestate: headers.tracestate,
    };
  }

  #processLater(event: TriggerEvent, definition: RuntimeWebhookDefinition): void {
    queueMicrotask(() => {
      this.#process(event, definition);
    });
  }

  #process(event: TriggerEvent, definition: RuntimeWebhookDefinition): void {
    void this.#processAndRecord(event, definition);
  }

  async #processAndRecord(
    event: TriggerEvent,
    definition: RuntimeWebhookDefinition,
  ): Promise<void> {
    try {
      const result = await this.#processor.process(event, definition);
      await this.#recordStatus(event, result.status, {
        actionsDispatched: result.actionsDispatched,
      });
    } catch (error) {
      await this.#recordStatus(event, 'failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.#logger.error('trigger.ingress.process_failed', {
        triggerId: event.triggerId,
        eventId: event.id,
      });
    }
  }

  async #recordStatus(
    event: TriggerEvent,
    status: TriggerEvent['status'],
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    try {
      await this.#eventStore.updateStatus(event.id, status, metadata);
    } catch (error) {
      this.#logger.error('trigger.ingress.status_update_failed', {
        triggerId: event.triggerId,
        eventId: event.id,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function normalizeWebhookPath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

function defaultEventId(): TriggerEventId {
  return `trg_evt_${crypto.randomUUID()}` as TriggerEventId;
}

function headersToRecord(headers: Headers): Readonly<Record<string, string>> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}

function parseWebhookBody(body: Uint8Array, headers: Headers): unknown {
  const text = new TextDecoder().decode(body);
  if (text.length === 0) {
    return undefined;
  }
  const contentType = headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}
