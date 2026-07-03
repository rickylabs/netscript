/**
 * Domain barrel: readonly types and pure helpers with no I/O.
 *
 * @module
 */

export type { BenchTask, FrameworkLane, LaneId, TaskId } from './task.ts';
export type { AgentRunRequest, AgentTurn, StopReason, TokenUsage } from './agent.ts';
export { addUsage, ZERO_USAGE } from './agent.ts';
export type { ProbeResult, ProbeVerdict, TestRunResult } from './test-run.ts';
export { summarizeProbes } from './test-run.ts';
export type { Metrics, ModelPricing } from './metrics.ts';
export { costOf } from './metrics.ts';
export type {
  AnchorTable,
  MetricKey,
  NormalizationAnchor,
  Rubric,
  RubricItem,
  Score,
  ScoreComponent,
  WeightPreset,
} from './scoring.ts';
export type { RunManifest } from './manifest.ts';
export type {
  RawTraceRecord,
  RunStopCause,
  RunSummary,
  TaskAttemptResult,
  TurnObservation,
} from './report.ts';
