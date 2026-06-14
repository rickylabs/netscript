/** Named policy profiles for deferred rendering freshness behavior. */
export type DeferPolicyProfile =
  | 'balanced'
  | 'aggressive-first-paint'
  | 'background-refresh'
  | 'low-bandwidth';

/** Legacy stale strategy accepted by older defer call sites. */
export type LegacyStaleStrategy = 'none' | 'server-prewarm';

/** Policy overrides that tune when deferred regions refresh. */
export interface DeferPolicyInput {
  /** Named policy profile used as the defaults source. */
  profile?: DeferPolicyProfile;
  /** Freshness window in milliseconds before cached data is stale. */
  staleTimeMs?: number;
  /** Whether cache misses start a server-side prewarm request. */
  prewarmOnMiss?: boolean;
  /** Whether stale cache hits start a server-side prewarm request. */
  prewarmOnStale?: boolean;
  /** Whether fresh cache hits still trigger a client refresh. */
  clientRefreshOnFreshCache?: boolean;
  /** Whether client refresh is skipped while server prewarm is active. */
  skipClientWhenServerPrewarm?: boolean;
}

/** Fully resolved defer policy used by server and island renderers. */
export interface DeferPolicyResolved {
  /** Active named policy profile. */
  profile: DeferPolicyProfile;
  /** Resolved freshness window in milliseconds. */
  staleTimeMs: number;
  /** Resolved cache-miss prewarm behavior. */
  prewarmOnMiss: boolean;
  /** Resolved stale-hit prewarm behavior. */
  prewarmOnStale: boolean;
  /** Resolved fresh-cache client refresh behavior. */
  clientRefreshOnFreshCache: boolean;
  /** Resolved duplicate-refresh suppression behavior. */
  skipClientWhenServerPrewarm: boolean;
}

/** Conventional defer policy profiles used by generated pages. */
export const DEFER_POLICY = {
  header: 'balanced',
  detail: 'background-refresh',
} as const;

/** Conventional stale windows used by generated CRUD pages. */
export const DEFER_STALE_MS = {
  crud: 30_000,
  forceRefresh: 0,
} as const;

/** Detail-page policy that preserves immediate consistency after navigation. */
export const DETAIL_FORCE_REFRESH_POLICY: DeferPolicyInput = {
  profile: DEFER_POLICY.detail,
  // Keep immediate consistency for linked resources after first client nav.
  skipClientWhenServerPrewarm: false,
};

/** Resolve the detail-page stale window and defer policy for the current cache state. */
export function resolveDetailDeferConfig(hasCompleteCache: boolean): {
  staleTime: number;
  policy: DeferPolicyInput | DeferPolicyProfile;
} {
  return {
    staleTime: hasCompleteCache ? DEFER_STALE_MS.crud : DEFER_STALE_MS.forceRefresh,
    policy: hasCompleteCache ? DEFER_POLICY.detail : DETAIL_FORCE_REFRESH_POLICY,
  };
}

/** Reasons the client island can choose to submit or skip a deferred refresh. */
export type DeferClientDecisionReason =
  | 'partial-miss'
  | 'partial-hit'
  | 'full-miss'
  | 'server-revalidating'
  | 'missing-freshness'
  | 'fresh-cache'
  | 'stale-cache'
  | 'policy-background-refresh';

/** Client-side deferred refresh decision. */
export interface DeferClientDecision {
  /** Action the client island should take. */
  action: 'submit' | 'skip';
  /** Stable reason explaining the chosen action. */
  reason: DeferClientDecisionReason;
}

/** Inputs used to decide whether a deferred region should refresh on the client. */
export interface DeferClientDecisionInput {
  /** True when the current request already targets a Fresh partial. */
  isPartialRequest?: boolean;
  /** True when the server rendered cached data. */
  hasCachedData?: boolean;
  /** True when cached data has a timestamp and stale window. */
  hasFreshnessInfo: boolean;
  /** True when cached data is still within its stale window. */
  isFresh: boolean;
  /** True when the server already started revalidation for this region. */
  serverRevalidating?: boolean;
  /** Stale window used for the decision. */
  staleTimeMs: number;
  /** Resolved policy for the region. */
  policy: DeferPolicyResolved;
}

