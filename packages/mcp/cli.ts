/**
 * Executable stdio entrypoint for the NetScript MCP server.
 * @module
 */
import { createMcpServer } from './src/application/runner/mcp-server.ts';
import type { McpServer } from './src/application/runner/mcp-server.ts';
import { createDocsFlows } from './src/application/flows/docs-flows.ts';
import { FetchTelemetryProbe } from './src/infrastructure/fetch-telemetry-probe.ts';
import {
  createAspireDashboardFetch,
  createResolvedTelemetryQuery,
  readTelemetryEndpointEnvironment,
} from './src/infrastructure/telemetry-query-adapter.ts';
import { runNewlineStdio } from './src/infrastructure/stdio-transport.ts';
import { FilesystemDocsCorpus } from './src/infrastructure/filesystem-docs-corpus.ts';
import { EmbeddedDocsCorpus } from './src/infrastructure/embedded-docs-corpus.ts';
import { resolve } from '@std/path';
import { MCP_PACKAGE_README } from './src/publish-assets.generated.ts';
import { createGetAppStatusFlow } from './src/application/flows/get-app-status-flow.ts';
import { createGetRecentErrorsFlow } from './src/application/flows/get-recent-errors-flow.ts';
import { createGetRunFlow } from './src/application/flows/get-run-flow.ts';
import { createListRunsFlow } from './src/application/flows/list-runs-flow.ts';
import { createGetLastJobResultFlow } from './src/application/flows/get-last-job-result-flow.ts';
import { createAnalyzeServicePerformanceFlow } from './src/application/flows/analyze-service-performance-flow.ts';
import { createAnalyzeDbBottlenecksFlow } from './src/application/flows/analyze-db-bottlenecks-flow.ts';
import { AspireDoctorFamily } from './src/infrastructure/aspire-doctor-family.ts';
import {
  PluginDoctorFamily,
  UnwiredProjectDoctor,
} from './src/infrastructure/plugin-doctor-family.ts';
import { ProjectWiringDoctorFamily } from './src/infrastructure/project-wiring-doctor-family.ts';
import { createDoctorFlow } from './src/application/flows/doctor-flow.ts';
import type { CommandCatalogPort } from './src/domain/command-catalog-port.ts';
import type { CommandExecutorPort } from './src/domain/command-executor-port.ts';
import type { ProjectDoctorPort } from './src/domain/project-doctor-port.ts';
import { type CommandPolicy, DEFAULT_COMMAND_POLICY } from './src/domain/command-policy.ts';
import { createListCommandsFlow } from './src/application/flows/list-commands-flow.ts';
import { createExecuteCommandFlow } from './src/application/flows/execute-command-flow.ts';
import { StaticCommandCatalog } from './src/infrastructure/static-command-catalog.ts';
import { SpawnCommandExecutor } from './src/infrastructure/spawn-command-executor.ts';

export * from './mod.ts';

/** Optional CLI trigger collaborators and policy supplied by an outer composition. */
export interface McpCliOptions {
  /** Dynamic command catalog, supplied by the NetScript CLI in S7. */ readonly commandCatalog?:
    CommandCatalogPort;
  /** Command execution adapter. */ readonly commandExecutor?: CommandExecutorPort;
  /** Override for the conservative command allowlist. */ readonly commandPolicy?: CommandPolicy;
  /** Real project diagnostics supplied by the NetScript CLI. */ readonly projectDoctor?:
    ProjectDoctorPort;
  /** Project root used by docs, execution, and doctor flows. */ readonly projectRoot?: string;
  /** Explicit public documentation corpus root. */ readonly docsRoot?: string;
  /** Explicit telemetry endpoint supplied by the outer CLI. */ readonly endpoint?: string;
}

/** Resolve an explicit public documentation override from flags or environment. */
export function resolveDocsRoot(
  args: readonly string[] = Deno.args,
  environmentRoot: string | undefined = Deno.env.get('NETSCRIPT_DOCS_ROOT'),
  projectRoot: string = Deno.cwd(),
): string | undefined {
  const flagIndex = args.indexOf('--docs-root');
  const flagRoot = flagIndex >= 0 ? args[flagIndex + 1] : undefined;
  if (flagRoot) return resolve(projectRoot, flagRoot);
  return environmentRoot ? resolve(projectRoot, environmentRoot) : undefined;
}

/** Run the MCP server on Deno standard input and output. */
export async function runMcpStdioServer(
  options: McpCliOptions = {},
): Promise<void> {
  const projectRoot = options.projectRoot ?? Deno.cwd();
  const docsRoot = options.docsRoot ?? resolveDocsRoot(Deno.args, undefined, projectRoot);
  const server = createMcpCliServer({
    ...options,
    ...(docsRoot ? { docsRoot } : {}),
  });
  await runNewlineStdio(server, Deno.stdin.readable, Deno.stdout.writable);
}

/** Compose the generic MCP server with optional outer CLI adapters. */
export function createMcpCliServer(options: McpCliOptions = {}): McpServer {
  const projectRoot = options.projectRoot ?? Deno.cwd();
  const environment = {
    ...readTelemetryEndpointEnvironment(),
    ...(options.endpoint ? { NETSCRIPT_TELEMETRY_ENDPOINT: options.endpoint } : {}),
  };
  const query = createResolvedTelemetryQuery(undefined, environment);
  const configuredDocsRoot = options.docsRoot ??
    resolveDocsRoot([], Deno.env.get('NETSCRIPT_DOCS_ROOT'), projectRoot);
  const docsCorpus = configuredDocsRoot
    ? new FilesystemDocsCorpus({ root: configuredDocsRoot })
    : new EmbeddedDocsCorpus({
      documents: [{ slug: 'mcp', source: MCP_PACKAGE_README }],
    });
  const probe = new FetchTelemetryProbe((endpoint) =>
    createAspireDashboardFetch(endpoint, {}) ?? fetch
  );
  return createMcpServer({
    probe,
    environment,
    flows: {
      ...createDocsFlows(docsCorpus),
      get_app_status: createGetAppStatusFlow(query),
      list_runs: createListRunsFlow(query),
      get_run: createGetRunFlow(query),
      get_recent_errors: createGetRecentErrorsFlow(query),
      get_last_job_result: createGetLastJobResultFlow(query),
      analyze_service_performance: createAnalyzeServicePerformanceFlow(query),
      analyze_db_bottlenecks: createAnalyzeDbBottlenecksFlow(query),
      list_commands: createListCommandsFlow(
        options.commandCatalog ?? new StaticCommandCatalog(),
      ),
      execute_command: createExecuteCommandFlow(
        options.commandExecutor ?? new SpawnCommandExecutor(),
        options.commandPolicy ?? DEFAULT_COMMAND_POLICY,
      ),
      doctor: createDoctorFlow(probe, environment, [
        new AspireDoctorFamily(),
        new ProjectWiringDoctorFamily(),
        new PluginDoctorFamily(
          options.projectDoctor ?? new UnwiredProjectDoctor(),
        ),
      ], projectRoot),
    },
  });
}

if (import.meta.main) await runMcpStdioServer();
