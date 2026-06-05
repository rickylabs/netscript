import type { Evidence } from './evidence.ts';
import type { RunContext } from './run-context.ts';
import type { GateId, GatePhase } from './cli-surface.ts';
import type { CommandOutputMode } from '../ports/command-executor.ts';

/** Gate verdicts emitted by the runner. */
export type GateVerdict = 'passed' | 'failed' | 'skipped';

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
  readonly error?: string;
}

/** Shared gate metadata. */
export interface BaseGateDefinition {
  readonly id: GateId;
  readonly title: string;
  readonly phase: GatePhase;
  readonly critical: boolean;
}

/** Semantic gate backed by a CLI command. */
export interface CommandGateDefinition extends BaseGateDefinition {
  readonly kind: 'command';
  readonly cwd: WorkingDirectoryFactory;
  readonly command: CommandFactory;
  readonly outputMode?: CommandOutputMode;
  readonly failureHint?: string;
}

/** Semantic gate backed by an HTTP health probe. */
export interface HttpGateDefinition extends BaseGateDefinition {
  readonly kind: 'http';
  readonly method: 'GET' | 'POST';
  readonly url: UrlFactory;
}

/** Semantic gate definition. */
export type GateDefinition = CommandGateDefinition | HttpGateDefinition;
