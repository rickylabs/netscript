/** Options accepted by `netscript agent mcp`. */
export interface AgentMcpInput {
  readonly endpoint?: string;
  readonly projectRoot: string;
  readonly docsRoot?: string;
}
