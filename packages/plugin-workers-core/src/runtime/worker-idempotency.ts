import type {
  WorkerIdempotencyClaim,
  WorkerIdempotencyInput,
  WorkerIdempotencySource,
} from '../ports/worker-idempotency-port.ts';

/** Resolved worker idempotency key before a store attempts to claim it. */
export type WorkerResolvedIdempotencyKey = Readonly<
  Pick<WorkerIdempotencyClaim, 'key' | 'source'>
>;

/** Resolve the namespaced worker idempotency key for a delivery. */
export async function resolveWorkerIdempotencyKey(
  input: WorkerIdempotencyInput,
): Promise<WorkerResolvedIdempotencyKey> {
  const resolved = await resolveRawKey(input);
  return Object.freeze({
    key: `${input.concept}:${input.targetId}:${resolved.key}`,
    source: resolved.source,
  });
}

async function resolveRawKey(
  input: WorkerIdempotencyInput,
): Promise<Readonly<{ key: string; source: WorkerIdempotencySource }>> {
  if (input.idempotencyKey !== undefined && input.idempotencyKey.length > 0) {
    return { key: input.idempotencyKey, source: 'caller' };
  }
  if (input.messageId !== undefined && input.messageId.length > 0) {
    return { key: input.messageId, source: 'message-id' };
  }
  return { key: await payloadHash(input.payload), source: 'payload-hash' };
}

async function payloadHash(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload) ?? 'undefined';
  const bytes = new TextEncoder().encode(json);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}
