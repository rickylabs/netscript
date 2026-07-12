/**
 * Executable stdio entrypoint for the NetScript MCP server.
 * @module
 */
import { createMcpServer } from './src/application/runner/mcp-server.ts';
import { FetchTelemetryProbe } from './src/infrastructure/fetch-telemetry-probe.ts';
import {
  createResolvedTelemetryQuery,
  readTelemetryEndpointEnvironment,
} from './src/infrastructure/telemetry-query-adapter.ts';
import { runNewlineStdio } from './src/infrastructure/stdio-transport.ts';
import { createGetAppStatusFlow } from './src/application/flows/get-app-status-flow.ts';
import { createGetRecentErrorsFlow } from './src/application/flows/get-recent-errors-flow.ts';
import { createGetRunFlow } from './src/application/flows/get-run-flow.ts';
import { createListRunsFlow } from './src/application/flows/list-runs-flow.ts';

/** Run the MCP server on Deno standard input and output. */
export async function runMcpStdioServer(): Promise<void> {
  const environment = readTelemetryEndpointEnvironment();
  const query = createResolvedTelemetryQuery(undefined, environment);
  const server = createMcpServer({
    probe: new FetchTelemetryProbe(),
    environment,
    flows: {
      get_app_status: createGetAppStatusFlow(query),
      list_runs: createListRunsFlow(query),
      get_run: createGetRunFlow(query),
      get_recent_errors: createGetRecentErrorsFlow(query),
    },
  });
  await runNewlineStdio(server, Deno.stdin.readable, Deno.stdout.writable);
}

if (import.meta.main) await runMcpStdioServer();
