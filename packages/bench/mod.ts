/**
 * `@netscript/bench` — the NetScript self-bench instrument.
 *
 * A clean-architecture harness that measures how effectively a coding agent
 * builds a working NetScript service: it drives an agent through a task in an
 * isolated sandbox, runs a frozen black-box HTTP suite after every turn, and
 * scores the attempt on `test_pass_rate`, `turns_to_green`, `cost`, and wall
 * time (with `lines_of_code` reported at weight 0).
 *
 * Slice 1 ships the full instrument validated by unit tests with a fake driver;
 * the live agent run, the golden reference, and conformance mode land in 1b.
 *
 * @example
 * ```ts
 * import { createBenchRunner, defineBenchRun } from '@netscript/bench';
 * import { ANCHORS, DEFAULT_PRESET, TASKS } from '@netscript/bench/config';
 *
 * const definition = defineBenchRun()
 *   .withTasks(TASKS)
 *   .withPreset(DEFAULT_PRESET)
 *   .withAnchors(ANCHORS)
 *   .build();
 * ```
 *
 * @module
 */

// Domain types.
export type {
  AgentRunRequest,
  AgentTurn,
  AnchorTable,
  BenchTask,
  FrameworkLane,
  Metrics,
  ModelPricing,
  RawTraceRecord,
  Rubric,
  RubricItem,
  RunManifest,
  RunStopCause,
  RunSummary,
  Score,
  ScoreComponent,
  StopReason,
  TaskAttemptResult,
  TestRunResult,
  TokenUsage,
  TurnObservation,
  WeightPreset,
} from './src/domain/mod.ts';
export { addUsage, costOf, summarizeProbes, ZERO_USAGE } from './src/domain/mod.ts';
export type { FrozenSuite, ProbeContext, ProbeDefinition } from './src/domain/frozen-suite.ts';

// Ports.
export type {
  AgentDriver,
  Clock,
  CommandExecutor,
  HttpClient,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  Reporter,
  Sandbox,
  SandboxProvider,
  TestRunner,
  TokenMeter,
  TraceReporter,
} from './src/ports/mod.ts';
export { BufferSink } from './src/ports/mod.ts';

// Application.
export {
  type BenchRunner,
  type BenchRunnerDeps,
  createBenchRunner,
  type RunCaps,
  type TaskAttemptInput,
  type TaskAttemptOutput,
} from './src/application/runner/bench-runner.ts';
export { buildRunSummary } from './src/application/runner/summarize.ts';
export {
  BenchRunBuilder,
  type BenchRunDefinition,
  defineBenchRun,
} from './src/application/builders/define-bench-run.ts';
export { clamp, normalize, normalizeMetric } from './src/application/scoring/normalizer.ts';
export { scoreMetrics } from './src/application/scoring/scorer.ts';

// Adapters (real + fake).
export {
  ClaudeCodeDriver,
  type ClaudeCodeOptions,
} from './src/adapters/agent/claude-code-adapter.ts';
export { FakeAgentDriver, type ScriptedTurn } from './src/adapters/agent/fake-driver.ts';
export {
  type LocalWorkspaceOptions,
  LocalWorkspaceSandbox,
} from './src/adapters/sandbox/local-workspace.ts';
export {
  type BootedService,
  DenoHttpTestRunner,
  type DenoHttpTestRunnerDeps,
  DynamicImportSuiteLoader,
  type ServiceHarness,
  type SuiteLoader,
} from './src/adapters/test-runner/deno-http.ts';
export { FetchHttpClient } from './src/adapters/http/fetch-http-client.ts';
export { DenoCommandExecutor } from './src/adapters/command/deno-command-executor.ts';
export { PricingTokenMeter } from './src/adapters/token-meter/pricing-token-meter.ts';
export { SystemClock } from './src/adapters/clock/system-clock.ts';
export { JsonReporter } from './src/adapters/reporting/json-reporter.ts';
export { MarkdownSummaryReporter } from './src/adapters/reporting/markdown-summary.ts';
export { JsonlTraceReporter } from './src/adapters/reporting/jsonl-trace.ts';
