/**
 * Executable stdio entrypoint for the NetScript MCP server.
 * @module
 */
import { createMcpServer } from './src/application/runner/mcp-server.ts';
import { createDocsFlows } from './src/application/flows/docs-flows.ts';
import {
  FetchTelemetryProbe,
  readTelemetryEndpointEnvironment,
} from './src/infrastructure/fetch-telemetry-probe.ts';
import { runNewlineStdio } from './src/infrastructure/stdio-transport.ts';
import { FilesystemDocsCorpus } from './src/infrastructure/filesystem-docs-corpus.ts';
import { resolve } from '@std/path';

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
  const docsCorpus = new FilesystemDocsCorpus({ root: resolveDocsRoot() });
  const server = createMcpServer({
    probe: new FetchTelemetryProbe(),
    environmentEndpoint: readTelemetryEndpointEnvironment(),
    flows: createDocsFlows(docsCorpus),
  });
  await runNewlineStdio(server, Deno.stdin.readable, Deno.stdout.writable);
}

if (import.meta.main) await runMcpStdioServer();
