/** Compare MCP and the installed Aspire CLI against the same supported HTTP API fake. */
import {
  FakeDashboard,
  SNAPSHOT_NOW,
} from '../../../packages/mcp/tests/telemetry-dashboard-fixtures.ts';
import { executeAspireCliCommand } from '../../../packages/mcp/src/infrastructure/service-endpoints/aspire-cli-command.ts';
import { extractAspireJson } from '../../../packages/mcp/src/infrastructure/service-endpoints/aspire-cli-output.ts';

const dashboard = new FakeDashboard();
try {
  const snapshot = await dashboard.reader().readSnapshot({
    service: 'api',
    sinceUnixMs: SNAPSHOT_NOW - 60_000,
    untilUnixMs: SNAPSHOT_NOW,
  }, AbortSignal.timeout(10_000));
  if (!snapshot.ok) throw new Error('MCP fixture acquisition failed');
  const cli = await executeAspireCliCommand('aspire', [
    'otel',
    'traces',
    'api',
    '--dashboard-url',
    dashboard.endpoint,
    '--format',
    'Json',
    '--nologo',
    '--non-interactive',
  ], AbortSignal.timeout(10_000));
  if (cli.code !== 0) throw new Error('Aspire CLI fixture acquisition failed');
  const traces = JSON.parse(extractAspireJson(cli.stdout)) as { traceId: string }[];
  const mcpTraceIds = [...new Set(snapshot.spans.map((span) => span.traceId))].sort();
  const cliTraceIds = [...new Set(traces.map((trace) => trace.traceId))].sort();
  if (JSON.stringify(mcpTraceIds) !== JSON.stringify(cliTraceIds)) {
    throw new Error('CLI and MCP trace IDs differ');
  }
  console.log(JSON.stringify({
    ok: true,
    cliExitCode: cli.code,
    mcpTraceIds,
    cliTraceIds,
    source: 'supported fake dashboard API',
    liveAppHost: false,
  }));
} finally {
  await dashboard.close();
}
