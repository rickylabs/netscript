/**
 * Artifact schemas: the raw per-turn trace, the scored task attempt, and the
 * run summary. These are the persisted outputs of a bench run.
 *
 * Two-tier persistence (plan §State): raw traces are heavy and land in
 * `.llm/tmp/bench/<run-id>/` (gitignored); scored attempts and the summary are
 * light and land in `results/` (committed).
 *
 * @module
 */

import type { RunManifest } from './manifest.ts';
import type { Metrics } from './metrics.ts';
import type { Score } from './scoring.ts';
import type { TestRunResult } from './test-run.ts';
import type { AgentTurn } from './agent.ts';

/** One turn's raw observation: the agent turn plus the post-turn suite result. */
export interface TurnObservation {
  /** Turn boundary that produced this observation. */
  readonly turn: AgentTurn;
  /** Suite result evaluated against the sandbox after the turn. */
  readonly testResult: TestRunResult;
  /** Cumulative USD cost through this turn. */
  readonly cumulativeCost: number;
  /** True once this turn's suite first reached fully green. */
  readonly firstGreen: boolean;
}

/** The heavy, gitignored raw trace for a single task attempt. */
export interface RawTraceRecord {
  readonly manifest: RunManifest;
  readonly taskId: string;
  readonly laneId: string;
  readonly repeat: number;
  readonly observations: readonly TurnObservation[];
  /** Reason the run loop ended. */
  readonly stopCause: RunStopCause;
}

/** Why the runner stopped a task attempt. */
export type RunStopCause = 'green' | 'max-turns' | 'max-wall' | 'agent-ended' | 'error';

/** The light, committed scored result for a single task attempt. */
export interface TaskAttemptResult {
  readonly manifest: RunManifest;
  readonly taskId: string;
  readonly laneId: string;
  readonly repeat: number;
  readonly metrics: Metrics;
  readonly score: Score;
  readonly stopCause: RunStopCause;
  /** Turn count actually executed. */
  readonly turns: number;
}

/** The committed run-level summary across all task attempts. */
export interface RunSummary {
  readonly manifest: RunManifest;
  readonly attempts: readonly TaskAttemptResult[];
  /** Mean composite across attempts, in [0, 1]. */
  readonly meanComposite: number;
  /** True if any attempt carried a provisional score. */
  readonly provisional: boolean;
}
