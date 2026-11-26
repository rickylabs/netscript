/**
 * Authorization decision for a matched procedure's normalized access policy.
 *
 * @module
 */

import type {
  InternalCallerPredicate,
  ProcedureAccessPolicy,
  ProcedurePolicyResolver,
} from './contract-policy.ts';
import { authorizeRequirements } from '../scope-authorizer.ts';
import type { AuthorizerPort, AuthzDecision, AuthzRequest } from '../types.ts';

/** Service-local bound authorizer state associated with one `bind()` resolver instance. */
export interface BoundContractAuthorizerEntry {
  /** Immutable authorizer closing strictly over the bound service's `ProcedurePolicyResolver`. */
  readonly authorizer: AuthorizerPort;
  /** Configured internal-caller predicate owned by the bound contract authorizer. */
  readonly isInternalCaller: InternalCallerPredicate;
}

const BOUND_CONTRACT_AUTHORIZERS = new WeakMap<
  ProcedurePolicyResolver,
  BoundContractAuthorizerEntry
>();

/** Associates a service-local authorizer with the `ProcedurePolicyResolver` returned by `bind()`. */
export function registerBoundContractAuthorizer(
  resolver: ProcedurePolicyResolver,
  entry: BoundContractAuthorizerEntry,
): void {
  BOUND_CONTRACT_AUTHORIZERS.set(resolver, entry);
}

/** Looks up the immutable service-local authorizer created by a first-party contract `bind()`. */
export function getBoundContractAuthorizer(
  resolver: ProcedurePolicyResolver | undefined,
): BoundContractAuthorizerEntry | undefined {
  return resolver ? BOUND_CONTRACT_AUTHORIZERS.get(resolver) : undefined;
}

/** Applies audience, scope, and role requirements declared by a procedure contract. */
export function authorizeProcedurePolicy(
  request: AuthzRequest,
  policy: ProcedureAccessPolicy,
  isInternalCaller: InternalCallerPredicate,
): AuthzDecision {
  if (policy.authentication === 'none') {
    return { allow: true };
  }
  if (policy.audience === 'internal' && !isInternalCaller(request.principal)) {
    return { allow: false, reason: 'authz.internal-audience' };
  }
  return authorizeRequirements(request, policy.requiredScopes, policy.requiredRoles);
}
