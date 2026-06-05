import type {
  WebhookVerificationRequest,
  WebhookVerificationResult,
  WebhookVerifierPort,
} from '../ports/mod.ts';

/** Options for the deterministic memory webhook verifier. */
export type MemoryWebhookVerifierOptions = Readonly<{
  accepted?: boolean;
  idempotencyKey?: string;
  reason?: string;
}>;

/** Deterministic webhook verifier for tests and local fixtures. */
export class MemoryWebhookVerifier implements WebhookVerifierPort {
  readonly #accepted: boolean;
  readonly #idempotencyKey?: string;
  readonly #reason?: string;
  readonly requests: WebhookVerificationRequest[] = [];

  constructor(options: MemoryWebhookVerifierOptions = {}) {
    this.#accepted = options.accepted ?? true;
    this.#idempotencyKey = options.idempotencyKey;
    this.#reason = options.reason;
  }

  /** Record the request and return the configured verification result. */
  verify(request: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    this.requests.push(request);
    return Promise.resolve(Object.freeze({
      ok: this.#accepted,
      idempotencyKey: this.#idempotencyKey,
      reason: this.#accepted ? undefined : this.#reason ?? 'memory-rejected',
    }));
  }
}
