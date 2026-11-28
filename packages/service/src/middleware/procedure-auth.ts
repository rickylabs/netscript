/**
 * Transport-neutral oRPC procedure authentication and authorization stage.
 *
 * Enforces contract-derived policies identically across HTTP, `createRouterClient`,
 * and bare `call()`, while preserving single-authn on HTTP via scoped
 * {@link VerifiedPrincipalRecord} brands and closing cookie/refresh-token burn
 * hazards *before* calling `AuthenticatorPort.authenticate()`.
 *
 * @module
 */

import { type AnyProcedure, ORPCError } from '@orpc/server';
import type { Logger } from '@netscript/logger';
import {
  isHttpAuthnExemptForService,
  isHttpAuthzVerifiedForService,
} from '../auth/auth-middleware.ts';
import type {
  InternalCallerPredicate,
  ProcedureAccessPolicy,
} from '../auth/contract/contract-policy.ts';
import { isProcedureAuthorizerPort } from '../auth/contract/procedure-policy-decision.ts';
import { isInternalServicePrincipal } from '../auth/internal-credential/internal-credential-authenticator.ts';
import { authorizeRequirements } from '../auth/scope-authorizer.ts';
import type {
  AuthenticatorPort,
  AuthnResult,
  AuthnSideEffects,
  MatchAwareAuthorizerPort,
  Principal,
  ProcedureAuthorizerPort,
} from '../auth/types.ts';
import {
  brandVerifiedPrincipal,
  createRequestPrincipalScope,
  isVerifiedPrincipalTrusted,
  type RequestPrincipalScope,
  type VerifiedPrincipalRecord,
} from '../runtime/verified-principal.ts';
import {
  logInProcessAuthDecision,
  mapUnauthorizedReason,
  toRequestlessAuthnRequest,
} from './procedure-auth-audit.ts';

/** Bound contract-policy configuration passed into the procedure auth stage. */
export interface ProcedureContractAuthConfig {
  /** `'strict'` for `createContractAuthorizer`, `'overlay'` for `createContractOverlayAuthorizer`. */
  readonly mode: 'strict' | 'overlay';
  /** Compiled contract access policies keyed by canonical dot-joined procedure path. */
  readonly policiesByPath: ReadonlyMap<string, ProcedureAccessPolicy | undefined>;
  /** Optional fallback authorizer for unmarked contract procedures. */
  readonly fallback?: MatchAwareAuthorizerPort | ProcedureAuthorizerPort;
  /** Predicate deciding `audience: 'internal'` admission. */
  readonly isInternalCaller: InternalCallerPredicate;
  /** True when `isInternalCaller` is NetScript's default `isInternalServicePrincipal`. */
  readonly usesDefaultInternalPredicate: boolean;
}

/** Procedure-level authentication and authorization configuration for one service. */
export interface ProcedureAuthConfig {
  /** Unique symbol identifying this service instance. */
  readonly serviceId: symbol;
  /** Service name used in `orpc://<serviceName>/<procedure>` URIs and audience checks. */
  readonly serviceName: string;
  /** Configured authenticator port, when `withAuthn()` was registered. */
  readonly authenticator?: AuthenticatorPort;
  /** Opt-in non-internal delegation flag from `AuthnOptions.trustSharedPrincipal`. */
  readonly trustSharedPrincipal?: boolean;
  /** Explicit verifier allowlist from `AuthnOptions.trustedVerifiers`. */
  readonly trustedVerifiers?: ReadonlySet<AuthenticatorPort>;
  /** Maximum ambient trust TTL ceiling in milliseconds. */
  readonly maxTrustTtlMs?: number;
  /** Bound contract-policy metadata, when `createContractAuthorizer` / overlay was installed. */
  readonly contractAuth?: ProcedureContractAuthConfig;
  /** True when `withAuthz()` was installed with a non-contract authorizer (for example `createScopeAuthorizer`). */
  readonly hasNonContractAuthz?: boolean;
  /** Clock returning epoch milliseconds; defaults to `Date.now`. */
  readonly now?: () => number;
}

