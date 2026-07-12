/**
 * Token-bounded MCP contracts, registry, and server composition for NetScript.
 * @module
 */

export { createToolRegistry } from './src/application/tool-registry.ts';
export { createMcpServer, MCP_PROTOCOL_VERSION } from './src/application/runner/mcp-server.ts';
export type { McpServer, McpServerOptions } from './src/application/runner/mcp-server.ts';
export { DEFAULT_TRUNCATION_POLICY, truncateResult } from './src/application/runner/truncation.ts';
export type { TruncationPolicy } from './src/application/runner/truncation.ts';
export { TOOL_INPUT_SCHEMAS, TOOL_OUTPUT_SCHEMAS } from './src/domain/tool-contracts.ts';
export type { DoctorCheck, DoctorResult, DoctorStatus } from './src/domain/tool-contracts.ts';
export type { DoctorCounts } from './src/domain/tool-contracts.ts';
export type { JsonSchema, ToolSchema } from './src/domain/schema.ts';
export { validateSchema } from './src/domain/schema.ts';
export { TOOL_NAMES } from './src/domain/tool-types.ts';
export type {
  ToolDefinition,
  ToolError,
  ToolExecutionResult,
  ToolFailure,
  ToolFlow,
  ToolKind,
  ToolName,
  ToolSuccess,
} from './src/domain/tool-types.ts';
export type { JsonRpcError, JsonRpcRequest, JsonRpcResponse } from './src/presentation/json-rpc.ts';
export type {
  TelemetryProbePort,
  TelemetryProbeResult,
} from './src/domain/telemetry-probe-port.ts';
export { MAX_INDEXED_DOC_LENGTH, slugifyDocsHeading } from './src/domain/docs-corpus-port.ts';
export type {
  DocsCorpusPort,
  DocsDocument,
  DocsSearchMatch,
  DocsSection,
  DocsSummary,
} from './src/domain/docs-corpus-port.ts';
export { FilesystemDocsCorpus } from './src/infrastructure/filesystem-docs-corpus.ts';
export type { FilesystemDocsCorpusOptions } from './src/infrastructure/filesystem-docs-corpus.ts';
