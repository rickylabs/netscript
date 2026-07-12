/**
 * Executable stdio entrypoint for the NetScript MCP server.
 * @module
 */
import { createMcpServer } from './src/application/runner/mcp-server.ts';
import {
  FetchTelemetryProbe,
  readTelemetryEndpointEnvironment,
} from './src/infrastructure/fetch-telemetry-probe.ts';
import { runNewlineStdio } from './src/infrastructure/stdio-transport.ts';

/** Run the MCP server on Deno standard input and output. */
export async function runMcpStdioServer(): Promise<void> {
  const server = createMcpServer({
    probe: new FetchTelemetryProbe(),
    environmentEndpoint: readTelemetryEndpointEnvironment(),
  });
  await runNewlineStdio(server, Deno.stdin.readable, Deno.stdout.writable);
}

if (import.meta.main) await runMcpStdioServer();
