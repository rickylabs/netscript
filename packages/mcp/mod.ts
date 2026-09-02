/**
 * Token-bounded MCP contracts, registry, and server composition for NetScript.
 * @module
 */

export { createToolRegistry } from './src/application/tool-registry.ts';
export {
  createMcpServer,
  MCP_AGENT_INSTRUCTIONS,
  MCP_PROTOCOL_VERSION,
} from './src/application/runner/mcp-server.ts';
export {
  createRecordDriftFlow,
  DIAGNOSTIC_RECEIPT_TTL_MS,
  diagnosticEvidenceRefusal,
  recordDrift,
} from './src/application/flows/record-drift-flow.ts';
export type { RecordDriftInput } from './src/application/flows/record-drift-flow.ts';
export {
  API_SERVICE_RESULT_LIMIT,
  createListApiServicesFlow,
} from './src/application/flows/list-api-services-flow.ts';
export type {
  ApiServiceSummary,
  ListApiServicesResult,
} from './src/application/flows/list-api-services-flow.ts';
export {
  createListServiceOperationsFlow,
  SERVICE_OPERATION_RESULT_LIMIT,
} from './src/application/flows/list-service-operations-flow.ts';
export type {
  ListServiceOperationsResult,
  ServiceOperationSummary,
} from './src/application/flows/list-service-operations-flow.ts';
export {
  createGetOperationSchemaFlow,
  OPENAPI_CURL_AUTH_NOTE,
} from './src/application/flows/get-operation-schema-flow.ts';
export type { GetOperationSchemaResult } from './src/application/flows/get-operation-schema-flow.ts';
export type {
  DiagnosticEvidencePort,
  DiagnosticEvidenceReceipt,
} from './src/domain/diagnostic-evidence-port.ts';
export { FilesystemDiagnosticEvidence } from './src/infrastructure/filesystem-diagnostic-evidence.ts';
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
  CliExecutionIdentity,
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
export {
  createExportSurfaceFlows,
  EXPORT_JSDOC_CHARACTER_LIMIT,
  EXPORT_SIGNATURE_CHARACTER_LIMIT,
  FIND_EXPORT_RESULT_LIMIT,
  LIST_PACKAGE_EXPORT_RESULT_LIMIT,
  SEARCH_EXPORT_RESULT_LIMIT,
} from './src/application/export-surfaces/export-surface-flows.ts';
export type { ExportSurfaceToolName } from './src/application/export-surfaces/export-surface-flows.ts';
export { EXPORT_SURFACE_SCHEMA_VERSION } from './src/ports/export-surface-corpus-port.ts';
export type {
  ExportSurfaceCorpus,
  ExportSurfaceCorpusPort,
  ExportSurfaceCorpusProvenance,
  ExportSurfaceEntry,
  ExportSurfaceSubpath,
} from './src/ports/export-surface-corpus-port.ts';
export { EmbeddedExportSurfaceCorpus } from './src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts';
export type {
  EmbeddedExportSurfaceCorpusOptions,
  EmbeddedExportSurfaceSource,
} from './src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts';
export type { JsonRpcError, JsonRpcRequest, JsonRpcResponse } from './src/domain/json-rpc.ts';
export type {
  TelemetryProbePort,
  TelemetryProbeResult,
} from './src/domain/telemetry-probe-port.ts';
export {
  DEFAULT_TELEMETRY_ENDPOINT,
  resolveTelemetryEndpoint,
} from './src/domain/telemetry-endpoint.ts';
export type {
  AspirePsDashboardPort,
  ResolvedTelemetryEndpoint,
  TelemetryEndpointEnvironment,
  TelemetryEndpointSource,
} from './src/domain/telemetry-endpoint.ts';
export { AspirePsDashboardReader } from './src/infrastructure/aspire-ps-dashboard-reader.ts';
export type {
  AspirePsCommand,
  AspirePsCommandResult,
  AspirePsDashboardReaderOptions,
} from './src/infrastructure/aspire-ps-dashboard-reader.ts';
export {
  DocsCorpusUnavailableError,
  MAX_INDEXED_DOC_LENGTH,
  slugifyDocsHeading,
} from './src/domain/docs/docs-corpus-port.ts';
export {
  GUIDANCE_CONFIDENCE_LEVELS,
  GUIDANCE_DEFAULT_RECOMMENDATIONS,
  GUIDANCE_LINK_RELATIONS,
  GUIDANCE_MAX_CODE_CHARACTERS,
  GUIDANCE_MAX_CODE_EXCERPTS_PER_RECOMMENDATION,
  GUIDANCE_MAX_EXCERPT_CHARACTERS,
  GUIDANCE_MAX_FALLBACK_CHARACTERS,
  GUIDANCE_MAX_INTENT_CHARACTERS,
  GUIDANCE_MAX_RECOMMENDATIONS,
  GUIDANCE_MAX_RELATED_LINKS,
  GUIDANCE_MAX_WHY_CHARACTERS,
  GUIDANCE_STAGES,
} from './src/domain/docs/guidance-contract.ts';
export type {
  GuidanceCodeExcerpt,
  GuidanceConfidence,
  GuidanceLinkRelation,
  GuidanceRecommendation,
  GuidanceRelatedLink,
  GuidanceResult,
  GuidanceSectionCitation,
  GuidanceStage,
} from './src/domain/docs/guidance-contract.ts';
export { createFindGuidanceFlow } from './src/application/docs/find-guidance-flow.ts';
export type {
  DocsCorpusPort,
  DocsDocument,
  DocsSearchMatch,
  DocsSection,
  DocsSummary,
} from './src/domain/docs/docs-corpus-port.ts';
export { FilesystemDocsCorpus } from './src/infrastructure/filesystem-docs-corpus.ts';
export type { FilesystemDocsCorpusOptions } from './src/infrastructure/filesystem-docs-corpus.ts';
export { EmbeddedDocsCorpus } from './src/infrastructure/embedded-docs-corpus.ts';
export type {
  EmbeddedDocsCorpusOptions,
  EmbeddedDocsSource,
} from './src/infrastructure/embedded-docs-corpus.ts';
export {
  createServiceEndpointDirectory,
  DEFAULT_SERVICE_ENDPOINT_CONCURRENCY,
  DEFAULT_SERVICE_ENDPOINT_TIMEOUT_MS,
} from './src/application/service-endpoint-directory.ts';
export type { ServiceEndpointDirectoryOptions } from './src/application/service-endpoint-directory.ts';
export {
  ENDPOINT_SOURCE_PRECEDENCE,
  ENDPOINT_SOURCES,
  SERVICE_ENDPOINT_STATUSES,
  SOURCE_FAILURE_CODES,
} from './src/ports/service-endpoint-directory-port.ts';
export type {
  AbsentSourceOutcome,
  EndpointCandidate,
  EndpointConflict,
  EndpointSource,
  EndpointSourceContext,
  EndpointSourcePort,
  ExcludedServiceEndpointRow,
  FailedServiceEndpointProbeResult,
  FailedSourceOutcome,
  IdentityMismatchServiceEndpointRow,
  NotRunningServiceEndpointRow,
  RunningServiceEndpointProbeResult,
  RunningServiceEndpointRow,
  ServiceEndpointDirectoryPort,
  ServiceEndpointDirectoryResult,
  ServiceEndpointProbePort,
  ServiceEndpointProbeResult,
  ServiceEndpointRow,
  ServiceEndpointRowBase,
  ServiceEndpointStatus,
  SourceFailureCode,
  SourceOutcome,
  SpecUnavailableServiceEndpointRow,
  UsedSourceOutcome,
} from './src/ports/service-endpoint-directory-port.ts';
export { AppsettingsEndpointSource } from './src/infrastructure/service-endpoints/appsettings-endpoint-source.ts';
export type { AppsettingsEndpointSourceOptions } from './src/infrastructure/service-endpoints/appsettings-endpoint-source.ts';
export { AspireCliEndpointSource } from './src/infrastructure/service-endpoints/aspire-cli-endpoint-source.ts';
export type {
  AspireCliCommand,
  AspireCliCommandResult,
  AspireCliEndpointSourceOptions,
} from './src/infrastructure/service-endpoints/aspire-cli-endpoint-source.ts';
export {
  DEFAULT_SERVICE_ENDPOINT_RESPONSE_BYTE_LIMIT,
  FetchServiceEndpointProbe,
  SPEC_UNAVAILABLE_AUTH_GUIDANCE,
} from './src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts';
export type { FetchServiceEndpointProbeOptions } from './src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts';
export { OverrideEndpointSource } from './src/infrastructure/service-endpoints/override-endpoint-source.ts';
export type { OverrideEndpointSourceOptions } from './src/infrastructure/service-endpoints/override-endpoint-source.ts';
export { RunManifestEndpointSource } from './src/infrastructure/service-endpoints/run-manifest-endpoint-source.ts';
export type { RunManifestEndpointSourceOptions } from './src/infrastructure/service-endpoints/run-manifest-endpoint-source.ts';
