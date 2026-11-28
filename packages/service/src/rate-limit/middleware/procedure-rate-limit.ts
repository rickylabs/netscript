/**
 * Procedure-level rate-limit stage over RFC 0008 {@link RateLimitStore}.
 *
 * Runs inside the oRPC procedure pipeline after HTTP-edge authentication and
 * authorization (and before Zod input validation), deriving `Retry-After` from
 * `decision.retryAt ?? decision.resetAt` and emitting HTTP `Retry-After` via
 * oRPC's `ResponseHeadersPlugin` (`context.resHeaders`).
 *
 * @module
 */

import { ORPCError } from '@orpc/server';
import { createPackageLogger, type Logger } from '@netscript/logger';
import type { Principal } from '../../auth/types.ts';
import type { ServiceEnvironment } from '../../types.ts';
import { validateRateLimitBounds } from '../domain/rate-limit.ts';
import type { RateLimitStore } from '../ports/rate-limit-store.ts';
import { rateLimitAddressKey, resolveServiceClientAddress } from './client-address.ts';
import type { ServiceProcedureRateLimitOptions } from './options.ts';

const PROCEDURE_RATE_LIMIT_LOGGER = createPackageLogger('service');

/** Invocation inputs for enforcing one prepared procedure rate-limit stage. */
export interface ProcedureRateLimitInvocation {
  /** Authenticated principal for the current call, when present. */
  readonly principal?: Principal;
  /** Explicit caller-supplied client address, when provided on procedure context. */
  readonly clientAddress?: string;
  /** Raw HTTP request when invoked through the service's HTTP edge. */
  readonly httpRequest?: Request;
  /** Socket/service environment when invoked through the service's HTTP edge. */
  readonly httpEnv?: ServiceEnvironment;
  /** Canonical oRPC procedure path segments. */
  readonly procedurePath: readonly string[];
  /** Cooperative cancellation signal for store IO. */
  readonly signal?: AbortSignal;
  /** Mutable HTTP response headers exposed by oRPC `ResponseHeadersPlugin`. */
  readonly resHeaders?: Headers;
  /** Request-scoped logger, when available. */
  readonly logger?: Logger;
  /** Whether the target procedure contract declares `RATE_LIMITED` in its error map. */
  readonly isRateLimitedDefined: boolean;
}

/** Validated procedure rate-limit stage attached to a service pipeline. */
export interface PreparedProcedureRateLimitStage {
  /** Store owned by this stage (checked for disjointness against HTTP edge `withRateLimit()`). */
  readonly store: RateLimitStore;
  /** Enforces one quota reservation or throws `ORPCError('RATE_LIMITED', { status: 429 })`. */
  enforce(invocation: ProcedureRateLimitInvocation): Promise<void>;
}

/**
 * Validates procedure rate-limit options synchronously (including RFC 0008
 * `store.validate?.({ limit, windowMs })`) and returns an executable stage.
 */
export function prepareProcedureRateLimitStage(
  options: ServiceProcedureRateLimitOptions,
): PreparedProcedureRateLimitStage {
  const { limit, windowMs, store, key } = options;
  validateRateLimitBounds(limit, windowMs);
  store.validate?.({ limit, windowMs });

  const ipv6Prefix = options.ipv6Prefix ?? 64;
  if (!Number.isInteger(ipv6Prefix) || ipv6Prefix < 0 || ipv6Prefix > 128) {
    throw new RangeError('Rate-limit ipv6Prefix must be an integer from 0 to 128');
  }

  const trustProxy = options.trustProxy ?? false;
  const now = options.now ?? Date.now;
  let warnedMissingAddress = false;

  return {
    store,
    async enforce(invocation: ProcedureRateLimitInvocation): Promise<void> {
      const resolvedClientAddress = normalizeClientAddress(invocation.clientAddress) ??
        (invocation.httpRequest
          ? resolveServiceClientAddress(invocation.httpRequest, invocation.httpEnv, trustProxy)
          : undefined);

      let bucketKey: string;
      if (key) {
        bucketKey = await key({
          principal: invocation.principal,
          clientAddress: resolvedClientAddress,
          procedurePath: invocation.procedurePath,
        });
      } else if (invocation.principal) {
        const rawTenant = invocation.principal.claims.tenantId;
        const tenantId = typeof rawTenant === 'string' && rawTenant.length > 0
          ? rawTenant
          : 'global';
        bucketKey = `${tenantId}:${invocation.principal.subject}`;
      } else if (resolvedClientAddress !== undefined) {
        bucketKey = `addr:${rateLimitAddressKey(resolvedClientAddress, ipv6Prefix)}`;
      } else {
        if (!warnedMissingAddress) {
          warnedMissingAddress = true;
          const logger = invocation.logger ?? PROCEDURE_RATE_LIMIT_LOGGER;
          logger.warn(
            'Procedure rate limit has no principal, clientAddress, or custom key; unauthenticated callers share the addr:unknown bucket.',
          );
        }
        bucketKey = 'addr:unknown';
      }

      const decision = await store.consume({
        key: bucketKey,
        limit,
        windowMs,
        now: now(),
        signal: invocation.signal,
      });

      if (!decision.allowed) {
        const retryTargetMs = decision.retryAt ?? decision.resetAt;
        const retryAfter = Math.max(1, Math.ceil((retryTargetMs - now()) / 1000));
        invocation.resHeaders?.set('Retry-After', String(retryAfter));
        throw new ORPCError('RATE_LIMITED', {
          status: 429,
          message: 'Too many requests',
          data: { retryAfter, limit },
          defined: invocation.isRateLimitedDefined,
        });
      }
    },
  };
}

function normalizeClientAddress(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
