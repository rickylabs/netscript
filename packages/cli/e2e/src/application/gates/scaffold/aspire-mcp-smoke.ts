import { dirname, join, resolve } from '@std/path';
import { SCAFFOLD_VERSIONS } from '../../../../../src/kernel/constants/scaffold/scaffold-versions.ts';
import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { CommandGateDefinition } from '../../../domain/gate-definition.ts';
import { generatedAppName } from './runtime/generated-app-name.ts';
import type {
  AspireMcpEntryPoint,
  AspireMcpSmokeDependencies,
  AspireMcpSmokeInput,
  AspireMcpSmokeReceipt,
  AspireMcpTimeouts,
  AspireMcpTransport,
} from './aspire-mcp/contract.ts';
import { runAspireMcpSmoke } from './aspire-mcp/evaluate.ts';
import {
  ASPIRE_MCP_BASELINE_TOOLS,
  ASPIRE_MCP_DASHBOARD_TOOLS,
  ASPIRE_MCP_EXPECTED_TOOLS,
  diffAspireMcpTools,
} from './aspire-mcp/tools.ts';
import { createStdioAspireMcpTransport } from './aspire-mcp/stdio-transport.ts';

export {
  ASPIRE_MCP_BASELINE_TOOLS,
  ASPIRE_MCP_DASHBOARD_TOOLS,
  ASPIRE_MCP_EXPECTED_TOOLS,
  diffAspireMcpTools,
  runAspireMcpSmoke,
};
export type {
  AspireMcpEntryPoint,
  AspireMcpSmokeDependencies,
  AspireMcpSmokeInput,
  AspireMcpSmokeReceipt,
  AspireMcpTimeouts,
  AspireMcpTransport,
};

export const ASPIRE_MCP_SMOKE_SKIP_EXIT_CODE = 20;
export const ASPIRE_MCP_SMOKE_TIMEOUTS: AspireMcpTimeouts = {
  initializeMs: 30_000,
  toolsListMs: 10_000,
  toolCallMs: 30_000,
  wholeGateMs: 120_000,
};
export const ASPIRE_MCP_SMOKE_OUTER_TIMEOUT_MS = ASPIRE_MCP_SMOKE_TIMEOUTS.wholeGateMs + 20_000;

/** Register the structured Aspire MCP smoke after runtime waits and before cleanup. */
export function createAspireMcpSmokeGate(): CommandGateDefinition {
  return {
    id: GATE.AGENT_ASPIRE_MCP_SMOKE,
    title: 'Verify Aspire MCP tool, visibility, and redaction contract',
    phase: GATE_PHASE.RUNTIME,
    kind: 'command',
    critical: true,
    cwd: (context) => context.project.repoRoot,
    command: (context) => [
      'deno',
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-env=GITHUB_RUN_ATTEMPT,GITHUB_JOB',
      '--allow-run=git,deno',
      '.llm/tools/gates/run-aspire-mcp-smoke.ts',
      context.project.repoRoot,
      context.project.projectRoot,
      context.project.appHost,
      context.request.options.database,
      generatedAppName(context),
      context.request.suiteId.replaceAll('.', '-'),
    ],
    timeoutMs: ASPIRE_MCP_SMOKE_OUTER_TIMEOUT_MS,
    failureClass: 'assertion',
    skip: {
      exitCode: ASPIRE_MCP_SMOKE_SKIP_EXIT_CODE,
      message:
        'Aspire MCP smoke skipped because the runtime phase did not produce aspire-start.json.',
    },
  };
}

interface ExecuteOptions {
  readonly projectRoot: string;
  readonly appHostPath: string;
  readonly database: string;
  readonly appResource: string;
  readonly receiptPath: string;
  readonly transcriptPath: string;
}

async function execute(options: ExecuteOptions): Promise<void> {
  const entryPoint = await readEntryPoint(options.projectRoot);
  const start = await readJsonObject(
    join(options.projectRoot, '.netscript', 'e2e', 'aspire-start.json'),
    'aspire-start.json',
  );
  const appHostPath = stringField(start, 'appHostPath');
  const requestedAppHost = await Deno.realPath(options.appHostPath);
  const recordedAppHost = await Deno.realPath(appHostPath);
  if (requestedAppHost !== recordedAppHost) {
    throw new Error(
      `aspire-start.json AppHost ${recordedAppHost} does not match suite AppHost ${requestedAppHost}`,
    );
  }
  const dashboardUrl = stringField(start, 'dashboardUrl');
  const cliVersion = await commandText('aspire', ['--version'], options.projectRoot);
  const secretValues = await readSecretValues(recordedAppHost, options.database);
  const input: AspireMcpSmokeInput = {
    cliVersion,
    scaffoldPin: SCAFFOLD_VERSIONS.ASPIRE_SDK,
    entryPoint,
    appHostPath: recordedAppHost,
    dashboardUrl,
    database: options.database,
    appResource: options.appResource,
    serviceResource: 'users',
    secretValues,
    transcript: options.transcriptPath.split(/[\\/]/).pop() ?? options.transcriptPath,
  };
  await runAspireMcpSmoke(input, {
    createTransport: (target) => Promise.resolve(createStdioAspireMcpTransport(target)),
    describeResources: () => describeResources(options.projectRoot, recordedAppHost),
    persist: (receipt, transcript) =>
      persistEvidence(
        options.receiptPath,
        options.transcriptPath,
        receipt,
        transcript,
      ),
    realPath: (path) => Deno.realPath(path),
    now: () => new Date(),
    timeouts: { ...ASPIRE_MCP_SMOKE_TIMEOUTS },
  });
}

