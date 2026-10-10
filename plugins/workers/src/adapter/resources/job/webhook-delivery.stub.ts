/** Outbound webhook recipe source emitted as consumer-owned worker code.
 * @module
 */
import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Delivery job source; endpoint and credentials are injected by the worker service. */
export const webhookDeliveryStub: StubSource<'JOB_ID' | 'JOB_EXPORT' | 'JOB_FILE'> = defineStub({
  source: `import {
  createSuccessResult,
  defineJob,
  defineJobHandler,
  type JobDefinition,
  type JobHandlerDefinition,
} from '@netscript/plugin-workers-core';
import type { DeadLetterStorePort } from '@netscript/queue';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { delay } from '@std/async';
import { z } from 'zod';

/** Raw body is persisted once by the producer and reused byte-for-byte. */
export interface Delivery {
  deliveryId: string;
  endpointId: string;
  enqueuedAt: string;
  body: string;
}
export const DeliverySchema: z.ZodType<Delivery> = z.object({
  deliveryId: z.string().min(1).max(256),
  endpointId: z.string().min(1).max(256),
  enqueuedAt: z.iso.datetime(),
  body: z.string().max(65536),
});

/** Consumer-owned endpoint registry; secrets come from service configuration. */
export interface DeliveryConfig {
  readonly endpoints: ReadonlyMap<
    string,
    Readonly<{ url: string; secret: string; active: boolean }>
  >;
  readonly deadLetters: DeadLetterStorePort<Delivery>;
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly attemptTimeoutMs: number;
  readonly now?: () => number;
  readonly random?: () => number;
  readonly send?: typeof fetch;
  readonly wait?: (ms: number, signal: AbortSignal) => Promise<void>;
}

/** Full jitter over a capped exponential schedule; attempt 1 is the first failure. */
export function backoffMs(attempt: number, base: number, cap: number, random: number): number {
  return Math.floor(Math.min(cap, base * 2 ** Math.min(attempt - 1, 30)) * random);
}

/** Authenticate the timestamp, delivery identity and exact UTF-8 request body. */
export async function signDelivery(
  key: CryptoKey,
  timestamp: string,
  id: string,
  body: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(timestamp + '.' + id + '.' + body);
  const signature = await crypto.subtle.sign('HMAC', key, bytes);
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

/** Compose the handler with service-owned configuration and the existing DLQ port. */
export function createDeliveryHandler(config: DeliveryConfig): JobHandlerDefinition<Delivery> {
  for (
    const [name, value, upper] of [
      ['maxAttempts', config.maxAttempts, 100],
      ['baseDelayMs', config.baseDelayMs, 60000],
      ['maxDelayMs', config.maxDelayMs, 60000],
      ['attemptTimeoutMs', config.attemptTimeoutMs, 300000],
    ] as const
  ) {
    if (!Number.isSafeInteger(value) || value < 1 || value > upper) {
      throw new TypeError('Invalid webhook policy: ' + name);
    }
  }
  const now = config.now ?? Date.now;
  const random = config.random ?? Math.random;
  const send = config.send ?? fetch;
  const wait = config.wait ?? ((ms, signal) => delay(ms, { signal }));
  return defineJobHandler(DeliverySchema, async (ctx) => {
    const payload = ctx.payload;
    const endpoint = config.endpoints.get(payload.endpointId);
    if (!endpoint?.active) throw new TypeError('Webhook endpoint is missing or inactive');
    const url = new URL(endpoint.url);
    if (url.protocol !== 'https:' || url.username || url.password || !endpoint.secret) {
      throw new TypeError('Webhook endpoint requires HTTPS and an injected secret');
    }
    if (new TextEncoder().encode(payload.body).length > 65536) {
      throw new TypeError('Webhook body exceeds 64 KiB');
    }
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(endpoint.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    let attempts = 0;
    let outcome = 'network_error';
    while (attempts < config.maxAttempts) {
      ctx.signal.throwIfAborted();
      const remaining = ctx.deadlineAt === undefined
        ? config.attemptTimeoutMs
        : ctx.deadlineAt - now();
      if (remaining <= 0) {
        outcome = 'job_deadline_exceeded';
        break;
      }
      attempts += 1;
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(new DOMException('Webhook attempt timed out', 'TimeoutError')),
        Math.min(config.attemptTimeoutMs, remaining),
      );
      const signal = AbortSignal.any([ctx.signal, controller.signal]);
      let delivered = false;
      try {
        const timestamp = String(Math.floor(now() / 1000));
        const signature = await signDelivery(key, timestamp, payload.deliveryId, payload.body);
        signal.throwIfAborted();
        const response = await send(url, {
          method: 'POST',
          body: payload.body,
          signal,
          redirect: 'error',
          headers: {
            'content-type': 'application/json',
            'webhook-id': payload.deliveryId,
            'webhook-timestamp': timestamp,
            'webhook-signature': 'v1=' + signature,
            'idempotency-key': payload.deliveryId,
          },
        });
        // Do not read or retain an unbounded receiver response.
        await response.body?.cancel();
        signal.throwIfAborted();
        outcome = 'http_' + response.status;
        delivered = response.ok;
      } catch {
        ctx.signal.throwIfAborted();
        if (ctx.deadlineAt !== undefined && now() >= ctx.deadlineAt) {
          outcome = 'job_deadline_exceeded';
          break;
        }
        outcome = controller.signal.aborted ? 'attempt_timeout' : 'network_error';
      } finally {
        clearTimeout(timer);
      }
      await ctx.reportProgress?.(Math.floor(attempts / config.maxAttempts * 100), outcome);
      if (delivered) {
        return createSuccessResult({
          deliveryId: payload.deliveryId,
          attempts,
          outcome: 'delivered',
        });
      }
      if (attempts < config.maxAttempts) {
        const sample = random();
        if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
          throw new TypeError('Invalid jitter sample');
        }
        const ms = backoffMs(attempts, config.baseDelayMs, config.maxDelayMs, sample);
        if (ctx.deadlineAt !== undefined && now() + ms >= ctx.deadlineAt) {
          outcome = 'job_deadline_exceeded';
          break;
        }
        await wait(ms, ctx.signal);
      }
    }
    ctx.signal.throwIfAborted();
    await config.deadLetters.append({
      messageId: payload.deliveryId,
      queueName: '%%JOB_ID%%',
      payload,
      headers: { 'webhook-id': payload.deliveryId },
      deliveryCount: attempts,
      enqueuedAt: payload.enqueuedAt,
      failedAt: new Date(now()).toISOString(),
      reason: 'max_attempts_exceeded',
      errorCode: outcome,
    });
    // Completion follows durable append. A store failure propagates and is never acknowledged.
    return createSuccessResult({
      deliveryId: payload.deliveryId,
      attempts,
      outcome: 'dead_lettered',
    });
  });
}

function requiredConfig(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new TypeError('Missing injected service configuration: ' + name);
  return value;
}

/** Default subprocess entrypoint: each run owns and closes its durable KV connection. */
export const %%JOB_EXPORT%%: JobHandlerDefinition<Delivery> = defineJobHandler(
  DeliverySchema,
  async (ctx) => {
    const endpointId = requiredConfig('WEBHOOK_ENDPOINT_ID');
    const url = requiredConfig('WEBHOOK_ENDPOINT_URL');
    const secret = requiredConfig('WEBHOOK_SIGNING_SECRET');
    const path = requiredConfig('WEBHOOK_DLQ_PATH');
    const kv = await Deno.openKv(path);
    try {
      return await createDeliveryHandler({
        endpoints: new Map([[endpointId, { url, secret, active: true }]]),
        deadLetters: new KvDeadLetterStore<Delivery>({ queueName: '%%JOB_ID%%', denoKv: kv }),
        maxAttempts: Number(Deno.env.get('WEBHOOK_MAX_ATTEMPTS') ?? '5'),
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        attemptTimeoutMs: 10000,
      })(ctx);
    } finally {
      kv.close();
    }
  },
);

/** Register this definition with maxRetries 0: this handler owns the delivery retry budget. */
const deliveryJobId = '%%JOB_ID%%' as const;
export const deliveryJob: JobDefinition<typeof deliveryJobId, Delivery> = defineJob(deliveryJobId)
  .payload(DeliverySchema)
  .entrypoint('./%%JOB_FILE%%.ts').retry(0).build();
export default %%JOB_EXPORT%%;
`,
  tokens: ['JOB_ID', 'JOB_EXPORT', 'JOB_FILE'] as const,
});
