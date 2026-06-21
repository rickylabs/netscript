/**
 * Structured errors emitted by the KV OAuth backend.
 *
 * @example
 * ```ts
 * import { KvOAuthError } from "@netscript/auth-kv-oauth/errors";
 *
 * throw new KvOAuthError("refresh_failed", "Refresh token exchange failed.");
 * ```
 *
 * @module
 */

/** Error code emitted by the KV OAuth backend. */
export type KvOAuthErrorCode =
  | 'oauth_cookie_missing'
  | 'oauth_txn_not_found'
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