async function readEntryPoint(projectRoot: string): Promise<AspireMcpEntryPoint> {
  const config = await readJsonObject(join(projectRoot, '.mcp.json'), '.mcp.json');
  const servers = object(Reflect.get(config, 'mcpServers'), '.mcp.json mcpServers');
  const aspire = object(Reflect.get(servers, 'aspire'), '.mcp.json mcpServers.aspire');
  const command = stringField(aspire, 'command');
  const args = Reflect.get(aspire, 'args');
  if (!Array.isArray(args) || !args.every((value) => typeof value === 'string')) {
    throw new Error('.mcp.json mcpServers.aspire.args must be strings');
  }
  if (command !== 'aspire' || args.length !== 2 || args[0] !== 'agent' || args[1] !== 'mcp') {
    throw new Error('.mcp.json mcpServers.aspire must equal aspire agent mcp');
  }
  return { source: '.mcp.json', command, args: [...args], cwd: projectRoot };
}

async function describeResources(
  projectRoot: string,
  appHostPath: string,
): Promise<readonly string[]> {
  const text = await commandText(
    'aspire',
    ['describe', '--apphost', appHostPath, '--format', 'Json', '--non-interactive', '--nologo'],
    projectRoot,
  );
  const parsed: unknown = JSON.parse(text);
  const resources = Array.isArray(parsed)
    ? parsed
    : Reflect.get(object(parsed, 'aspire describe result'), 'resources');
  if (!Array.isArray(resources)) throw new Error('aspire describe omitted resources[]');
  return resources.map((resource) => {
    const entry = object(resource, 'described resource');
    const name = Reflect.get(entry, 'displayName') ?? Reflect.get(entry, 'display_name') ??
      Reflect.get(entry, 'name');
    if (typeof name !== 'string') throw new Error('described resource omitted name');
    return name;
  });
}

async function readSecretValues(appHostPath: string, database: string): Promise<readonly string[]> {
  const path = join(dirname(appHostPath), '.data', 'aspire-secrets', `${database}.password`);
  try {
    const value = (await Deno.readTextFile(path)).trim();
    return value ? [value] : [];
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
}

async function persistEvidence(
  receiptPath: string,
  transcriptPath: string,
  receipt: AspireMcpSmokeReceipt,
  transcript: readonly unknown[],
): Promise<void> {
  await Deno.mkdir(dirname(receiptPath), { recursive: true });
  const lines = transcript.map((entry) => JSON.stringify(entry)).join('\n');
  await Deno.writeTextFile(transcriptPath, lines ? `${lines}\n` : '');
  await Deno.writeTextFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

async function commandText(command: string, args: readonly string[], cwd: string): Promise<string> {
  const output = await new Deno.Command(command, {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout).trim();
  const stderr = new TextDecoder().decode(output.stderr).trim();
  if (!output.success) throw new Error(`${command} ${args.join(' ')} failed: ${stderr || stdout}`);
  return stdout;
}

async function readJsonObject(path: string, label: string): Promise<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(await Deno.readTextFile(path));
  return object(parsed, label);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return Object.fromEntries(Object.entries(value));
}

function stringField(source: Record<string, unknown>, key: string): string {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string') throw new Error(`Expected string ${key}`);
  return value;
}

async function main(args: readonly string[]): Promise<number> {
  if (args[0] !== '--execute' || args.length !== 7) {
    console.error(
      'usage: aspire-mcp-smoke.ts --execute <project-root> <apphost> <database> <app> <receipt> <transcript>',
    );
    return 2;
  }
  try {
    await execute({
      projectRoot: resolve(args[1]),
      appHostPath: resolve(args[2]),
      database: args[3],
      appResource: args[4],
      receiptPath: resolve(args[5]),
      transcriptPath: resolve(args[6]),
    });
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.main) Deno.exitCode = await main(Deno.args);
