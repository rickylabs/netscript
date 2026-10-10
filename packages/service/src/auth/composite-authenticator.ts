/**
 * Ordered composition of authenticators behind the single `AuthenticatorPort`.
 *
 * @module
 */

import type { AuthenticatorPort, AuthnRequest, AuthnResult } from './types.ts';

const MISSING_CREDENTIAL = 'missing-credential';

/**
 * Creates an authenticator that tries each authenticator in order and returns the first success.
 *
 * Lets one guarded service accept a user session and an internal service credential without a
 * bypass: every request is still authenticated by one of the given ports. When all reject, the
 * first reason other than `missing-credential` is returned, so a presented-but-wrong credential is
 * reported as such. An authenticator that throws stops the chain and fails the request closed.
 * List the cheapest authenticator first; the internal credential check is one digest.
 *
 * @param authenticators - Authenticators tried in order; at least one.
 * @returns An authenticator over the same port.
 * @throws {TypeError} When no authenticator is given.
 *
 * @example
 * ```ts
 * import {
 *   type AuthenticatorPort,
 *   createCompositeAuthenticator,
 *   createInternalCredentialAuthenticator,
 *   loadInstallationSecret,
 * } from '@netscript/service/auth';
 *
 * declare const sessionAuthenticator: AuthenticatorPort;
 * const secret = await loadInstallationSecret();
 * const authenticator = createCompositeAuthenticator([
 *   createInternalCredentialAuthenticator({ secret, service: 'orders' }),
 *   sessionAuthenticator,
 * ]);
 * ```
 */
export function createCompositeAuthenticator(
  authenticators: readonly AuthenticatorPort[],
): AuthenticatorPort {
  if (authenticators.length === 0) {
    throw new TypeError('createCompositeAuthenticator requires at least one authenticator.');
  }
  const ordered = Object.freeze([...authenticators]);

  return {
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      let rejection: string | undefined;
      for (const authenticator of ordered) {
        const result = await authenticator.authenticate(request);
        if (result.ok) return result;
        if (rejection === undefined || rejection === MISSING_CREDENTIAL) {
          rejection = result.reason;
        }
      }
      return { ok: false, reason: rejection ?? MISSING_CREDENTIAL };
    },
  };
}
