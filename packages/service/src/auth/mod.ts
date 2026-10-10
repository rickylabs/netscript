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

export type { ServiceEnv, ServiceVariables } from './hono-context.ts';
export type {
  AuthnOptions,
  AuthzOptions,
  ContractAuthorizerOptions,
  ContractAuthorizerRawRoute,
  ContractOverlayAuthorizerOptions,
  ServiceAuthPolicy,
  ServiceGuardedAuthPolicy,
  ServicePublicAuthPolicy,
} from './options.ts';
export { assertServiceAuthPolicy } from './service-auth-policy.ts';
export type {
  ContractAuthorizerFactory,
  ContractPolicyAuthorizerPort,
  ContractPolicyBindingOptions,
  ContractPolicyContract,
  ContractPolicyRpcRouteAlias,
  InternalCallerPredicate,
  ProcedureAccessPolicy,
  ProcedurePolicyRequest,
  ProcedurePolicyResolution,
  ProcedurePolicyResolver,
} from './contract/contract-policy.ts';
export { createContractAuthorizer } from './contract/contract-authorizer.ts';
export { createContractOverlayAuthorizer } from './contract/contract-overlay-authorizer.ts';
export { createCompositeAuthenticator } from './composite-authenticator.ts';
export {
  createInstallationSecret,
  INSTALLATION_SECRET_FILE_ENV,
  type InstallationSecret,
  loadInstallationSecret,
  type LoadInstallationSecretOptions,
} from './internal-credential/installation-secret.ts';
export { deriveInternalCredential } from './internal-credential/internal-credential.ts';
export {
  createInternalCredentialAuthenticator,
  INTERNAL_SERVICE_SUBJECT,
  type InternalCredentialAuthenticatorOptions,
  isInternalServicePrincipal,
} from './internal-credential/internal-credential-authenticator.ts';
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
  AuthorizerMatch,
  AuthorizerPort,
  AuthzDecision,
  AuthzRequest,
  MatchAwareAuthorizerPort,
  Principal,
} from './types.ts';
