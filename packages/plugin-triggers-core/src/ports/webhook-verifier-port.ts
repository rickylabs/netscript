/** Request shape passed to a webhook verifier adapter. */
export type WebhookVerificationRequest = Readonly<{
  body: Uint8Array;
  headers: Headers;
  secret?: string;
}>;

/** Result returned by a webhook verifier adapter. */
export type WebhookVerificationResult = Readonly<{
  ok: boolean;
  idempotencyKey?: string;
  reason?: string;
}>;

/** Verifies inbound webhook authenticity and extracts provider event ids. */
export interface WebhookVerifierPort {
  /** Verify an inbound webhook request. */
  verify(request: WebhookVerificationRequest): Promise<WebhookVerificationResult>;
}
