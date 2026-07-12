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
export type {
  DoctorCheckContext,
  DoctorCheckFamily,
  DoctorFamilyName,
  DoctorFamilyResult,
} from './src/domain/doctor-check-family.ts';
export type { ProjectDoctorPort } from './src/domain/project-doctor-port.ts';
export type { CommandCatalogPort, CommandDescriptor } from './src/domain/command-catalog-port.ts';
export type {
  CommandExecutionRequest,
  CommandExecutionResult,
  CommandExecutorPort,
} from './src/domain/command-executor-port.ts';
export { decideCommand, DEFAULT_COMMAND_POLICY } from './src/domain/command-policy.ts';
export type {
  CommandPolicy,
  CommandPolicyDecision,
  CommandPolicyRule,
} from './src/domain/command-policy.ts';
export { createDoctorFlow } from './src/application/flows/doctor-flow.ts';
export { createListCommandsFlow } from './src/application/flows/list-commands-flow.ts';
export { createExecuteCommandFlow } from './src/application/flows/execute-command-flow.ts';
export {
  StaticCommandCatalog,
  UNWIRED_COMMAND_DESCRIPTOR,
} from './src/infrastructure/static-command-catalog.ts';
export {
  DEFAULT_CLI_COMMAND,
  DEFAULT_COMMAND_TIMEOUT_MS,
  DEFAULT_OUTPUT_TAIL_BYTES,
  SpawnCommandExecutor,
} from './src/infrastructure/spawn-command-executor.ts';
export type { SpawnCommandExecutorOptions } from './src/infrastructure/spawn-command-executor.ts';
export { PluginDoctorFamily } from './src/infrastructure/plugin-doctor-family.ts';
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
export type { TelemetryEndpointEnvironment } from './src/domain/telemetry-endpoint.ts';
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
