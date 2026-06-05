import type {
  TriggerIdempotencyClaim,
  TriggerIdempotencyKeyInput,
  TriggerIdempotencyPort,
} from '../ports/mod.ts';

type CompletedClaim = Readonly<{ expiresAt: number }>;

/** In-memory idempotency store with caller/header/hash key precedence. */
export class MemoryTriggerIdempotencyStore implements TriggerIdempotencyPort {
  readonly #completed = new Map<string, CompletedClaim>();
  readonly #active = new Set<string>();
  readonly #now: () => Date;

  constructor(options: Readonly<{ now?: () => Date }> = {}) {
    this.#now = options.now ?? (() => new Date());
  }

  async resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim> {
    const resolved = await resolveKey(input);
    this.#deleteExpired();
    if (this.#completed.has(resolved.key) || this.#active.has(resolved.key)) {
      return { ...resolved, claimed: false };
    }
    this.#active.add(resolved.key);
    return { ...resolved, claimed: true };
  }

  markCompleted(key: string, ttlMs: number): Promise<void> {
    this.#active.delete(key);
    this.#completed.set(key, { expiresAt: this.#now().getTime() + ttlMs });
    return Promise.resolve();
  }

  release(key: string): Promise<void> {
    this.#active.delete(key);
    return Promise.resolve();
  }

  clear(): void {
    this.#completed.clear();
    this.#active.clear();
  }

  #deleteExpired(): void {
    const now = this.#now().getTime();
    for (const [key, claim] of this.#completed) {
      if (claim.expiresAt <= now) {
        this.#completed.delete(key);
      }
    }
  }
}

async function resolveKey(input: TriggerIdempotencyKeyInput): Promise<
  Omit<TriggerIdempotencyClaim, 'claimed'>
> {
  if (input.event.idempotencyKey !== undefined) {
    return { key: input.event.idempotencyKey, source: 'caller' };
  }
  const headerKey = input.requestHeaders?.['x-idempotency-key'] ??
    input.requestHeaders?.['idempotency-key'];
  if (headerKey !== undefined && headerKey.length > 0) {
    return { key: headerKey, source: 'request-header' };
  }
  return { key: await payloadHash(input.event.payload), source: 'payload-hash' };
}

async function payloadHash(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}
