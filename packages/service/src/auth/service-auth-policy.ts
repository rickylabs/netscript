/**
 * Validation of explicit service authentication postures.
 *
 * @module
 */

import type { ServiceAuthPolicy } from './options.ts';

const POLICY_ERROR =
  'Service auth requires { authn: { authenticator }, authz?: { authorizer } } or { public: true, reason: "nonblank explanation" }; do not combine guarded and public fields.';

/**
 * Rejects absent, malformed or ambiguous service authentication postures.
 *
 * Native authentication and authorization options retain their identity and
 * semantics. This assertion validates the posture and required callable ports;
 * it does not authenticate a request or normalize anonymous-path policy.
 *
 * @param value - The caller's explicit service authentication policy.
 * @throws {TypeError} When the posture or required native ports are invalid.
 * @example
 * ```ts
 * import { assertServiceAuthPolicy } from '@netscript/service/auth';
 *
 * const policy: unknown = { public: true, reason: 'Public status service' };
 * assertServiceAuthPolicy(policy);
 * ```
 */
export function assertServiceAuthPolicy(value: unknown): asserts value is ServiceAuthPolicy {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(POLICY_ERROR);
  }
  if ('public' in value) {
    if (
      value.public !== true || !('reason' in value) ||
      typeof value.reason !== 'string' || value.reason.trim().length === 0 ||
      'authn' in value || 'authz' in value
    ) {
      throw new TypeError(POLICY_ERROR);
    }
    return;
  }
  if ('reason' in value || !('authn' in value)) {
    throw new TypeError(POLICY_ERROR);
  }
  const authn = value.authn;
  if (
    typeof authn !== 'object' || authn === null || Array.isArray(authn) ||
    !('authenticator' in authn)
  ) {
    throw new TypeError(POLICY_ERROR);
  }
  const authenticator = authn.authenticator;
  if (
    typeof authenticator !== 'object' || authenticator === null ||
    Array.isArray(authenticator) || !('authenticate' in authenticator) ||
    typeof authenticator.authenticate !== 'function'
  ) {
    throw new TypeError(POLICY_ERROR);
  }
  if ('authz' in value) {
    const authz = value.authz;
    if (
      typeof authz !== 'object' || authz === null || Array.isArray(authz) ||
      !('authorizer' in authz)
    ) {
      throw new TypeError(POLICY_ERROR);
    }
    const authorizer = authz.authorizer;
    if (
      typeof authorizer !== 'object' || authorizer === null || Array.isArray(authorizer) ||
      !('authorize' in authorizer) || typeof authorizer.authorize !== 'function'
    ) {
      throw new TypeError(POLICY_ERROR);
    }
  }
}
