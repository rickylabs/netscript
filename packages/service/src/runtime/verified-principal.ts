/**
 * Scoped, request-bound, audience-checked, finite-expiry `VerifiedPrincipalRecord`
 * branding and deep-freeze helpers for NetScript service authentication.
 *
 * Prevents:
 * - Cross-service & expired-`exp` principal replay across `call()` / `createRouterClient`
 * - Cross-service `audience: 'internal'` leakage (`orders` -> `billing`)
 * - Post-request / post-flush / post-revocation closure replay
 * - Shared `Principal` reference brand overwrite & closure retention
 * - `NaN` / non-finite `exp` fail-open comparisons
 * - Shallow-frozen `claims.audience` tampering
 *
 * @module
 */

import { isInternalServicePrincipal } from '../auth/internal-credential/internal-credential-authenticator.ts';
import { deepFreezeInPlace } from '../auth/static-credential-authenticator.ts';
import type { AuthenticatorPort, Principal } from '../auth/types.ts';

/** Default maximum trust ceiling (5 minutes) for scoped verified principal brands. */
export const DEFAULT_MAX_TRUST_TTL_MS = 300_000;

/** Lifetime boundary tied to one originating HTTP or in-process request. */
export interface RequestPrincipalScope {
  /** Aborted when the originating request ends or its parent signal aborts. */
  readonly signal: AbortSignal;
  /** Returns `true` strictly while the originating request is still live. */
  readonly active: () => boolean;
  /** Registers a cleanup callback invoked immediately when `end()` runs. */
  readonly onEnd: (listener: () => void) => void;
  /** Ends the request scope idempotently and releases all registered listeners. */
  readonly end: () => void;
}

/** Module-private trust record stamped exclusively by framework authentication boundaries. */
export interface VerifiedPrincipalRecord {
  /** Unique symbol identifying the service instance that verified this principal. */
  readonly serviceId: symbol;
  /** Service name bound to this verification for internal-audience checks. */
  readonly serviceName: string;
  /** Authenticator port instance that verified this principal. */
  readonly authenticator: AuthenticatorPort;
  /** Epoch milliseconds when the principal was authenticated. */
  readonly verifiedAtMs: number;
  /** Finite expiry ceiling in epoch milliseconds (`NaN` if `claims.exp` was invalid). */
  readonly expiresAtMs: number;
  /** Originating request lifetime scope; ending it invalidates and deletes this brand. */
  readonly requestScope: RequestPrincipalScope;
  /** Optional synchronous in-process revocation hook. */
  readonly isRevoked?: () => boolean;
  /** Private immutable audience captured at brand minting for internal service principals. */
  readonly internalAudience?: string;
}

/** Inputs required to brand an authenticated principal for one live request scope. */
export interface BrandVerifiedPrincipalOptions {
  /** Unique symbol identifying the authenticating service instance. */
  readonly serviceId: symbol;
  /** Name of the authenticating service. */
  readonly serviceName: string;
  /** Authenticator that produced the principal. */
  readonly authenticator: AuthenticatorPort;
  /** Epoch milliseconds when authentication succeeded. */
  readonly verifiedAtMs: number;
  /** Maximum ambient trust TTL in milliseconds (defaults to {@link DEFAULT_MAX_TRUST_TTL_MS}). */
  readonly maxTrustTtlMs?: number;
  /** Request lifetime scope; `end()` deletes the brand from the private WeakMap. */
  readonly requestScope: RequestPrincipalScope;
  /** Optional synchronous in-process revocation hook. */
  readonly isRevoked?: () => boolean;
}

/** Inputs required to evaluate whether a `context.principal` is trusted by a service pipeline. */
export interface VerifiedPrincipalTrustCheck {
  /** Current service instance symbol. */
  readonly serviceId: symbol;
  /** Current service name (matched against `record.internalAudience` for internal procedures). */
  readonly serviceName: string;
  /** Current epoch milliseconds. */
  readonly nowMs: number;
  /** Whether the target procedure requires `audience: 'internal'`. */
  readonly requireInternalAudience: boolean;
  /** Whether the service uses NetScript's default internal-caller predicate (`isInternalServicePrincipal`). */
  readonly usesDefaultInternalPredicate: boolean;
  /** Opt-in flag allowing non-internal delegation from explicitly trusted verifier instances. */
  readonly trustSharedPrincipal?: boolean;
  /** Explicit set of verifier instances trusted when `trustSharedPrincipal === true`. */
  readonly trustedVerifiers?: ReadonlySet<AuthenticatorPort>;
}

/** Result of evaluating a principal against the module-private brand registry. */
export type VerifiedPrincipalTrustResult =
  | { readonly trusted: true; readonly record: VerifiedPrincipalRecord }
  | { readonly trusted: false };

const VERIFIED_PRINCIPALS = new WeakMap<Principal, VerifiedPrincipalRecord>();

/**
 * Creates a request-bound lifetime scope whose `end()` aborts its signal, marks
 * `active() === false`, and invokes registered `onEnd` listeners once.
 */
export function createRequestPrincipalScope(
  parentSignal?: AbortSignal,
): RequestPrincipalScope {
  const controller = new AbortController();
  const listeners = new Set<() => void>();
  let isActive = !parentSignal?.aborted;

  const end = (): void => {
    if (!isActive) return;
    isActive = false;
    if (parentSignal && onParentAbort) {
      parentSignal.removeEventListener('abort', onParentAbort);
    }
    if (!controller.signal.aborted) {
      controller.abort('request-scope-ended');
    }
    const snapshot = [...listeners];
    listeners.clear();
    for (const listener of snapshot) {
      try {
        listener();
      } catch {
        // Cleanup listeners must never mask request completion or leave other brands retained.
      }
    }
  };

  const onParentAbort = parentSignal ? () => end() : undefined;
  if (parentSignal && onParentAbort) {
    if (parentSignal.aborted) {
      controller.abort(parentSignal.reason);
    } else {
      parentSignal.addEventListener('abort', onParentAbort, { once: true });
    }
  }

  return Object.freeze({
    signal: controller.signal,
    active: () => isActive && !controller.signal.aborted,
    onEnd(listener: () => void): void {
      if (!isActive) {
        listener();
        return;
      }
      listeners.add(listener);
    },
    end,
  });
}

