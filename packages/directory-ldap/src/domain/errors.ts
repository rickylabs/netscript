/**
 * Redacted error classification mapping LDAP/TLS/network/timeout errors to
 * `@netscript/plugin-directory-core` typed errors.
 *
 * Classifies strictly by `ldapts` error name and RFC 4511 / system error code FIRST before
 * consulting fallback message patterns, and never echoes credentials, bind passwords, secret file
 * paths, or distinguished names in messages.
 *
 * @module
 */

import {
  type DirectoryError,
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
  isDirectoryError,
} from '@netscript/plugin-directory-core';

// RFC 4511 LDAP result codes
const LDAP_TIME_LIMIT_EXCEEDED = 3;
const LDAP_AUTH_METHOD_NOT_SUPPORTED = 7;
const LDAP_STRONG_AUTH_REQUIRED = 8;
const LDAP_UNAVAILABLE_CRITICAL_EXTENSION = 12;
const LDAP_CONFIDENTIALITY_REQUIRED = 13;
const LDAP_INAPPROPRIATE_MATCHING = 18;
const LDAP_NO_SUCH_OBJECT = 32;
const LDAP_INVALID_DN_SYNTAX = 34;
const LDAP_INAPPROPRIATE_AUTHENTICATION = 48;
const LDAP_INVALID_CREDENTIALS = 49;
const LDAP_INSUFFICIENT_ACCESS_RIGHTS = 50;
const LDAP_BUSY = 51;
const LDAP_UNAVAILABLE = 52;
const LDAP_UNWILLING_TO_PERFORM = 53;

const TIMEOUT_ERROR_NAMES = new Set([
  'TimeLimitExceededError',
  'TimeoutError',
]);

const ABORT_ERROR_NAMES = new Set([
  'AbortError',
]);

const UNAUTHORIZED_ERROR_NAMES = new Set([
  'InvalidCredentialsError',
  'InsufficientAccessError',
  'InappropriateAuthError',
  'StrongAuthRequiredError',
  'AuthMethodNotSupportedError',
]);

const UNSUPPORTED_ERROR_NAMES = new Set([
  'InappropriateMatchingError',
  'UnavailableCriticalExtensionError',
  'UnwillingToPerformError',
  'TLSNotSupportedError',
]);

const BASE_DN_MISCONFIG_ERROR_NAMES = new Set([
  'NoSuchObjectError',
  'InvalidDNSyntaxError',
]);

const TLS_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
]);

const TIMEOUT_SYSTEM_CODES = new Set([
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
]);

function readErrorCode(err: unknown): number | string | undefined {
  if (typeof err !== 'object' || err === null) {
    return undefined;
  }
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'number' || typeof code === 'string') {
    return code;
  }
  return undefined;
}

function readErrorName(err: unknown): string {
  if (err instanceof Error) {
    return err.name;
  }
  if (
    typeof err === 'object' && err !== null && typeof (err as { name?: unknown }).name === 'string'
  ) {
    return (err as { name: string }).name;
  }
  return '';
}

function readErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return typeof err === 'string' ? err : '';
}

/**
 * Returns `true` when `err` is an internal JavaScript programming error (`TypeError`,
 * `RangeError`, `ReferenceError`, `SyntaxError`) that must propagate rather than be masked as a
 * directory outage.
 */
export function isNonLdapProgramError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    err instanceof RangeError ||
    err instanceof ReferenceError ||
    err instanceof SyntaxError
  );
}

/**
 * Returns `true` when `err` represents an LDAP base-DN misconfiguration (`noSuchObject` / code 32
 * or `invalidDNSyntax` / code 34) that should fail fast without failover.
 */
export function isLdapBaseDnMisconfigurationError(err: unknown): boolean {
  const name = readErrorName(err);
  const code = readErrorCode(err);
  return (
    BASE_DN_MISCONFIG_ERROR_NAMES.has(name) ||
    code === LDAP_NO_SUCH_OBJECT ||
    code === LDAP_INVALID_DN_SYNTAX
  );
}

