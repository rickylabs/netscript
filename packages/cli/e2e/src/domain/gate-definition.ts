import type { Evidence } from './evidence.ts';
import type { RunContext } from './run-context.ts';
import type { GateId, GatePhase } from './cli-surface.ts';
import type { CommandOutputMode } from '../ports/command-executor.ts';
import type { ExecutionPlatform } from './platform.ts';

/** Gate verdicts emitted by the runner. */
export type GateVerdict = 'passed' | 'failed' | 'skipped';

/** Stable classification used to decide whether a command attempt may be retried. */
export type GateFailureClass =
  | 'timeout'
  | 'canceled'
  | 'infrastructure'
  | 'harness-invocation'
  | 'assertion';

/** Result of one execution attempt within a gate. */
export type GateAttempt = {
  readonly attempt: number;
  readonly verdict: 'passed' | 'failed';
  readonly durationMs: number;
  readonly failureClass?: GateFailureClass;
  readonly exitCode?: number;
};

/** Opt-in retry policy for command gates. */
export interface CommandGateRetryPolicy {
  readonly classes: readonly GateFailureClass[];
  readonly maxRetries: 1 | 2;
}

/** Maps one intentional command exit to an explicit skipped gate verdict. */
export interface CommandGateSkipPolicy {
  readonly exitCode: number;
  readonly message: string;
}

/** Build a command from the current run context. */
export type CommandFactory = (context: RunContext) => readonly string[];

/** Resolve a working directory from the current run context. */
export type WorkingDirectoryFactory = (context: RunContext) => string;

/** Resolve an HTTP URL from the current run context. */
export type UrlFactory = (context: RunContext) => string;

/** Result returned by a gate implementation. */
export interface GateResult {
  readonly id: GateId;
  readonly title: string;
  readonly verdict: GateVerdict;
  readonly critical: boolean;
  readonly evidence: readonly Evidence[];
  readonly attempts: GateAttempt[];
  readonly retried: boolean;
  readonly message?: string;
  readonly error?: string;
}

/** Shared gate metadata. */
export interface BaseGateDefinition {
  readonly id: GateId;
  readonly title: string;
  readonly phase: GatePhase;
  readonly critical: boolean;
  readonly platforms?: readonly ExecutionPlatform[];
}

/** Semantic gate backed by a CLI command. */
export interface CommandGateDefinition extends BaseGateDefinition {
  readonly kind: 'command';
  readonly cwd: WorkingDirectoryFactory;
  readonly command: CommandFactory;
  readonly outputMode?: CommandOutputMode;
  readonly failureHint?: string;
  /** Exit code required for this gate; defaults to zero. */
  readonly expectedExitCode?: number;
  /** Substrings that must all appear in captured standard output. */
  readonly stdoutIncludes?: readonly string[];
  readonly retry?: CommandGateRetryPolicy;
  readonly skip?: CommandGateSkipPolicy;
  /** Gate-specific timeout override; defaults to the suite command timeout. */
  readonly timeoutMs?: number;
  /** Stable failure class for commands whose boundary is known before execution. */
  readonly failureClass?: GateFailureClass;
}

/** Semantic gate backed by an HTTP health probe. */
export interface HttpGateDefinition extends BaseGateDefinition {
  readonly kind: 'http';
  readonly method: 'GET' | 'POST';
  readonly url: UrlFactory;
}

/** Semantic gate definition. */
export type GateDefinition = CommandGateDefinition | HttpGateDefinition;
