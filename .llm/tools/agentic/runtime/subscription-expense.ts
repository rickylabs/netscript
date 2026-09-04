/** Pure, credential-free subscription allowance decisions made before dispatch. */

import {
  EXPENSE_SNAPSHOT_MAX_AGE_MS,
  EXPENSE_WARNING_RATIO,
  OLLAMA_SUBSCRIPTION_LIMITS,
  type OllamaSubscriptionTier,
  openCodeGoEffectiveLimits,
} from '../config/subscriptions.ts';

export const EXPENSE_PROVIDERS = ['opencode_go', 'ollama', 'openrouter'] as const;
export type ExpenseProvider = typeof EXPENSE_PROVIDERS[number];

export type ExpenseUsageWindowId = 'rolling_five_hours' | 'weekly' | 'monthly';

export interface ExpenseUsageWindowSnapshot {
  readonly percent: number;
  readonly status: string;
  readonly resetsAt?: string;
}

export interface ExpenseUsageSnapshot {
  readonly provider: ExpenseProvider;
  readonly capturedAt: string;
  readonly tier?: OllamaSubscriptionTier;
  readonly rollingFiveHoursUsedUsd?: number;
  readonly weeklyUsedUsd?: number;
  readonly monthlyUsedUsd?: number;
  readonly availableBalanceUsd?: number;
  readonly concurrentRequests?: number;
  readonly percentageWindows?: Readonly<
    Partial<Record<ExpenseUsageWindowId, ExpenseUsageWindowSnapshot>>
  >;
  readonly resetsAt?: Readonly<
    Partial<Record<'rolling_five_hours' | 'weekly' | 'monthly', string>>
  >;
}

export interface ExpenseRequest {
  readonly provider: ExpenseProvider;
  readonly model?: string;
  readonly estimatedCostUsd: number;
  readonly snapshot: ExpenseUsageSnapshot;
  readonly now: string;
}

export interface ExpenseWindowDecision {
  readonly id: 'rolling_five_hours' | 'weekly' | 'monthly' | 'available_balance';
  readonly limitUsd: number;
  readonly usedUsd: number;
  readonly remainingAfterUsd: number;
  readonly exhausted: boolean;
  readonly observedPercent?: number;
  readonly projectedPercent?: number;
  readonly status?: string;
  readonly resetsAt?: string;
}

export type ExpenseDecisionReason =
  | 'allowed'
  | 'invalid_request'
  | 'provider_mismatch'
  | 'usage_stale'
  | 'usage_unproven'
  | 'subscription_tier_unresolved'
  | 'concurrency_exhausted'
  | 'provider_rate_limited'
  | 'allowance_exhausted';

