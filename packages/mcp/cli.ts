/**
 * Executable stdio entrypoint for the NetScript MCP server.
 * @module
 */
import { createMcpServer } from './src/application/runner/mcp-server.ts';
import { createDocsFlows } from './src/application/flows/docs-flows.ts';
import { FetchTelemetryProbe } from './src/infrastructure/fetch-telemetry-probe.ts';
import {
  createResolvedTelemetryQuery,
  readTelemetryEndpointEnvironment,
} from './src/infrastructure/telemetry-query-adapter.ts';
import { runNewlineStdio } from './src/infrastructure/stdio-transport.ts';
import { FilesystemDocsCorpus } from './src/infrastructure/filesystem-docs-corpus.ts';
import { resolve } from '@std/path';
import { createGetAppStatusFlow } from './src/application/flows/get-app-status-flow.ts';
import { createGetRecentErrorsFlow } from './src/application/flows/get-recent-errors-flow.ts';
import { createGetRunFlow } from './src/application/flows/get-run-flow.ts';
import { createListRunsFlow } from './src/application/flows/list-runs-flow.ts';

/** Resolve the public documentation root from flags, environment, or the project directory. */
export function resolveDocsRoot(
  args: readonly string[] = Deno.args,
  environmentRoot: string | undefined = Deno.env.get('NETSCRIPT_DOCS_ROOT'),
  projectRoot: string = Deno.cwd(),
): string {
  const flagIndex = args.indexOf('--docs-root');
  const flagRoot = flagIndex >= 0 ? args[flagIndex + 1] : undefined;
  if (flagRoot) return resolve(projectRoot, flagRoot);
  return resolve(projectRoot, environmentRoot || 'docs/site');
}

/** Run the MCP server on Deno standard input and output. */
export async function runMcpStdioServer(): Promise<void> {
  const environment = readTelemetryEndpointEnvironment();
  const query = createResolvedTelemetryQuery(undefined, environment);
  const docsCorpus = new FilesystemDocsCorpus({ root: resolveDocsRoot() });
  const server = createMcpServer({
    probe: new FetchTelemetryProbe(),
    environment,
    flows: {
      ...createDocsFlows(docsCorpus),
      get_app_status: createGetAppStatusFlow(query),
      list_runs: createListRunsFlow(query),
      get_run: createGetRunFlow(query),
      get_recent_errors: createGetRecentErrorsFlow(query),
    },
  });
  await runNewlineStdio(server, Deno.stdin.readable, Deno.stdout.writable);
}

if (import.meta.main) await runMcpStdioServer();
