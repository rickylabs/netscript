/**
 * Client-side defer island helpers.
 *
 * @module
 */

import { useEffect, useRef } from 'preact/hooks';
import { IS_BROWSER } from 'fresh/runtime';
import {
  decideDeferClientAction,
  type DeferPolicyInput,
  type DeferPolicyProfile,
  type DeferPolicyResolved,
  resolveDeferPolicy,
} from './policy.ts';
import { emitDeferClientDecisionSpan, type FreshDeferTelemetryAttributes } from './telemetry.ts';

const FRESH_TRANSPORT_QUERY_PARAMS = new Set(['fresh-partial']);

/** Props consumed by the hidden client-side defer form. */
export interface DeferComponentProps {
  /** Full page action used when the client triggers a refresh. */
  action: string;
  /** Partial endpoint refreshed by the defer form. */
  partial: string;
  /** Optional query string applied only to the partial endpoint. */
  partialSearchParams?: string;
  /** True when the current request already targets a Fresh partial. */
  isPartialRequest?: boolean;
  /** True when the server already rendered cached data for the region. */
  hasCachedData?: boolean;
  /** Serialized query string copied into the hidden form submission. */
  searchParams?: string;
  /**
   * Unix epoch (ms) when the cached payload was written.
   */
  cachedAt?: number;
  /**
   * Freshness window in milliseconds.
   */
  staleTime?: number;
  /**
   * Shared framework-level defer policy.
   */
  policy?: DeferPolicyInput | DeferPolicyProfile | DeferPolicyResolved;
  /**
   * True when server already initiated stale revalidation for this region.
   * In that case, skip immediate client refetch to avoid duplicate requests.
   */
  serverRevalidating?: boolean;
  /**
   * Enables verbose client-side diagnostics for submit/skip decisions.
   */
  debug?: boolean;
}

/** Remove Fresh transport-only query parameters from a serialized query string. */
export function sanitizeDeferSearchParams(searchParams?: string): string | undefined {
  if (!searchParams || searchParams.trim().length === 0) {
    return undefined;
  }

  const params = new URLSearchParams(searchParams);

  for (const key of FRESH_TRANSPORT_QUERY_PARAMS) {
    params.delete(key);
  }

  const serialized = params.toString();
  return serialized.length > 0 ? serialized : undefined;
}

/** Split a serialized query string into stable form field entries. */
function parseDeferSearchEntries(searchParams?: string): Array<[string, string]> {
  const sanitized = sanitizeDeferSearchParams(searchParams);
  return sanitized ? [...new URLSearchParams(sanitized).entries()] : [];
}

/**
 * Build the hidden form state used by the defer island.
 *
 * Shared page params stay in the form body while partial-only params remain on
 * the `f-partial` URL.
 */
export function buildDeferFormState(searchParams?: string, partialSearchParams?: string): {
  formEntries: Array<[string, string]>;
  partialQuery?: string;
} {
  const formEntries = parseDeferSearchEntries(searchParams);
  const remainingPartialEntries = parseDeferSearchEntries(partialSearchParams ?? searchParams);

  for (const [key, value] of formEntries) {
    const matchIndex = remainingPartialEntries.findIndex(([candidateKey, candidateValue]) => {
      return candidateKey === key && candidateValue === value;
    });

    if (matchIndex >= 0) {
      remainingPartialEntries.splice(matchIndex, 1);
    }
  }

  return {
    formEntries,
    partialQuery: remainingPartialEntries.length > 0
      ? new URLSearchParams(remainingPartialEntries).toString()
      : undefined,
  };
}

