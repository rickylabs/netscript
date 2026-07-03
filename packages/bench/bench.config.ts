/**
 * Bench configuration: the pinned model + pricing, normalization anchors,
 * weight presets, caps, the framework lane, and the task list.
 *
 * Pricing is grounded in the `claude-api` reference (cached 2026-06-24); the
 * instrument never fabricates cost numbers. The default model is Claude Opus 4.8
 * (`claude-opus-4-8`) — the model the framework's own agents run on.
 *
 * @module
 */

import { fromFileUrl } from '@std/path';
import type { ModelPricing } from './src/domain/metrics.ts';
import type { AnchorTable, WeightPreset } from './src/domain/scoring.ts';
import type { BenchTask, FrameworkLane } from './src/domain/task.ts';
import type { RunCaps } from './src/application/runner/bench-runner.ts';

/** Absolute path to this package directory (portable across checkouts). */
export const PACKAGE_DIR: string = fromFileUrl(new URL('.', import.meta.url));

/** Default pinned model under test. */
export const DEFAULT_MODEL = 'claude-opus-4-8';

/**
 * Per-model USD pricing per 1M tokens (claude-api reference, cached 2026-06-24).
 * Cache multipliers: reads ~0.1x base input, writes ~1.25x (5-min TTL).
 */
export const MODEL_PRICING: Readonly<Record<string, ModelPricing>> = {
  'claude-opus-4-8': {
    model: 'claude-opus-4-8',
    inputPerMillion: 5.0,
    outputPerMillion: 25.0,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25,
  },
  'claude-sonnet-5': {
    model: 'claude-sonnet-5',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25,
  },
  'claude-haiku-4-5': {
    model: 'claude-haiku-4-5',
    inputPerMillion: 1.0,
    outputPerMillion: 5.0,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25,
  },
  'claude-fable-5': {
    model: 'claude-fable-5',
    inputPerMillion: 10.0,
    outputPerMillion: 50.0,
    cacheReadMultiplier: 0.1,
    cacheWriteMultiplier: 1.25,
  },
};

/** Resolve pricing for a model, defaulting to the pinned model. */
export function pricingFor(model: string): ModelPricing {
  const pricing = MODEL_PRICING[model];
  if (pricing === undefined) {
    throw new Error(`no pricing table for model '${model}'; add it to bench.config.ts`);
  }
  return pricing;
}

/**
 * Min-max normalization anchors (plan §Metrics). Descending metrics anchor
 * worst -> best; the ascending pass-rate axis anchors 0 -> 1.
 */
export const ANCHORS: AnchorTable = {
  testPassRate: { worst: 0, best: 1 },
  turnsToGreen: { worst: 80, best: 5 },
  cost: { worst: 2.0, best: 0.05 },
  wallSeconds: { worst: 900, best: 60 },
};

/** Default balanced preset (weights sum to 1 across scored axes). */
export const DEFAULT_PRESET: WeightPreset = {
  id: 'default',
  description: 'Balanced: correctness-led with cost/turns/wall support and a rubric reserve.',
  weights: {
    testPassRate: 0.45,
    // Rubric reserve (0.20) is held out of the scored axes until Slice 5; the
    // provisional composite therefore sums to 0.80 by design.
    turnsToGreen: 0.15,
    cost: 0.1,
    wallSeconds: 0.1,
    linesOfCode: 0,
  },
};

/** Efficiency-tilted preset for Encore-style parity comparisons. */
export const ENCORE_PARITY_PRESET: WeightPreset = {
  id: 'encore-parity',
  description: 'Efficiency-tilted: heavier weight on turns and cost, no rubric reserve.',
  weights: {
    testPassRate: 0.5,
    turnsToGreen: 0.2,
    cost: 0.15,
    wallSeconds: 0.15,
    linesOfCode: 0,
  },
};

/** All presets by id. */
export const PRESETS: Readonly<Record<string, WeightPreset>> = {
  default: DEFAULT_PRESET,
  'encore-parity': ENCORE_PARITY_PRESET,
};

/** Per-attempt caps (also the turn/wall normalization anchors). */
export const CAPS: RunCaps = {
  maxTurns: 80,
  maxWallSeconds: 900,
  suiteTimeoutMs: 60_000,
};

/** The single framework lane for Slice 1. */
export const NETSCRIPT_LANE: FrameworkLane = {
  id: 'netscript',
  name: 'NetScript',
  contextPath: 'context/AGENTS.md',
};

/** Task 1: storefront products API (CRUD + typed errors + persistence). */
export const T1_STOREFRONT_API: BenchTask = {
  id: 't1-storefront-api',
  title: 'Storefront products API',
  dir: `${PACKAGE_DIR}tasks/t1-storefront-api`,
  promptPath: 'prompt.md',
  rubricPath: 'rubric.md',
  testSuitePath: `${PACKAGE_DIR}tasks/t1-storefront-api/tests/frozen-suite.ts`,
  lanes: [NETSCRIPT_LANE],
};

/** Ordered task list. */
export const TASKS: readonly BenchTask[] = [T1_STOREFRONT_API];

/** Run design for Slice 1: single repeat (N-repeats deferred to a later slice). */
export const RUN_DESIGN = {
  repeats: 1,
} as const;

/** The assembled default configuration. */
export const benchConfig = {
  model: DEFAULT_MODEL,
  pricing: MODEL_PRICING,
  anchors: ANCHORS,
  presets: PRESETS,
  caps: CAPS,
  lane: NETSCRIPT_LANE,
  tasks: TASKS,
  design: RUN_DESIGN,
} as const;
