/**
 * Server-first deferred region renderer for Fresh pages.
 *
 * @module
 */

import { Partial } from 'fresh/runtime';
import { DeferComponent } from './DeferIsland.tsx';
import { resolveDeferPolicy } from './policy.ts';
import {
  emitDeferCacheReadSpan,
  emitDeferPrewarmDispatchSpan,
  type FreshDeferTelemetryAttributes,
} from './telemetry.ts';

/** Renderable content accepted by deferred page slots. */
export type DeferPageRenderable =
  | object
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly DeferPageRenderable[];

/** Named defer policy profiles accepted by the page wrapper. */
export type DeferPagePolicyProfile =
  | 'balanced'
  | 'aggressive-first-paint'
  | 'background-refresh'
  | 'low-bandwidth';

/** Policy overrides accepted by the page wrapper. */
export interface DeferPagePolicyInput {
  /** Named profile that seeds default defer behavior. */
  profile?: DeferPagePolicyProfile;
  /** Freshness window in milliseconds before cached content is considered stale. */
  staleTimeMs?: number;
  /** Whether cache misses should start a background server prewarm. */
  prewarmOnMiss?: boolean;
  /** Whether stale cache hits should start a background server prewarm. */
  prewarmOnStale?: boolean;
  /** Whether fresh cached content should still refresh on the client. */
  clientRefreshOnFreshCache?: boolean;
  /** Whether client refresh should be skipped while server prewarm is active. */
  skipClientWhenServerPrewarm?: boolean;
}

/** Fresh request fields consumed by `DeferPage` without depending on app-local ctx types. */
export interface DeferPageRequestContextLike {
  /** Request URL for the current Fresh render. */
  url: URL;
  /** Request object for the current Fresh render. */
  req: Request;
  /** Indicates whether the current render already targets a Fresh partial. */
  isPartial?: boolean;
}

/** Props for the `DeferPage` server wrapper. */
export interface DeferPageProps {
  /** Action URL used when the deferred island requests a refresh. */
  action: string;
  /** Partial route URL that renders the deferred region content. */
  partial: string;
  /** Search params applied to the partial request instead of the current route params. */
  partialSearchParams?: string;
  /** Fresh partial name used to match server-rendered and hydrated regions. */
  name: string;
  /** Cached component content rendered when the deferred region has data. */
  component?: DeferPageRenderable;
  /** Fallback content rendered until the deferred region resolves. */
  fallback: DeferPageRenderable;
  /** Epoch milliseconds when the cached component content was produced. */
  cachedAt?: number;
  /** Freshness window in milliseconds before cached content is considered stale. */
  staleTime?: number;
  /**
   * Shared framework-level defer policy.
   */
  policy?: DeferPagePolicyInput | DeferPagePolicyProfile;
  /**
   * Optional stale handling strategy.
   * - `none` (default): do nothing server-side; let island decide.
   * - `server-prewarm`: trigger fire-and-forget server revalidation when stale.
   */
  staleStrategy?: 'none' | 'server-prewarm';
  /**
   * Enables verbose Defer diagnostics in server logs.
   */
  debug?: boolean;
  /** Request context fields used to detect partial and prewarm rendering. */
  ctx?: DeferPageRequestContextLike;
}

/**
 * Starts background server-side revalidation for a deferred region.
 *
 * This is intentionally internal-only:
 * - no userland API changes
 * - fire-and-forget
 * - non-fatal on error
 */
function prewarmPartial(
  origin: string,
  action: string,
  partial: string,
  partialSearchParams: string | undefined,
  name: string,
  searchParams?: string,
  reason: 'stale' | 'miss' = 'stale',
): void {
  const params = new URLSearchParams(searchParams ?? '');
  params.set('fresh-partial', 'true');
  const searchSuffix = params.toString() ? `?${params.toString()}` : '';
  const actionUrl = new URL(`${action}${searchSuffix}`, origin).toString();
  const partialParams = new URLSearchParams(partialSearchParams ?? searchParams ?? '');
  partialParams.set('fresh-partial', 'true');
  const partialSuffix = partialParams.toString() ? `?${partialParams.toString()}` : '';
  const partialUrl = new URL(`${partial}${partialSuffix}`, origin).toString();

  queueMicrotask(() => {
    const start = performance.now();

    void emitDeferPrewarmDispatchSpan(
      {
        regionName: name,
        reason,
        actionUrl,
        partialUrl,
      },
      async () => {
        const response = await fetch(partialUrl, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'defer-prewarm',
            'X-Defer-Prewarm': '1',
          },
        });

        return {
          status: response.status,
          ok: response.ok,
          durationMs: Math.round(performance.now() - start),
        };
      },
    )
      .then(() => undefined)
      .catch(() => undefined);
  });
}