export interface ExpenseDecision {
  readonly allowed: boolean;
  readonly provider: ExpenseProvider;
  readonly reason: ExpenseDecisionReason;
  readonly warning: boolean;
  readonly snapshotAgeMs: number | null;
  readonly windows: readonly ExpenseWindowDecision[];
  readonly concurrency?: Readonly<{ current: number; limit: number }>;
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function blocked(
  request: ExpenseRequest,
  reason: ExpenseDecisionReason,
  snapshotAgeMs: number | null,
  windows: readonly ExpenseWindowDecision[] = [],
  concurrency?: Readonly<{ current: number; limit: number }>,
): ExpenseDecision {
  return {
    allowed: false,
    provider: request.provider,
    reason,
    warning: false,
    snapshotAgeMs,
    windows,
    ...(concurrency ? { concurrency } : {}),
  };
}

function windowDecision(
  id: ExpenseWindowDecision['id'],
  limitUsd: number,
  usedUsd: number,
  estimatedCostUsd: number,
  resetsAt?: string,
): ExpenseWindowDecision {
  const remainingAfterUsd = Math.max(0, limitUsd - usedUsd - estimatedCostUsd);
  return {
    id,
    limitUsd,
    usedUsd,
    remainingAfterUsd,
    exhausted: usedUsd + estimatedCostUsd > limitUsd,
    ...(resetsAt ? { resetsAt } : {}),
  };
}

function percentageWindowDecision(
  id: ExpenseUsageWindowId,
  limitUsd: number,
  observed: ExpenseUsageWindowSnapshot,
  estimatedCostUsd: number,
): ExpenseWindowDecision {
  const usedUsd = limitUsd * observed.percent / 100;
  const projectedPercent = observed.percent + estimatedCostUsd / limitUsd * 100;
  return {
    id,
    limitUsd,
    usedUsd,
    remainingAfterUsd: Math.max(0, limitUsd - usedUsd - estimatedCostUsd),
    exhausted: observed.percent >= 100 || projectedPercent >= 100,
    observedPercent: observed.percent,
    projectedPercent,
    status: observed.status,
    ...(observed.resetsAt ? { resetsAt: observed.resetsAt } : {}),
  };
}

/** Returns a value-free pre-dispatch decision; unknown/stale usage always fails closed. */
export function evaluateSubscriptionExpense(request: ExpenseRequest): ExpenseDecision {
  if (!finiteNonNegative(request.estimatedCostUsd) || request.estimatedCostUsd === 0) {
    return blocked(request, 'invalid_request', null);
  }
  if (request.provider !== request.snapshot.provider) {
    return blocked(request, 'provider_mismatch', null);
  }
  const now = Date.parse(request.now);
  const capturedAt = Date.parse(request.snapshot.capturedAt);
  if (!Number.isFinite(now) || !Number.isFinite(capturedAt) || capturedAt > now) {
    return blocked(request, 'invalid_request', null);
  }
  const snapshotAgeMs = now - capturedAt;
  if (snapshotAgeMs > EXPENSE_SNAPSHOT_MAX_AGE_MS) {
    return blocked(request, 'usage_stale', snapshotAgeMs);
  }

  let windows: ExpenseWindowDecision[];
  let concurrency: Readonly<{ current: number; limit: number }> | undefined;
  if (request.provider === 'opencode_go') {
    const limits = request.model ? openCodeGoEffectiveLimits(request.model) : null;
    const percentages = request.snapshot.percentageWindows;
    const rolling = percentages?.rolling_five_hours;
    const weekly = percentages?.weekly;
    const monthly = percentages?.monthly;
    if (!limits || !rolling || !weekly || !monthly) {
      return blocked(request, 'usage_unproven', snapshotAgeMs);
    }
    const observed = [rolling, weekly, monthly];
    if (
      observed.some((entry) =>
        !finiteNonNegative(entry.percent) || typeof entry.status !== 'string' ||
        entry.status.trim().length === 0
      )
    ) return blocked(request, 'usage_unproven', snapshotAgeMs);
    windows = [
      percentageWindowDecision(
        'rolling_five_hours',
        limits.rollingFiveHours,
        rolling,
        request.estimatedCostUsd,
      ),
      percentageWindowDecision(
        'weekly',
        limits.weekly,
        weekly,
        request.estimatedCostUsd,
      ),
      percentageWindowDecision(
        'monthly',
        limits.monthly,
        monthly,
        request.estimatedCostUsd,
      ),
    ];
    if (observed.some((entry) => entry.status !== 'ok' || entry.percent >= 100)) {
      return blocked(request, 'provider_rate_limited', snapshotAgeMs, windows);
    }
  } else if (request.provider === 'ollama') {
    const tier = request.snapshot.tier;
    if (!tier || !(tier in OLLAMA_SUBSCRIPTION_LIMITS)) {
      return blocked(request, 'subscription_tier_unresolved', snapshotAgeMs);
    }
    const monthlyUsedUsd = request.snapshot.monthlyUsedUsd;
    const concurrentRequests = request.snapshot.concurrentRequests;
    if (!finiteNonNegative(monthlyUsedUsd) || !finiteNonNegative(concurrentRequests)) {
      return blocked(request, 'usage_unproven', snapshotAgeMs);
    }
    const limits = OLLAMA_SUBSCRIPTION_LIMITS[tier];
    concurrency = { current: concurrentRequests, limit: limits.concurrency };
    if (concurrentRequests >= limits.concurrency) {
      return blocked(request, 'concurrency_exhausted', snapshotAgeMs, [], concurrency);
    }
    windows = [
      windowDecision(
        'monthly',
        limits.monthlyUsd,
        monthlyUsedUsd,
        request.estimatedCostUsd,
        request.snapshot.resetsAt?.monthly,
      ),
    ];
  } else {
    const balance = request.snapshot.availableBalanceUsd;
    if (!finiteNonNegative(balance)) return blocked(request, 'usage_unproven', snapshotAgeMs);
    windows = [
      windowDecision(
        'available_balance',
        balance,
        0,
        request.estimatedCostUsd,
      ),
    ];
  }

  if (windows.some((entry) => entry.exhausted)) {
    return blocked(request, 'allowance_exhausted', snapshotAgeMs, windows, concurrency);
  }
  return {
    allowed: true,
    provider: request.provider,
    reason: 'allowed',
    warning: windows.some((entry) =>
      entry.projectedPercent !== undefined
        ? entry.projectedPercent >= EXPENSE_WARNING_RATIO * 100
        : entry.limitUsd > 0 &&
          entry.remainingAfterUsd / entry.limitUsd <= 1 - EXPENSE_WARNING_RATIO
    ),
    snapshotAgeMs,
    windows,
    ...(concurrency ? { concurrency } : {}),
  };
}

export function parseExpenseUsageSnapshot(source: string): ExpenseUsageSnapshot {
  const value: unknown = JSON.parse(source);
  if (!value || typeof value !== 'object') throw new Error('usage snapshot must be an object');
  const provider = (value as { provider?: unknown }).provider;
  const capturedAt = (value as { capturedAt?: unknown }).capturedAt;
  if (!EXPENSE_PROVIDERS.includes(provider as ExpenseProvider) || typeof capturedAt !== 'string') {
    throw new Error('usage snapshot requires a supported provider and capturedAt');
  }
  return value as ExpenseUsageSnapshot;
}
