/**
 * Authenticator for the per-service internal credential, and the internal-caller identity check.
 *
 * @module
 */

import type { InstallationSecret } from './installation-secret.ts';
import { assertServiceName, deriveInternalCredential } from './internal-credential.ts';
import { createStaticCredentialAuthenticator } from './static-credential-authenticator.ts';
import type { AuthenticatorPort, AuthnRequest, AuthnResult, Principal } from './types.ts';

/** Subject carried by every internal service principal. */
export const INTERNAL_SERVICE_SUBJECT = 'netscript:internal';

const INTERNAL_PRINCIPALS = new WeakSet<Principal>();

/** Options for {@link createInternalCredentialAuthenticator}. */
export interface InternalCredentialAuthenticatorOptions {
  /** Installation secret handle, loaded once at startup. */
  readonly secret: InstallationSecret;
  /** This service's name; only the credential derived for it is accepted. */
  readonly service: string;
  /** Scopes granted to internal callers. Defaults to none. */
  readonly scopes?: readonly string[];
  /** Roles granted to internal callers. Defaults to none. */
  readonly roles?: readonly string[];
}

/**
 * Creates an authenticator that accepts the internal bearer derived for this service.
 *
 * Matching uses the static-credential authenticator's constant-time comparison. The credential is
 * derived once, on first use. Accepted principals are recognized by
 * {@link isInternalServicePrincipal}; compose this with a user-session authenticator through
 * `createCompositeAuthenticator` so one service accepts both.
 *
 * @param options - Installation secret, service name, and grants for internal callers.
 * @returns An authenticator yielding internal service principals.
 * @throws {TypeError} When the service name is invalid.
 *
 * @example
 * ```ts
 * import {
 *   createInternalCredentialAuthenticator,
 *   loadInstallationSecret,
 * } from '@netscript/service/auth';
 *
 * const secret = await loadInstallationSecret();
 * const internal = createInternalCredentialAuthenticator({ secret, service: 'orders' });
 * ```
 */
export function createInternalCredentialAuthenticator(
  options: InternalCredentialAuthenticatorOptions,
): AuthenticatorPort {
  assertServiceName(options.service);
  let delegate: Promise<AuthenticatorPort> | undefined;

  const resolveDelegate = (): Promise<AuthenticatorPort> => {
    delegate ??= deriveInternalCredential(options.secret, options.service).then((credential) =>
      createStaticCredentialAuthenticator({
        scheme: 'bearer',
        credentials: {
          [credential]: {
            subject: INTERNAL_SERVICE_SUBJECT,
            scopes: options.scopes,
            roles: options.roles,
            claims: { audience: options.service },
          },
        },
      })
    ).catch((error: unknown) => {
      delegate = undefined;
      throw error;
    });
    return delegate;
  };

  return {
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      const result = await (await resolveDelegate()).authenticate(request);
      if (!result.ok) return result;

      const principal = Object.freeze({ ...result.principal });
      INTERNAL_PRINCIPALS.add(principal);
      return { ok: true, principal };
    },
  };
}

/**
 * Returns whether a principal was minted by an internal-credential authenticator.
 *
 * Identity is held by reference, not by claims or roles, so no other authenticator — including a
 * user-session adapter that maps provider claims — can produce a principal that passes.
 *
 * @param principal - Principal established for the current request.
 * @returns `true` only for internal service principals.
 *
 * @example
 * ```ts
 * import { isInternalServicePrincipal, type Principal } from '@netscript/service/auth';
 *
 * declare const principal: Principal;
 * if (!isInternalServicePrincipal(principal)) throw new Error('internal callers only');
 * ```
 */
export function isInternalServicePrincipal(principal: Principal): boolean {
  return INTERNAL_PRINCIPALS.has(principal);
}
