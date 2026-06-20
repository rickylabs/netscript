/** Error code emitted by the KV OAuth backend. */
export type KvOAuthErrorCode =
  | 'oauth_cookie_missing'
  | 'oauth_txn_not_found'
  | 'state_mismatch'
  | 'nonce_mismatch'
  | 'id_token_invalid'
  | 'token_exchange_failed'
  | 'refresh_failed'
  | 'refresh_reuse_detected'
  | 'return_to_not_allowed'
  | 'session_not_found'
  | 'configuration_error'
  | 'https_required';

/** Structured error thrown for expected OAuth backend failures. */
export class KvOAuthError extends Error {
  /** Stable machine-readable error code. */
  readonly code: KvOAuthErrorCode;

  /** Original cause, when a lower-level library raised the failure. */
  override readonly cause?: unknown;

  /** Creates a backend error. */
  constructor(code: KvOAuthErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'KvOAuthError';
    this.code = code;
    this.cause = options?.cause;
  }
}
