import type { TriggerId, WebhookDefinition } from '../domain/mod.ts';
import type { TriggerIngressPort } from '../ports/mod.ts';

/** Webhook test delivery request consumed by the runtime helper. */
export type WebhookTestDeliveryInput = Readonly<{
  payload?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  reason?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Webhook test delivery response mapped to the trigger fire contract shape. */
export type WebhookTestDeliveryResponse = Readonly<{
  accepted: boolean;
  eventId: string;
  triggerId: TriggerId;
  status: 'pending' | 'deferred';
}>;

/** Options accepted by the webhook test-delivery helper factory. */
export type WebhookTestDeliveryOptions = Readonly<{
  ingress: TriggerIngressPort;
  now?: () => Date;
  resolveSecret?: (definition: WebhookTestDeliveryDefinition) => string | undefined;
}>;

/** Webhook definition shape accepted by the test-delivery helper. */
export type WebhookTestDeliveryDefinition = WebhookDefinition<string, never, never>;

/** Runtime helper for sending signed synthetic webhook test requests. */
export interface WebhookTestDelivery {
  /** Sign and deliver a synthetic webhook request through trigger ingress. */
  deliver(
    definition: WebhookTestDeliveryDefinition,
    input?: WebhookTestDeliveryInput,
  ): Promise<WebhookTestDeliveryResponse>;
}

/** Create a webhook test-delivery helper over an ingress port. */
export function createWebhookTestDelivery(
  options: WebhookTestDeliveryOptions,
): WebhookTestDelivery {
  return new DefaultWebhookTestDelivery(options);
}

class DefaultWebhookTestDelivery implements WebhookTestDelivery {
  readonly #ingress: TriggerIngressPort;
  readonly #now: () => Date;
  readonly #resolveSecret: (definition: WebhookTestDeliveryDefinition) => string | undefined;

  constructor(options: WebhookTestDeliveryOptions) {
    this.#ingress = options.ingress;
    this.#now = options.now ?? (() => new Date());
    this.#resolveSecret = options.resolveSecret ??
      ((definition) =>
        definition.secretEnv === undefined ? undefined : Deno.env.get(definition.secretEnv));
  }

  async deliver(
    definition: WebhookTestDeliveryDefinition,
    input: WebhookTestDeliveryInput = {},
  ): Promise<WebhookTestDeliveryResponse> {
    const body = encodeBody(definition, input, this.#now());
    const headers = new Headers({
      'content-type': 'application/json',
      'x-hub-signature-256': `sha256=${await signHex(
        body,
        this.#resolveSecret(definition) ?? 'memory-webhook-test-secret',
      )}`,
    });
    if (input.idempotencyKey !== undefined) {
      headers.set('x-idempotency-key', input.idempotencyKey);
    }
    if (input.traceparent !== undefined) {
      headers.set('traceparent', input.traceparent);
    }
    if (input.tracestate !== undefined) {
      headers.set('tracestate', input.tracestate);
    }

    const response = await this.#ingress.accept({
      triggerId: definition.id,
      request: new Request(`https://triggers.test/${definition.path.replace(/^\/+/, '')}`, {
        method: 'POST',
        headers,
        body,
      }),
    });
    return {
      accepted: response.status === 202,
      eventId: response.event?.id ?? '',
      triggerId: response.event?.triggerId ?? definition.id,
      status: response.event?.status === 'deferred' ? 'deferred' : 'pending',
    };
  }
}

function encodeBody(
  definition: WebhookTestDeliveryDefinition,
  input: WebhookTestDeliveryInput,
  now: Date,
): string {
  return JSON.stringify({
    triggerId: definition.id,
    test: true,
    payload: input.payload ?? {},
    reason: input.reason,
    firedAt: now.toISOString(),
  });
}

async function signHex(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