/**
 * Stamps a freshly authenticated `Principal` in the module-private `WeakMap`
 * without cloning `principal` (preserving `INTERNAL_PRINCIPALS` reference identity).
 *
 * Rejects overlapping live brands on the same `Principal` reference, deep-freezes
 * `claims`, `scopes`, and `roles` in place, captures `internalAudience` privately,
 * and deletes the brand automatically when `requestScope.end()` runs.
 */
export function brandVerifiedPrincipal(
  principal: Principal,
  options: BrandVerifiedPrincipalOptions,
): VerifiedPrincipalRecord {
  const existing = VERIFIED_PRINCIPALS.get(principal);
  if (existing && existing.requestScope.active()) {
    throw new Error(
      '[netscript.service.auth] Overlapping live verified principal brand detected; authenticators must return a fresh Principal instance per authentication.',
    );
  }

  deepFreezeInPlace(principal.claims);
  deepFreezeInPlace(principal.scopes);
  deepFreezeInPlace(principal.roles);

  const maxTrustTtlMs = options.maxTrustTtlMs ?? DEFAULT_MAX_TRUST_TTL_MS;
  const expiresAtMs = computeExpiresAtMs(principal, options.verifiedAtMs, maxTrustTtlMs);
  const internalAudience = isInternalServicePrincipal(principal) &&
      typeof principal.claims.audience === 'string'
    ? principal.claims.audience
    : undefined;

  const record: VerifiedPrincipalRecord = Object.freeze({
    serviceId: options.serviceId,
    serviceName: options.serviceName,
    authenticator: options.authenticator,
    verifiedAtMs: options.verifiedAtMs,
    expiresAtMs,
    requestScope: options.requestScope,
    isRevoked: options.isRevoked,
    internalAudience,
  });

  if (options.requestScope.active()) {
    VERIFIED_PRINCIPALS.set(principal, record);
    options.requestScope.onEnd(() => {
      if (VERIFIED_PRINCIPALS.get(principal) === record) {
        VERIFIED_PRINCIPALS.delete(principal);
      }
    });
  }

  return record;
}

/**
 * Evaluates whether `principal` carries a valid, live, unexpired, unrevoked,
 * service-bound (and audience-bound for internal procedures) trust record.
 */
export function isVerifiedPrincipalTrusted(
  principal: Principal | undefined,
  check: VerifiedPrincipalTrustCheck,
): VerifiedPrincipalTrustResult {
  if (!principal) {
    return { trusted: false };
  }

  const record = VERIFIED_PRINCIPALS.get(principal);
  if (!record) {
    return { trusted: false };
  }

  if (!record.requestScope.active() || record.requestScope.signal.aborted) {
    return { trusted: false };
  }

  if (record.isRevoked?.() === true) {
    return { trusted: false };
  }

  // Strict finite expiry check (NaN / Infinity / non-number always fail closed).
  if (
    !Number.isFinite(check.nowMs) ||
    !Number.isFinite(record.expiresAtMs) ||
    !(check.nowMs < record.expiresAtMs)
  ) {
    return { trusted: false };
  }

  if ('exp' in principal.claims && principal.claims.exp !== undefined) {
    if (
      typeof principal.claims.exp !== 'number' ||
      !Number.isFinite(principal.claims.exp) ||
      !(check.nowMs < principal.claims.exp * 1000)
    ) {
      return { trusted: false };
    }
  }

  const sameService = record.serviceId === check.serviceId;
  if (check.requireInternalAudience) {
    // Cross-service delegation is NEVER honored for `audience: 'internal'`.
    if (!sameService) {
      return { trusted: false };
    }
    if (check.usesDefaultInternalPredicate) {
      if (
        record.internalAudience !== check.serviceName ||
        !isInternalServicePrincipal(principal) ||
        principal.claims.audience !== check.serviceName
      ) {
        return { trusted: false };
      }
    }
    return { trusted: true, record };
  }

  const explicitlyDelegated = check.trustSharedPrincipal === true &&
    check.trustedVerifiers?.has(record.authenticator) === true;

  if (!sameService && !explicitlyDelegated) {
    return { trusted: false };
  }

  return { trusted: true, record };
}

/** Reports whether `principal` currently retains a brand entry in the private WeakMap. */
export function hasVerifiedPrincipalBrand(principal: Principal): boolean {
  return VERIFIED_PRINCIPALS.has(principal);
}

function computeExpiresAtMs(
  principal: Principal,
  verifiedAtMs: number,
  maxTrustTtlMs: number,
): number {
  if (
    !Number.isFinite(verifiedAtMs) ||
    !Number.isFinite(maxTrustTtlMs) ||
    maxTrustTtlMs <= 0
  ) {
    return Number.NaN;
  }

  const ceilingMs = verifiedAtMs + maxTrustTtlMs;
  if ('exp' in principal.claims && principal.claims.exp !== undefined) {
    if (typeof principal.claims.exp !== 'number' || !Number.isFinite(principal.claims.exp)) {
      return Number.NaN;
    }
    return Math.min(principal.claims.exp * 1000, ceilingMs);
  }
  return ceilingMs;
}
