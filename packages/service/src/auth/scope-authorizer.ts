/**
 * Scope and role authorizer for NetScript service authz policies.
 *
 * @example
 * ```ts
 * import { createScopeAuthorizer } from "@netscript/service/auth";
 *
 * const authorizer = createScopeAuthorizer({
 *   rules: [{
 *     match: (request) => request.path.startsWith("/api/orders"),
 *     requireScopes: ["orders:read"],
 *   }],
 * });
 * ```
 *
 * @module
 */

import type {
  AuthorizerMatch,
  AuthzDecision,
  AuthzRequest,
  MatchAwareAuthorizerPort,
} from './types.ts';

/** Ordered scope/role rule evaluated by `createScopeAuthorizer()`. */
export interface ScopeAuthorizationRule {
  /** Returns true when this rule applies to the request. */
  readonly match: (request: AuthzRequest) => boolean;
  /** Scopes required when the rule matches. */
  readonly requireScopes?: readonly string[];
  /** Roles required when the rule matches. */
  readonly requireRoles?: readonly string[];
}

/** Options for creating a scope/role authorizer. */
export interface ScopeAuthorizerOptions {
  /** Ordered rules; the first matching rule decides. */
  readonly rules: readonly ScopeAuthorizationRule[];
  /** Allow requests with no matching rule. Defaults to `false` so authz fails closed. */
  readonly denyByDefault?: boolean;
}

/** Creates an ordered-rule authorizer for scopes and roles. */
export function createScopeAuthorizer(options: ScopeAuthorizerOptions): MatchAwareAuthorizerPort {
  const denyByDefault = options.denyByDefault ?? true;

  const authorizeMatch = (request: AuthzRequest): AuthorizerMatch => {
    const rule = options.rules.find((candidate) => candidate.match(request));
    if (!rule) {
      return { matched: false };
    }

    return {
      matched: true,
      decision: authorizeRequirements(
        request,
        rule.requireScopes,
        rule.requireRoles,
      ),
    };
  };

  return {
    authorizeMatch,
    authorize(request: AuthzRequest): AuthzDecision {
      const result = authorizeMatch(request);
      if (!result.matched) {
        return denyByDefault ? deny('authz.no-matching-rule') : { allow: true };
      }
      return result.decision;
    },
  };
}

/** Applies scope and role requirements to one authenticated request. */
export function authorizeRequirements(
  request: AuthzRequest,
  requiredScopes: readonly string[] | undefined,
  requiredRoles: readonly string[] | undefined,
): AuthzDecision {
  const missingScope = firstMissing(requiredScopes, request.principal.scopes);
  if (missingScope) {
    return deny(`authz.missing-scope:${missingScope}`);
  }

  const missingRole = firstMissing(requiredRoles, request.principal.roles);
  if (missingRole) {
    return deny(`authz.missing-role:${missingRole}`);
  }

  return { allow: true };
}

function firstMissing(
  required: readonly string[] | undefined,
  granted: readonly string[],
): string | undefined {
  if (!required?.length) return undefined;
  const grantedSet = new Set(granted);
  return required.find((value) => !grantedSet.has(value));
}

function deny(reason: string): AuthzDecision {
  return { allow: false, reason };
}
