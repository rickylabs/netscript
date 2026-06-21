/**
 * Authentication and authorization contracts for NetScript services.
 *
 * Import this subpath when a service opts into `createService().withAuthn()`,
 * `createService().withAuthz()`, or `defineService({ auth })`.
 *
 * @example
 * ```ts
 * import {
 *   createScopeAuthorizer,
 *   createStaticCredentialAuthenticator,
 * } from "@netscript/service/auth";
 *
 * const authenticator = createStaticCredentialAuthenticator({
 *   credentials: {
 *     "local-token": {
 *       subject: "service:local",
 *       scopes: ["users:read"],
 *       roles: ["service"],
 *     },
 *   },
 * });
 *
 * const authorizer = createScopeAuthorizer({
 *   rules: [{
 *     match: (request) => request.path.startsWith("/api/users"),
 *     requireScopes: ["users:read"],
 *   }],
 * });
 * ```
 *
 * @module
 */

export type { AuthnOptions, AuthzOptions } from './options.ts';
export {
  createScopeAuthorizer,
  type ScopeAuthorizationRule,
  type ScopeAuthorizerOptions,
} from './scope-authorizer.ts';
export {
  createStaticCredentialAuthenticator,
  type StaticCredentialAuthenticatorOptions,
  type StaticCredentialPrincipal,
} from './static-credential-authenticator.ts';
export {
  createTrustedHeaderAuthenticator,
  type TrustedHeaderAuthenticatorOptions,
} from './trusted-header-authenticator.ts';
export type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  AuthorizerPort,
  AuthzDecision,
  AuthzRequest,
  Principal,
} from './types.ts';