const PROFILE_DEFAULTS: Record<DeferPolicyProfile, DeferPolicyResolved> = {
  balanced: {
    profile: 'balanced',
    staleTimeMs: 30_000,
    prewarmOnMiss: true,
    prewarmOnStale: true,
    clientRefreshOnFreshCache: false,
    skipClientWhenServerPrewarm: true,
  },
  'aggressive-first-paint': {
    profile: 'aggressive-first-paint',
    staleTimeMs: 20_000,
    prewarmOnMiss: true,
    prewarmOnStale: true,
    clientRefreshOnFreshCache: false,
    skipClientWhenServerPrewarm: false,
  },
  'background-refresh': {
    profile: 'background-refresh',
    staleTimeMs: 30_000,
    prewarmOnMiss: true,
    prewarmOnStale: true,
    clientRefreshOnFreshCache: true,
    skipClientWhenServerPrewarm: false,
  },
  'low-bandwidth': {
    profile: 'low-bandwidth',
    staleTimeMs: 45_000,
    prewarmOnMiss: true,
    prewarmOnStale: false,
    clientRefreshOnFreshCache: false,
    skipClientWhenServerPrewarm: true,
  },
};

/** Resolve user policy input, stale overrides, and legacy strategy into a complete policy. */
export function resolveDeferPolicy(
  policy: DeferPolicyInput | DeferPolicyProfile | undefined,
  staleTimeOverrideMs: number | undefined,
  staleStrategy: LegacyStaleStrategy | undefined,
): DeferPolicyResolved {
  const policyInput: DeferPolicyInput = typeof policy === 'string'
    ? { profile: policy }
    : (policy ?? {});
  const profile = policyInput.profile ?? 'balanced';
  const defaults = PROFILE_DEFAULTS[profile];

  const legacyPrewarm = staleStrategy === 'server-prewarm';
  const hasLegacyStrategy = staleStrategy !== undefined && staleStrategy !== 'none';

  return {
    profile,
    staleTimeMs: staleTimeOverrideMs ?? policyInput.staleTimeMs ?? defaults.staleTimeMs,
    prewarmOnMiss: hasLegacyStrategy
      ? legacyPrewarm
      : (policyInput.prewarmOnMiss ?? defaults.prewarmOnMiss),
    prewarmOnStale: hasLegacyStrategy
      ? legacyPrewarm
      : (policyInput.prewarmOnStale ?? defaults.prewarmOnStale),
    clientRefreshOnFreshCache: policyInput.clientRefreshOnFreshCache ??
      defaults.clientRefreshOnFreshCache,
    skipClientWhenServerPrewarm: policyInput.skipClientWhenServerPrewarm ??
      defaults.skipClientWhenServerPrewarm,
  };
}

/** Decide whether the client island should submit or skip its deferred refresh form. */
export function decideDeferClientAction(input: DeferClientDecisionInput): DeferClientDecision {
  if (input.isPartialRequest) {
    return input.hasCachedData
      ? { action: 'skip', reason: 'partial-hit' }
      : { action: 'submit', reason: 'partial-miss' };
  }

  if (!input.hasCachedData) {
    return { action: 'submit', reason: 'full-miss' };
  }

  if (
    input.serverRevalidating &&
    input.policy.skipClientWhenServerPrewarm &&
    input.staleTimeMs !== 0
  ) {
    return { action: 'skip', reason: 'server-revalidating' };
  }

  if (!input.hasFreshnessInfo) {
    return { action: 'submit', reason: 'missing-freshness' };
  }

  if (!input.isFresh) {
    return { action: 'submit', reason: 'stale-cache' };
  }

  if (input.policy.clientRefreshOnFreshCache) {
    return { action: 'submit', reason: 'policy-background-refresh' };
  }

  return { action: 'skip', reason: 'fresh-cache' };
}
