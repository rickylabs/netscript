import type { AuthnRequest } from '@netscript/service/auth';

/**
 * Read one unambiguous bearer credential without consulting cookies.
 *
 * @param request Request carrying the authorization header.
 * @returns The opaque credential, or undefined for missing or malformed input.
 * @example
 * ```ts
 * const token = readBearerCredential({ header: () => 'Bearer example' });
 * console.assert(token === 'example');
 * ```
 */
export function readBearerCredential(request: Pick<AuthnRequest, 'header'>): string | undefined {
  return /^Bearer[\t ]+([^\s,]+)$/i.exec(request.header('authorization') ?? '')?.[1];
}
