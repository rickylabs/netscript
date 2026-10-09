/**
 * Authorization decision for a matched procedure's normalized access policy.
 *
 * @module
 */

import type { InternalCallerPredicate, ProcedureAccessPolicy } from './contract-policy.ts';
import { authorizeRequirements } from '../scope-authorizer.ts';
import type { AuthzDecision, AuthzRequest } from '../types.ts';

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