/** Hidden client-side form that revalidates deferred regions when policy allows it. */
export function DeferComponent({
  action,
  partial,
  partialSearchParams,
  isPartialRequest,
  hasCachedData,
  searchParams,
  cachedAt,
  staleTime,
  policy,
  serverRevalidating,
}: DeferComponentProps): object {
  const formRef = useRef<HTMLFormElement>(null);
  const sanitizedActionSearchParams = sanitizeDeferSearchParams(searchParams);
  const sanitizedPartialSearchParams = sanitizeDeferSearchParams(
    partialSearchParams ?? searchParams,
  );
  const { formEntries, partialQuery } = buildDeferFormState(searchParams, partialSearchParams);
  const partialSearchParamsString = partialQuery ? `?${partialQuery}` : '';

  useEffect(() => {
    if (!IS_BROWSER || !formRef.current) return;

    const hasFreshnessInfo = typeof cachedAt === 'number' && typeof staleTime === 'number';
    const ageMs = hasFreshnessInfo ? (Date.now() - cachedAt) : -1;
    const isFresh = hasFreshnessInfo ? ageMs <= staleTime : false;
    const resolvedPolicy = (
        policy && typeof policy === 'object' && 'profile' in policy && 'prewarmOnMiss' in policy
      )
      ? policy as DeferPolicyResolved
      : resolveDeferPolicy(policy, staleTime, undefined);

    const decisionContext: FreshDeferTelemetryAttributes = {
      'defer.action': action,
      'defer.partial': partial,
      'defer.partial_search': partialSearchParams ?? searchParams ?? '',
      'defer.is_partial_request': !!isPartialRequest,
      'defer.has_cached_data': !!hasCachedData,
      'defer.server_revalidating': !!serverRevalidating,
      'defer.has_freshness_info': hasFreshnessInfo,
      'defer.cached_at': cachedAt ?? -1,
      'defer.stale_time_ms': staleTime ?? -1,
      'defer.cache.age_ms': ageMs,
      'defer.is_fresh': isFresh,
      'defer.policy.profile': resolvedPolicy.profile,
      'defer.policy.client_refresh_on_fresh': resolvedPolicy.clientRefreshOnFreshCache,
      'defer.policy.skip_client_when_server_prewarm': resolvedPolicy.skipClientWhenServerPrewarm,
    };

    const emitDecision = (
      decision: 'submit' | 'skip',
      reason:
        | 'partial-miss'
        | 'partial-hit'
        | 'full-miss'
        | 'server-revalidating'
        | 'missing-freshness'
        | 'fresh-cache'
        | 'stale-cache'
        | 'policy-background-refresh',
      details: Record<string, unknown> = {},
    ) => {
      const attributes: FreshDeferTelemetryAttributes = {
        ...decisionContext,
        'defer.decision': decision,
        'defer.decision_reason': reason,
        ...details,
      };

      void emitDeferClientDecisionSpan(attributes);

      if (decision === 'submit') {
        formRef.current?.requestSubmit();
      }
    };

    // Partial request behavior:
    const decision = decideDeferClientAction({
      isPartialRequest,
      hasCachedData,
      hasFreshnessInfo,
      isFresh,
      serverRevalidating,
      staleTimeMs: staleTime ?? resolvedPolicy.staleTimeMs,
      policy: resolvedPolicy,
    });

    emitDecision(decision.action, decision.reason, {
      'defer.cache.age_ms': ageMs,
    });
  }, [
    action,
    partial,
    isPartialRequest,
    hasCachedData,
    cachedAt,
    staleTime,
    policy,
    serverRevalidating,
    formEntries,
    partialQuery,
    sanitizedActionSearchParams,
    sanitizedPartialSearchParams,
  ]);

  return (
    <form
      ref={formRef}
      method='GET'
      action={action}
      f-partial={`${partial}${partialSearchParamsString}`}
      f-client-nav={!(isPartialRequest && !hasCachedData)}
      style={{ display: 'none' }}
      aria-hidden='true'
    >
      {formEntries.map(([key, value], index) => (
        <input
          key={`${key}:${value}:${index}`}
          type='hidden'
          name={key}
          value={value}
        />
      ))}
      load partial
    </form>
  );
}
