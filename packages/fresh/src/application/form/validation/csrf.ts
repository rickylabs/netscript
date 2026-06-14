/**
 * CSRF helpers for the framework-owned forms pipeline.
 *
 * This implements RFC 15's baseline double-submit-cookie approach. The
 * implementation is intentionally explicit and easy to replace after a future
 * security review.
 *
 * @module
 */

import { getCookies, setCookie } from '@std/http';

/** Cookie used to persist the current CSRF token between GET and POST. */
export const CSRF_COOKIE_NAME = 'ns_form_csrf';

/** Hidden input field used to submit the CSRF token with the form payload. */
export const CSRF_FIELD_NAME = '__csrf__';

const CSRF_COOKIE_PATH = '/';
const CSRF_SAME_SITE = 'Lax';

/** Generate a new CSRF token for a rendered form. */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/** Read the current CSRF token from a request cookie header. */
export function readCsrfToken(request: Request): string | undefined {
  return getCookies(request.headers)[CSRF_COOKIE_NAME];
}

/** Verify that the submitted token matches the cookie token. */
export function verifyCsrfToken(
  cookieToken: string | undefined,
  formToken: string | undefined,
): boolean {
  return typeof cookieToken === 'string' &&
    cookieToken.length > 0 &&
    typeof formToken === 'string' &&
    formToken.length > 0 &&
    constantTimeEqual(cookieToken, formToken);
}

/**
 * Set the CSRF cookie on response headers.
 *
 * `requestUrl` is optional so tests can exercise secure-cookie behavior
 * deterministically without requiring a full request context.
 */
export function setCsrfCookie(headers: Headers, token: string, requestUrl?: URL): void {
  setCookie(headers, {
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: CSRF_SAME_SITE,
    path: CSRF_COOKIE_PATH,
    secure: requestUrl?.protocol === 'https:',
  });
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return mismatch === 0;
}
