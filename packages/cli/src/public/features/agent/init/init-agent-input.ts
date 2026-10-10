/** Agent hosts supported by `netscript agent init`; `--host all` selects every entry. */
export const AGENT_HOSTS = ["claude", "vscode", "opencode"] as const;
/** Supported agent host identifier. */
export type AgentHost = typeof AGENT_HOSTS[number];

/** Input for installing NetScript agent integration into a project. */
export interface InitAgentInput {
  readonly projectRoot: string;
  readonly host?: AgentHost | "all";
  /** Editor setup to apply; inferred from existing project config when omitted. */
  readonly editor?: EditorChoice;
  readonly withDocs?: boolean;
}

/**
 * Which input decided a resolved value, in precedence order: an explicit flag, existing project
 * configuration, the invoking environment, then the built-in default.
 */
export type AgentResolutionSource = "flag" | "project" | "environment" | "default";

/** One observed input: a flag, a project marker, or an environment variable name (never its value). */
export interface AgentResolutionSignal {
  readonly source: AgentResolutionSource;
  readonly name: string;
}

/** A resolved value, the highest-precedence source that decided it, and every signal it used. */
export interface AgentResolution<T> {
  readonly value: T;
  readonly source: AgentResolutionSource;
  readonly signals: readonly AgentResolutionSignal[];
}

/** How the agent hosts and editor of one installation were resolved. */
export interface AgentInitResolution {
  readonly hosts: AgentResolution<readonly AgentHost[]>;
  readonly editor: AgentResolution<EditorChoice>;
}

/** Result of one idempotent agent installation. */
export interface InitAgentResult {
  readonly hosts: readonly AgentHost[];
  readonly resolution: AgentInitResolution;
  readonly changedFiles: readonly string[];
  readonly messages: readonly string[];
}
import type { EditorChoice } from '../../../../kernel/domain/scaffold/workspace-config.ts';