/** Per-invocation inputs for enforcing procedure-level authn and authz. */
export interface ProcedureAuthInvocation {
  /** Target oRPC leaf procedure definition. */
  readonly procedure: AnyProcedure;
  /** Canonical oRPC procedure path segments. */
  readonly path: readonly string[];
  /** Candidate principal supplied on oRPC context (verified strictly against private WeakMap). */
  readonly candidatePrincipal?: Principal;
  /** Request headers supplied on oRPC context (`Headers` or plain record). */
  readonly headers?: Readonly<Record<string, string>> | Headers;
  /** Optional sinks for non-HTTP authenticator side effects (`Set-Cookie`, `responseHeaders`). */
  readonly authnSideEffects?: AuthnSideEffects;
  /** Raw HTTP request when invoked through the service HTTP edge. */
  readonly httpRequest?: Request;
  /** Stable Hono request context identity (preserved across `withBodyLimit` `Request` replacement). */
  readonly httpContext?: object;
  /** Request-scoped logger, when available. */
  readonly logger?: Logger;
  /** Unified request correlation ID for structured audit logs. */
  readonly requestId: string;
  /** Cooperative cancellation signal for the invocation. */
  readonly signal?: AbortSignal;
}

/** Result of a successful procedure authn/authz pass. */
export interface ProcedureAuthOutcome {
  /** Verified principal for the procedure handler (undefined for public procedures). */
  readonly principal?: Principal;
  /** Procedure-owned request scope to be ended in `finally` when authn ran in-process. */
  readonly ownedScope?: RequestPrincipalScope;
}

/**
 * Enforces procedure-level authentication and authorization before Zod input
 * validation and `withProcedureRateLimit()`.
 */