/**
 * Classifies an unknown LDAP client, TLS, socket, or timeout failure into one of the four
 * canonical `@netscript/plugin-directory-core` typed errors with a redacted message.
 *
 * Classifies by structured `ldapts` error name and numeric/system code first; fallback message
 * patterns only apply when no structured name or code matched.
 *
 * @param err - Caught unknown error.
 * @param directoryName - Adapter name (`DirectoryPort.name`).
 * @param operation - Port operation that failed (`searchUsers`, `getUser`, `memberOfAny`, etc.).
 * @param timeoutMs - Optional active timeout budget for `DirectoryTimeout` metadata.
 * @returns Classified {@link DirectoryError} instance with no credentials or DNs in its message.
 */
export function mapLdapError(
  err: unknown,
  directoryName: string,
  operation: string,
  timeoutMs?: number,
): DirectoryError {
  if (isDirectoryError(err)) {
    return err;
  }

  const name = readErrorName(err);
  const code = readErrorCode(err);
  const message = readErrorMessage(err);

  // 1. Structured name/code classification (takes precedence over raw server message text).
  if (
    UNAUTHORIZED_ERROR_NAMES.has(name) ||
    code === LDAP_INVALID_CREDENTIALS ||
    code === LDAP_INSUFFICIENT_ACCESS_RIGHTS ||
    code === LDAP_INAPPROPRIATE_AUTHENTICATION ||
    code === LDAP_STRONG_AUTH_REQUIRED ||
    code === LDAP_AUTH_METHOD_NOT_SUPPORTED
  ) {
    const reason = code === LDAP_INSUFFICIENT_ACCESS_RIGHTS || name === 'InsufficientAccessError'
      ? 'Directory service account lacks read permission for this query.'
      : 'Directory rejected service-account bind authentication.';
    return new DirectoryUnauthorized(directoryName, operation, reason);
  }

  if (
    UNSUPPORTED_ERROR_NAMES.has(name) ||
    code === LDAP_INAPPROPRIATE_MATCHING ||
    code === LDAP_UNAVAILABLE_CRITICAL_EXTENSION ||
    code === LDAP_UNWILLING_TO_PERFORM
  ) {
    const reason = name === 'TLSNotSupportedError'
      ? 'Directory server does not support StartTLS negotiation.'
      : 'Directory server does not support the requested matching rule or control.';
    return new DirectoryUnsupported(directoryName, operation, reason);
  }

  if (isLdapBaseDnMisconfigurationError(err)) {
    return new DirectoryUnavailable(
      directoryName,
      operation,
      'Configured LDAP search base DN does not exist or has invalid syntax.',
    );
  }

  if (
    TIMEOUT_ERROR_NAMES.has(name) ||
    code === LDAP_TIME_LIMIT_EXCEEDED ||
    (typeof code === 'string' && TIMEOUT_SYSTEM_CODES.has(code))
  ) {
    return new DirectoryTimeout(
      directoryName,
      operation,
      'LDAP directory operation exceeded its timeout budget.',
      timeoutMs !== undefined ? { timeoutMs } : undefined,
    );
  }

  if (ABORT_ERROR_NAMES.has(name) || code === 'ABORT_ERR') {
    return new DirectoryUnavailable(
      directoryName,
      operation,
      'Directory operation was aborted.',
    );
  }

  if (
    code === LDAP_CONFIDENTIALITY_REQUIRED ||
    name === 'ConfidentialityRequiredError' ||
    (typeof code === 'string' && TLS_ERROR_CODES.has(code))
  ) {
    return new DirectoryUnavailable(
      directoryName,
      operation,
      'TLS handshake or certificate verification failed.',
    );
  }

  if (code === LDAP_BUSY || code === LDAP_UNAVAILABLE) {
    return new DirectoryUnavailable(
      directoryName,
      operation,
      'Directory server reported busy or unavailable status.',
    );
  }

  // 2. Fallback message classification only when no structured LDAP error name/code matched.
  if (typeof code !== 'number') {
    if (/\b(?:certificate|tls|ssl|handshake|altnames?)\b/i.test(message)) {
      return new DirectoryUnavailable(
        directoryName,
        operation,
        'TLS handshake or certificate verification failed.',
      );
    }
    if (/\b(?:timed?\s*out|timeout)\b/i.test(message)) {
      return new DirectoryTimeout(
        directoryName,
        operation,
        'LDAP directory operation exceeded its timeout budget.',
        timeoutMs !== undefined ? { timeoutMs } : undefined,
      );
    }
  }

  return new DirectoryUnavailable(
    directoryName,
    operation,
    'Directory server connection or protocol operation failed.',
  );
}
