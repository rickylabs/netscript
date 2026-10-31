/**
 * The complete published Markdown corpus shared by MCP retrieval and CLI offline installation.
 * Each page is independently compressed and verified; the full concatenation is derived.
 *
 * @example
 * ```ts
 * import { decodeAgentDocsPages, EMBEDDED_AGENT_DOCS_PAGES } from '@netscript/mcp/docs';
 * const pages = await decodeAgentDocsPages(EMBEDDED_AGENT_DOCS_PAGES);
 * console.log(pages['pages/reference/kv/index.md']);
 * ```
 * @module
 */
export { EMBEDDED_AGENT_DOCS_PAGES } from './src/infrastructure/docs/agent-docs-prose.generated.ts';
export {
  agentDocsFullCorpus,
  decodeAgentDocsPages,
} from './src/infrastructure/docs/agent-docs-transport.ts';
export type { AgentDocsPage } from './src/infrastructure/docs/agent-docs-transport.ts';