export async function enforceProcedureAuth(
  config: ProcedureAuthConfig,
  invocation: ProcedureAuthInvocation,
): Promise<ProcedureAuthOutcome> {
  const { contractAuth, authenticator, hasNonContractAuthz } = config;
  // Public `{ auth: { public: true } }` services install neither withAuthn() nor withAuthz().
  if (!authenticator && !contractAuth && !hasNonContractAuthz) {
    return { principal: invocation.candidatePrincipal };
  }

  const procedureKey = invocation.path.join('.');
  const policyKnownInContract = contractAuth?.policiesByPath.has(procedureKey) === true;
  const policy = policyKnownInContract ? contractAuth?.policiesByPath.get(procedureKey) : undefined;
  if (policy?.authentication === 'none') {
    return { principal: undefined };
  }

  const httpEdgeKey = invocation.httpContext ?? invocation.httpRequest;
  const httpAuthzVerified = httpEdgeKey !== undefined &&
    isHttpAuthzVerifiedForService(httpEdgeKey, config.serviceId);
  const httpAuthnExempt = httpEdgeKey !== undefined &&
    isHttpAuthnExemptForService(httpEdgeKey, config.serviceId);

  // Preserve exact HTTP behavior for path-governed non-contract services, overlay unmarked routes,
  // HTTP-exempted authn-only routes, and deprecated alias leaves already verified by HTTP edge.
  if (httpAuthnExempt && !contractAuth && !hasNonContractAuthz) {
    return { principal: invocation.candidatePrincipal };
  }
  if (httpAuthzVerified && !contractAuth) {
    return { principal: invocation.candidatePrincipal };
  }
  if (httpAuthzVerified && contractAuth?.mode === 'overlay' && policy === undefined) {
    return { principal: invocation.candidatePrincipal };
  }
  if (httpAuthzVerified && contractAuth && !policyKnownInContract) {
    return { principal: invocation.candidatePrincipal };
  }

  const nowMs = (config.now ?? Date.now)();
  const usesDefaultInternalPredicate = contractAuth?.usesDefaultInternalPredicate ?? true;
  const auditCtx = {
    logger: invocation.logger,
    requestId: invocation.requestId,
    serviceName: config.serviceName,
    procedureKey,
  };

  // 1. Authentication (honoring valid scoped VerifiedPrincipalRecord for single-authn on HTTP).
  let principal: Principal;
  let trustedRecord: VerifiedPrincipalRecord | undefined;
  let ownedScope: RequestPrincipalScope | undefined;

  const trustCheck = isVerifiedPrincipalTrusted(invocation.candidatePrincipal, {
    serviceId: config.serviceId,
    serviceName: config.serviceName,
    nowMs,
    requireInternalAudience: policy?.audience === 'internal',
    usesDefaultInternalPredicate,
    trustSharedPrincipal: config.trustSharedPrincipal,
    trustedVerifiers: config.trustedVerifiers,
  });

  if (trustCheck.trusted && invocation.candidatePrincipal) {
    principal = invocation.candidatePrincipal;
    trustedRecord = trustCheck.record;
  } else {
    if (!authenticator) {
      await logInProcessAuthDecision(auditCtx, {
        stage: 'authn',
        decision: 'deny',
        reason: 'missing-principal',
      });
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: 'missing-principal',
        data: { reason: 'missing_token' },
        defined: hasContractError(invocation.procedure, 'UNAUTHORIZED'),
      });
    }

    const authnRequest = toRequestlessAuthnRequest(
      invocation.headers,
      config.serviceName,
      procedureKey,
    );

    // Pre-authenticate() cookie & capability sink validation: fail closed BEFORE calling
    // `authenticate()` so refresh-on-read authenticators never burn single-use refresh tokens.
    const hasIncomingCookie = Boolean(authnRequest.header('cookie')?.trim());
    if (
      (authenticator.mayEmitSetCookies === true || hasIncomingCookie) &&
      !invocation.authnSideEffects?.onSetCookies
    ) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        status: 500,
        message: 'authn.set-cookies-sink-required',
      });
    }
    if (
      authenticator.mayEmitResponseHeaders === true &&
      !invocation.authnSideEffects?.onResponseHeaders
    ) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        status: 500,
        message: 'authn.response-headers-sink-required',
      });
    }

    let authnResult: AuthnResult;
    try {
      authnResult = await authenticator.authenticate(authnRequest);
    } catch {
      await logInProcessAuthDecision(auditCtx, {
        stage: 'authn',
        decision: 'deny',
        reason: 'authn.error',
      });
      throw new ORPCError('SERVICE_UNAVAILABLE', {
        status: 503,
        message: 'Authentication service unavailable',
        data: { reason: 'authn.error' },
        defined: hasContractError(invocation.procedure, 'SERVICE_UNAVAILABLE'),
      });
    }

    if (!authnResult.ok) {
      await logInProcessAuthDecision(auditCtx, {
        stage: 'authn',
        decision: 'deny',
        reason: authnResult.reason,
      });
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: authnResult.reason,
        data: { reason: mapUnauthorizedReason(authnResult.reason) },
        defined: hasContractError(invocation.procedure, 'UNAUTHORIZED'),
      });
    }

    // Atomic post-authenticate() validation: verify BOTH required sinks BEFORE invoking either.
    const hasSetCookies = Boolean(authnResult.setCookies && authnResult.setCookies.length > 0);
    const hasResponseHeaders = Boolean(
      authnResult.responseHeaders && Object.keys(authnResult.responseHeaders).length > 0,
    );
    if (hasSetCookies && !invocation.authnSideEffects?.onSetCookies) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        status: 500,
        message: 'authn.set-cookies-sink-required',
      });
    }
    if (hasResponseHeaders && !invocation.authnSideEffects?.onResponseHeaders) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        status: 500,
        message: 'authn.response-headers-sink-required',
      });
    }
    if (hasSetCookies && authnResult.setCookies) {
      invocation.authnSideEffects?.onSetCookies?.(authnResult.setCookies);
    }
    if (hasResponseHeaders && authnResult.responseHeaders) {
      invocation.authnSideEffects?.onResponseHeaders?.(authnResult.responseHeaders);
    }

    ownedScope = createRequestPrincipalScope(invocation.signal);
    try {
      trustedRecord = brandVerifiedPrincipal(authnResult.principal, {
        serviceId: config.serviceId,
        serviceName: config.serviceName,
        authenticator,
        verifiedAtMs: nowMs,
        maxTrustTtlMs: config.maxTrustTtlMs,
        requestScope: ownedScope,
      });
    } catch {
      ownedScope.end();
      await logInProcessAuthDecision(auditCtx, {
        stage: 'authn',
        decision: 'deny',
        reason: 'authn.error',
      });
      throw new ORPCError('SERVICE_UNAVAILABLE', {
        status: 503,
        message: 'Authentication service unavailable',
        data: { reason: 'authn.error' },
        defined: hasContractError(invocation.procedure, 'SERVICE_UNAVAILABLE'),
      });
    }

    principal = authnResult.principal;
    await logInProcessAuthDecision(auditCtx, {
      stage: 'authn',
      decision: 'allow',
      principal,
    });
  }

  // 2. Authorization
  try {
    if (!contractAuth) {
      if (hasNonContractAuthz) {
        await logInProcessAuthDecision(auditCtx, {
          stage: 'authz',
          decision: 'deny',
          principal,
          reason: 'authz.path-authz-unsupported',
        });
        throw new ORPCError('FORBIDDEN', {
          status: 403,
          message: 'authz.path-authz-unsupported',
          data: {},
          defined: hasContractError(invocation.procedure, 'FORBIDDEN'),
        });
      }
      return { principal, ownedScope };
    }

    if (policy === undefined) {
      // Unmarked procedure: if HTTP edge already authorized via a path-based fallback, allow.
      if (httpAuthzVerified && !isProcedureAuthorizerPort(contractAuth.fallback)) {
        return { principal, ownedScope };
      }

      if (
        policyKnownInContract &&
        contractAuth.mode === 'strict' &&
        isProcedureAuthorizerPort(contractAuth.fallback)
      ) {
        const match = await contractAuth.fallback.authorizeProcedure({
          principal,
          procedurePath: invocation.path,
        });
        if (match.matched && match.decision.allow) {
          if (!httpAuthzVerified) {
            await logInProcessAuthDecision(auditCtx, {
              stage: 'authz',
              decision: 'allow',
              principal,
            });
          }
          return { principal, ownedScope };
        }
        const reason = match.matched && !match.decision.allow
          ? match.decision.reason
          : 'authz.no-matching-rule';
        if (!httpAuthzVerified) {
          await logInProcessAuthDecision(auditCtx, {
            stage: 'authz',
            decision: 'deny',
            principal,
            reason,
          });
        }
        throw new ORPCError('FORBIDDEN', {
          status: 403,
          message: reason,
          data: {},
          defined: hasContractError(invocation.procedure, 'FORBIDDEN'),
        });
      }

      if (!httpAuthzVerified) {
        await logInProcessAuthDecision(auditCtx, {
          stage: 'authz',
          decision: 'deny',
          principal,
          reason: 'authz.no-matching-rule',
        });
      }
      throw new ORPCError('FORBIDDEN', {
        status: 403,
        message: 'authz.no-matching-rule',
        data: {},
        defined: hasContractError(invocation.procedure, 'FORBIDDEN'),
      });
    }

    if (policy.audience === 'internal') {
      const internalAllowed = contractAuth.usesDefaultInternalPredicate
        ? isInternalServicePrincipal(principal) &&
          trustedRecord?.internalAudience === config.serviceName &&
          principal.claims.audience === config.serviceName
        : contractAuth.isInternalCaller(principal);

      if (!internalAllowed) {
        if (!httpAuthzVerified) {
          await logInProcessAuthDecision(auditCtx, {
            stage: 'authz',
            decision: 'deny',
            principal,
            reason: 'authz.internal-audience',
          });
        }
        throw new ORPCError('FORBIDDEN', {
          status: 403,
          message: 'authz.internal-audience',
          data: {},
          defined: hasContractError(invocation.procedure, 'FORBIDDEN'),
        });
      }
    }

    const decision = authorizeRequirements(
      {
        principal,
        method: 'IN_PROCESS',
        path: `orpc://${config.serviceName}/${procedureKey}`,
      },
      policy.requiredScopes,
      policy.requiredRoles,
    );
    if (!decision.allow) {
      if (!httpAuthzVerified) {
        await logInProcessAuthDecision(auditCtx, {
          stage: 'authz',
          decision: 'deny',
          principal,
          reason: decision.reason,
        });
      }
      throw new ORPCError('FORBIDDEN', {
        status: 403,
        message: decision.reason,
        data: {},
        defined: hasContractError(invocation.procedure, 'FORBIDDEN'),
      });
    }

    if (!httpAuthzVerified) {
      await logInProcessAuthDecision(auditCtx, {
        stage: 'authz',
        decision: 'allow',
        principal,
      });
    }
    return { principal, ownedScope };
  } catch (error) {
    ownedScope?.end();
    throw error;
  }
}

function hasContractError(procedure: AnyProcedure, code: string): boolean {
  const errorMap = procedure['~orpc'].errorMap;
  return typeof errorMap === 'object' && errorMap !== null && Object.hasOwn(errorMap, code);
}
