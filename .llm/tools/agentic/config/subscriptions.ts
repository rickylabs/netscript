/** Current monetary/concurrency contracts for paid fallback subscriptions. */

import { ROUTING_MODEL_IDS } from './models.ts';

export const EXPENSE_SNAPSHOT_MAX_AGE_MS: number = 15 * 60 * 1000;
export const EXPENSE_WARNING_RATIO: number = 0.9;

/** Official OpenCode Go allowance windows, re-verified 2026-09-04. */
export const OPENCODE_GO_LIMITS_USD = {
  rollingFiveHours: 12,
  weekly: 30,
  monthly: 60,
} as const;

/**
 * OpenCode Go's model-weighted monthly inclusion values. The public 12/30/60
 * windows are the $60 reference-model allowance; a selected model consumes
 * each window in proportion to its published monthly inclusion.
 */
export const OPENCODE_GO_MODEL_MONTHLY_INCLUDED_USD: Readonly<Record<string, number>> = {
  [ROUTING_MODEL_IDS.grok46Go]: 15,
  [ROUTING_MODEL_IDS.lunaGo]: 15,
  [ROUTING_MODEL_IDS.glm53FlashGo]: 15,
  [ROUTING_MODEL_IDS.glm53Go]: 15,
  [ROUTING_MODEL_IDS.kimiK3Go]: 15,
  [ROUTING_MODEL_IDS.qwen38MaxGo]: 15,
  [ROUTING_MODEL_IDS.deepseekV4ProGo]: 15,
  [ROUTING_MODEL_IDS.deepseekV4FlashVisionGo]: 15,
  [ROUTING_MODEL_IDS.qwen38FlashNextGo]: 30,
  [ROUTING_MODEL_IDS.deepseekV4FlashGo]: 30,
  [ROUTING_MODEL_IDS.museSpark13Go]: 60,
  [ROUTING_MODEL_IDS.minimaxM3Go]: 60,
};

export interface OpenCodeGoEffectiveLimits {
  readonly rollingFiveHours: number;
  readonly weekly: number;
  readonly monthly: number;
}

/** Returns the model-adjusted Go limits, or null for an unclassified paid model. */
export function openCodeGoEffectiveLimits(model: string): OpenCodeGoEffectiveLimits | null {
  const monthly = OPENCODE_GO_MODEL_MONTHLY_INCLUDED_USD[model];
  if (monthly === undefined) return null;
  const scale = monthly / OPENCODE_GO_LIMITS_USD.monthly;
  return {
    rollingFiveHours: OPENCODE_GO_LIMITS_USD.rollingFiveHours * scale,
    weekly: OPENCODE_GO_LIMITS_USD.weekly * scale,
    monthly,
  };
}

/** Official Ollama included-cloud-credit tiers, re-verified 2026-09-04. */
export const OLLAMA_SUBSCRIPTION_LIMITS = {
  pro: { monthlyUsd: 60, concurrency: 3 },
  max: { monthlyUsd: 300, concurrency: 10 },
  team: { monthlyUsd: 1000, concurrency: 10 },
} as const;
export type OllamaSubscriptionTier = keyof typeof OLLAMA_SUBSCRIPTION_LIMITS;
