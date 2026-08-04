/** Agent hosts supported by `netscript agent init`. */
export const AGENT_HOSTS = ["claude", "vscode"] as const;
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

/** Result of one idempotent agent installation. */
export interface InitAgentResult {
  readonly hosts: readonly AgentHost[];
  readonly changedFiles: readonly string[];
  readonly messages: readonly string[];
}
import type { EditorChoice } from '../../../../kernel/domain/scaffold/workspace-config.ts';