/** Render a deferred region with optional server prewarm and telemetry hooks. */
export function DeferPage({
  action,
  partial,
  partialSearchParams,
  name,
  component,
  fallback,
  cachedAt,
  staleTime,
  policy,
  staleStrategy = 'none',
  ctx,
}: DeferPageProps): object {
  const renderStart = performance.now();

  const hasCachedData = !!component;
  const isPartialRequest = ctx?.isPartial;
  const isPrewarmRequest = ctx?.req.headers.get('X-Defer-Prewarm') === '1';

  const searchParams = ctx?.url.searchParams?.toString();
  const resolvedPolicy = resolveDeferPolicy(policy, staleTime, staleStrategy);
  const hasFreshnessInfo = typeof cachedAt === 'number' &&
    typeof resolvedPolicy.staleTimeMs === 'number';
  const isStale = hasFreshnessInfo ? (Date.now() - cachedAt) > resolvedPolicy.staleTimeMs : false;

  // Server prewarm strategy:
  // - stale hit: start eager server revalidation
  // - cache miss: start eager server fetch so client island has less to wait on
  const shouldPrewarmStale = !isPartialRequest && hasCachedData && isStale &&
    resolvedPolicy.prewarmOnStale;
  const shouldPrewarmMiss = !isPartialRequest && !hasCachedData && resolvedPolicy.prewarmOnMiss;
  const requestOrigin = ctx?.url.origin;

  // Fallback-visible metric (server approximation):
  // If we render fallback in non-partial/non-prewarm request, this is a fallback-visible event.
  const fallbackVisible = !isPartialRequest && !isPrewarmRequest && !hasCachedData;

  if (!isPrewarmRequest && shouldPrewarmStale && requestOrigin) {
    prewarmPartial(
      requestOrigin,
      action,
      partial,
      partialSearchParams,
      name,
      searchParams,
      'stale',
    );
  }

  if (!isPrewarmRequest && shouldPrewarmMiss && requestOrigin) {
    prewarmPartial(
      requestOrigin,
      action,
      partial,
      partialSearchParams,
      name,
      searchParams,
      'miss',
    );
  }

  const renderDurationMs = Math.round(performance.now() - renderStart);

  if (!isPrewarmRequest) {
    queueMicrotask(() => {
      const attributes: FreshDeferTelemetryAttributes = {
        'defer.region.name': name,
        'defer.action': action,
        'defer.partial': partial,
        'defer.has_cached_data': hasCachedData,
        'defer.has_freshness_info': hasFreshnessInfo,
        'defer.cached_at': cachedAt ?? -1,
        'defer.stale_time_ms': resolvedPolicy.staleTimeMs,
        'defer.cache.age_ms': hasFreshnessInfo ? (Date.now() - cachedAt) : -1,
        'defer.is_stale': isStale,
        'defer.fallback.visible': fallbackVisible,
        'defer.fallback.visible_ms': fallbackVisible ? renderDurationMs : 0,
        'defer.server_revalidating': shouldPrewarmStale || shouldPrewarmMiss,
        'defer.prewarm.strategy': resolvedPolicy.prewarmOnMiss || resolvedPolicy.prewarmOnStale
          ? 'policy-prewarm'
          : 'none',
        'defer.policy.profile': resolvedPolicy.profile,
        'defer.policy.client_refresh_on_fresh': resolvedPolicy.clientRefreshOnFreshCache,
        'defer.policy.skip_client_when_server_prewarm': resolvedPolicy.skipClientWhenServerPrewarm,
        'defer.prewarm.scheduled_stale': shouldPrewarmStale,
        'defer.prewarm.scheduled_miss': shouldPrewarmMiss,
        'defer.is_partial_request': !!isPartialRequest,
        'defer.is_prewarm_request': !!isPrewarmRequest,
      };

      void emitDeferCacheReadSpan({
        regionName: name,
        attributes,
        eventAttributes: {
          'defer.region.name': name,
          'defer.has_cached_data': hasCachedData,
          'defer.is_stale': isStale,
          'defer.fallback.visible': fallbackVisible,
        },
      });
    });
  }

  return (
    <div>
      <Partial name={name}>
        {hasCachedData ? component : fallback || null}
      </Partial>

      <DeferComponent
        action={action}
        partial={partial}
        partialSearchParams={partialSearchParams}
        isPartialRequest={isPartialRequest}
        hasCachedData={hasCachedData}
        cachedAt={cachedAt}
        staleTime={resolvedPolicy.staleTimeMs}
        serverRevalidating={!isPrewarmRequest && (shouldPrewarmStale || shouldPrewarmMiss)}
        searchParams={searchParams}
        policy={resolvedPolicy}
      />
    </div>
  );
}
