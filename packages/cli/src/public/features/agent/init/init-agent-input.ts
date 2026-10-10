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

/** A resolved value with the source that decided it and the signals that source observed. */
export interface AgentResolution<T> {
  readonly value: T;
  readonly source: AgentResolutionSource;
  /** Flags, project markers, or environment variable names; never environment values. */
  readonly signals: readonly string[];
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
