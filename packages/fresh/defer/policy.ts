export type DeferPolicyProfile =
  | 'balanced'
  | 'aggressive-first-paint'
  | 'background-refresh'
  | 'low-bandwidth';

export type LegacyStaleStrategy = 'none' | 'server-prewarm';

export interface DeferPolicyInput {
  profile?: DeferPolicyProfile;
  staleTimeMs?: number;
  prewarmOnMiss?: boolean;
  prewarmOnStale?: boolean;
  clientRefreshOnFreshCache?: boolean;
  skipClientWhenServerPrewarm?: boolean;
}

export interface DeferPolicyResolved {
  profile: DeferPolicyProfile;
  staleTimeMs: number;
  prewarmOnMiss: boolean;
  prewarmOnStale: boolean;
  clientRefreshOnFreshCache: boolean;
  skipClientWhenServerPrewarm: boolean;
}

export const DEFER_POLICY = {
  header: 'balanced',
  detail: 'background-refresh',
} as const;

export const DEFER_STALE_MS = {
  crud: 30_000,
  forceRefresh: 0,
} as const;

export const DETAIL_FORCE_REFRESH_POLICY: DeferPolicyInput = {
  profile: DEFER_POLICY.detail,
  // Keep immediate consistency for linked resources after first client nav.
  skipClientWhenServerPrewarm: false,
};

export function resolveDetailDeferConfig(hasCompleteCache: boolean): {
  staleTime: number;
  policy: DeferPolicyInput | DeferPolicyProfile;
} {
  return {
    staleTime: hasCompleteCache ? DEFER_STALE_MS.crud : DEFER_STALE_MS.forceRefresh,
    policy: hasCompleteCache ? DEFER_POLICY.detail : DETAIL_FORCE_REFRESH_POLICY,
  };
}

export type DeferClientDecisionReason =
  | 'partial-miss'
  | 'partial-hit'
  | 'full-miss'
  | 'server-revalidating'
  | 'missing-freshness'
  | 'fresh-cache'
  | 'stale-cache'
  | 'policy-background-refresh';

export interface DeferClientDecision {
  action: 'submit' | 'skip';
  reason: DeferClientDecisionReason;
}

interface DeferClientDecisionInput {
  isPartialRequest?: boolean;
  hasCachedData?: boolean;
  hasFreshnessInfo: boolean;
  isFresh: boolean;
  serverRevalidating?: boolean;
  staleTimeMs: number;
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
