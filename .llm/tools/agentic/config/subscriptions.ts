/** Current monetary/concurrency contracts for paid fallback subscriptions. */

export const EXPENSE_SNAPSHOT_MAX_AGE_MS: number = 15 * 60 * 1000;
export const EXPENSE_WARNING_RATIO: number = 0.9;

/** Official OpenCode Go allowance windows, re-verified 2026-09-04. */
export const OPENCODE_GO_LIMITS_USD = {
  rollingFiveHours: 12,
  weekly: 30,
  monthly: 60,
} as const;

/** Official Ollama included-cloud-credit tiers, re-verified 2026-09-04. */
export const OLLAMA_SUBSCRIPTION_LIMITS = {
  pro: { monthlyUsd: 60, concurrency: 3 },
  max: { monthlyUsd: 300, concurrency: 10 },
  team: { monthlyUsd: 1000, concurrency: 10 },
} as const;
export type OllamaSubscriptionTier = keyof typeof OLLAMA_SUBSCRIPTION_LIMITS;
