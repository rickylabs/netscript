import type {
  WebhookVerificationRequest,
  WebhookVerificationResult,
  WebhookVerifierPort,
} from '../ports/mod.ts';

/** Options for the HMAC SHA-256 webhook verifier. */
export type HmacSha256WebhookVerifierOptions = Readonly<{
  secret?: string;
  signatureHeader?: string;
  idempotencyHeader?: string;
}>;

/** Verifies webhook signatures using HMAC SHA-256. */
export class HmacSha256WebhookVerifier implements WebhookVerifierPort {
  readonly #secret?: string;
  readonly #signatureHeader: string;
  readonly #idempotencyHeader: string;

  /** Create a verifier with optional secret and header names. */
  constructor(options: HmacSha256WebhookVerifierOptions = {}) {
    this.#secret = options.secret;
    this.#signatureHeader = (options.signatureHeader ?? 'x-netscript-signature').toLowerCase();
    this.#idempotencyHeader = (options.idempotencyHeader ?? 'x-idempotency-key').toLowerCase();
  }

  /** Verify the request signature and surface an idempotency key when present. */
  async verify(request: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    const secret = request.secret ?? this.#secret;
    if (!secret) {
      return verificationFailure('missing-secret');
    }

    const signature = request.headers.get(this.#signatureHeader);
    if (!signature) {
      return verificationFailure('missing-signature');
    }

    const expected = await signHex(request.body, secret);
    if (!constantTimeEqual(normalizeSignature(signature), expected)) {
      return verificationFailure('invalid-signature');
    }

    return Object.freeze({
      ok: true,
      idempotencyKey: request.headers.get(this.#idempotencyHeader) ?? undefined,
    });
  }
}

function verificationFailure(reason: string): WebhookVerificationResult {
  return Object.freeze({ ok: false, reason });
}

async function signHex(body: Uint8Array, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const data = new Uint8Array(body.byteLength);
  data.set(body);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return toHex(new Uint8Array(signature));
}

function normalizeSignature(signature: string): string {
  return signature.trim().replace(/^sha256=/i, '').toLowerCase();
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return diff === 0;
}
