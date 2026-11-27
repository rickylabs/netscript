import { walk } from '@std/fs/walk';
import { deadline } from '@std/async/deadline';
import {
  createDashboardTelemetryApiReader,
  type DashboardTelemetryApiReader,
} from '../aspire-dashboard-api.ts';
import { appHostEvidence, resourceEvidence } from '../aspire-mcp/evidence.ts';
import { readAspireMcpEntryPoint } from '../aspire-mcp/entry-point.ts';
import { createStdioAspireMcpTransport } from '../aspire-mcp/stdio-transport.ts';
import { parseProcessEnvironment } from '../service-env/process-evidence.ts';

/** Fail without echoing credential material from any scanned surface. */
export function assertNoSecretBytes(label: string, text: string, secrets: readonly string[]): void {
  for (const [index, secret] of secrets.entries()) {
    if (secret.length < 8) throw new Error(`credential #${index} is too short to scan for`);
    if (text.includes(secret)) throw new Error(`${label} output contains credential #${index}`);
  }
}

/** Scan every resource's health evidence, including descriptions, exceptions and check data. */
export function assertHealthReportsHaveNoSecrets(
  topology: unknown,
  secrets: readonly string[],
): void {
  const visit = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (
        key === 'healthReports' || key === 'healthChecks' ||
        key === 'healthCheckDescriptions' || key === 'healthCheckDescription'
      ) {
        assertNoSecretBytes('aspire describe health evidence', JSON.stringify(child), secrets);
      } else if (typeof child === 'object') {
        visit(child);
      }
    }
  };
  visit(topology);
}

/** Scan all generated helper files without persisting their contents. */
export async function assertGeneratedHelpersHaveNoSecrets(
  projectRoot: string,
  secrets: readonly string[],
): Promise<void> {
  for await (const file of walk(`${projectRoot}/aspire/.helpers`, { includeDirs: false })) {
    assertNoSecretBytes('generated helper', await Deno.readTextFile(file.path), secrets);
  }
}

/** Scan the complete MCP exchange before redaction or persistence can hide a leak. */
export function assertMcpTranscriptHasNoSecrets(
  transcript: readonly unknown[],
  secrets: readonly string[],
): void {
  assertNoSecretBytes('MCP list_resources', JSON.stringify(transcript), secrets);
}

/** Scan the live list_resources exchange in memory and close only the transport we started. */
export async function assertMcpResourcesHaveNoSecrets(
  projectRoot: string,
  appHost: string,
  secrets: readonly string[],
): Promise<void> {
  const transport = createStdioAspireMcpTransport(await readAspireMcpEntryPoint(projectRoot));
  try {
    await deadline(transport.initialize(), 30_000);
    const hosts = appHostEvidence(await deadline(transport.callTool('list_apphosts'), 30_000));
    const expected = await Deno.realPath(appHost);
    const paths = await Promise.all(hosts.inScope.map((path) => Deno.realPath(path)));
    if (!paths.includes(expected)) throw new Error('suite AppHost is missing from MCP scope');
    if (hosts.inScope.length > 1) {
      await deadline(transport.callTool('select_apphost', { appHostPath: expected }), 30_000);
    }
    const resources = await deadline(transport.callTool('list_resources'), 30_000);
    assertMcpTranscriptHasNoSecrets(transport.transcript(), secrets);
    if (!resourceEvidence(resources).names.includes('postgres')) {
      throw new Error('MCP list_resources omitted postgres');
    }
  } catch {
    assertMcpTranscriptHasNoSecrets(transport.transcript(), secrets);
    throw new Error('MCP credential scan failed; raw diagnostics withheld');
  } finally {
    await transport.close();
  }
}

/** Scan live Aspire Dashboard API resources and logs payloads and require authentic target structure. */
export async function assertDashboardApiHasNoSecrets(
  dashboardUrl: string,
  secrets: readonly string[],
  createReader: (dashboardUrl: string) => DashboardTelemetryApiReader =
    createDashboardTelemetryApiReader,
): Promise<readonly string[]> {
  const reader = createReader(dashboardUrl);
  const endpoints = ['resources', 'logs'] as const;
  for (const path of endpoints) {
    const search = path === 'logs' ? new URLSearchParams({ limit: '200' }) : new URLSearchParams();
    const response = await reader(path, search);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`aspire dashboard api ${path} returned ${response.status}`);
    }
    assertNoSecretBytes(`aspire dashboard api (${path})`, text, secrets);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`aspire dashboard api (${path}) returned invalid JSON`);
    }
    if (path === 'resources') {
      const entries = Array.isArray(parsed)
        ? parsed
        : (isRecord(parsed) && Array.isArray(parsed.data) ? parsed.data : undefined);
      if (!entries || !entries.some((entry) => isRecord(entry) && entry.name === 'users')) {
        throw new Error('aspire dashboard api (resources) omitted target resource users');
      }
    } else {
      const resourceLogs = isRecord(parsed) && Array.isArray(parsed.resourceLogs)
        ? parsed.resourceLogs
        : (isRecord(parsed) && isRecord(parsed.data) && Array.isArray(parsed.data.resourceLogs)
          ? parsed.data.resourceLogs
          : undefined);
      if (!resourceLogs) {
        throw new Error('aspire dashboard api (logs) omitted resourceLogs payload');
      }
    }
  }
  return endpoints;
}

/** Verify users and prisma-studio are Running with redacted DB connection env vars in describe. */
export function assertConsumerConnectionStringsRedacted(
  topology: unknown,
): {
  readonly postgresPort: number;
  readonly prismaStudioPid: number | undefined;
  readonly usersResourceName: string;
  readonly prismaStudioResourceName: string;
  readonly prismaStudioUrl: string | undefined;
} {
  const resources = isRecord(topology) && Array.isArray(topology.resources)
    ? topology.resources.filter(isRecord)
    : undefined;
  if (!resources) throw new Error('aspire describe omitted resources[]');

  const postgres = findExactResource(resources, 'postgres');
  if (!postgres) throw new Error('aspire describe omitted postgres resource');
  const postgresPort = extractTcpPort(postgres);

  for (const target of ['users', 'prisma-studio'] as const) {
    const resource = findExactResource(resources, target);
    if (!resource) throw new Error(`aspire describe omitted ${target} resource`);
    if (resource.state !== 'Running') {
      throw new Error(`${target} state is ${JSON.stringify(resource.state)}, expected "Running"`);
    }
    const env = isRecord(resource.environment) ? resource.environment : undefined;
    if (!env) throw new Error(`${target} omitted environment object`);
    if (!('DATABASE_URL' in env) || env.DATABASE_URL !== null) {
      throw new Error(`${target} DATABASE_URL is not redacted to null in aspire describe`);
    }
    if (!('POSTGRES_URI' in env) || env.POSTGRES_URI !== null) {
      throw new Error(`${target} POSTGRES_URI is not redacted to null in aspire describe`);
    }
    const connKeys = Object.keys(env).filter((key) => key.startsWith('ConnectionStrings__'));
    if (connKeys.length === 0 || connKeys.some((key) => env[key] !== null)) {
      throw new Error(`${target} ConnectionStrings__* is not redacted to null in aspire describe`);
    }
  }

  const users = findExactResource(resources, 'users')!;
  const prismaStudio = findExactResource(resources, 'prisma-studio')!;
  const usersResourceName = typeof users.name === 'string' ? users.name : 'users';
  const prismaStudioResourceName = typeof prismaStudio.name === 'string'
    ? prismaStudio.name
    : 'prisma-studio';
  const rawPid = isRecord(prismaStudio.properties)
    ? prismaStudio.properties['executable.pid']
    : undefined;
  const prismaStudioPid = typeof rawPid === 'number' && Number.isInteger(rawPid) && rawPid > 0
    ? rawPid
    : undefined;
  return {
    postgresPort,
    prismaStudioPid,
    usersResourceName,
    prismaStudioResourceName,
    prismaStudioUrl: extractOptionalHttpUrl(prismaStudio),
  };
}

/** Verify live consumer process env carries working Postgres port and password without leaking it. */
export function assertProcessDatabaseConnection(
  env: ReadonlyMap<string, string>,
  expectedPort: number,
  expectedPassword: string,
  label: string,
): void {
  const databaseUrl = env.get('DATABASE_URL');
  if (!databaseUrl) throw new Error(`${label} process omitted DATABASE_URL`);
  const postgresUri = env.get('POSTGRES_URI');
  if (!postgresUri) throw new Error(`${label} process omitted POSTGRES_URI`);

  const databasePort = parseConnectionPort(databaseUrl);
  if (databasePort !== expectedPort) {
    throw new Error(
      `${label} process DATABASE_URL port ${
        databasePort ?? 'unknown'
      } did not match expected Postgres port ${expectedPort}`,
    );
  }
  const uriPort = parseConnectionPort(postgresUri);
  if (uriPort !== expectedPort) {
    throw new Error(
      `${label} process POSTGRES_URI port ${
        uriPort ?? 'unknown'
      } did not match expected Postgres port ${expectedPort}`,
    );
  }
  if (
    !databaseUrl.includes(expectedPassword) ||
    (postgresUri !== databaseUrl && !postgresUri.includes(expectedPassword))
  ) {
    throw new Error(`${label} process connection string did not match expected credential`);
  }
}

/** Read and parse a running Linux process's /proc/<pid>/environ without exposing secret bytes. */
export async function readProcessEnvironmentByPid(pid: number): Promise<Map<string, string>> {
  return parseProcessEnvironment(await Deno.readFile(`/proc/${pid}/environ`));
}

function findExactResource(
  resources: readonly Record<string, unknown>[],
  target: string,
): Record<string, unknown> | undefined {
  return resources.find((entry) => entry.displayName === target || entry.name === target);
}

function extractOptionalHttpUrl(resource: Record<string, unknown>): string | undefined {
  const urls = Array.isArray(resource.urls) ? resource.urls : [];
  for (const item of urls) {
    const raw = isRecord(item) ? item.url : item;
    if (typeof raw === 'string' && /^https?:\/\//.test(raw)) return raw;
  }
  return undefined;
}

function extractTcpPort(resource: Record<string, unknown>): number {
  const urls = Array.isArray(resource.urls) ? resource.urls : [];
  for (const item of urls) {
    const raw = isRecord(item) ? item.url : item;
    if (typeof raw !== 'string' || !/^(?:tcp|postgres(?:ql)?):\/\//.test(raw)) continue;
    const port = parseConnectionPort(raw);
    if (port !== undefined) return port;
  }
  throw new Error('postgres resource exposed no TCP port');
}

function parseConnectionPort(connection: string): number | undefined {
  try {
    const url = new URL(connection.trim());
    if (url.port) {
      const port = Number(url.port);
      if (Number.isInteger(port) && port >= 1 && port <= 65_535) return port;
    }
  } catch {
    // Check Npgsql keyword/value dialect below.
  }
  for (const segment of connection.split(';')) {
    const match = /^\s*port\s*=\s*(\d+)\s*$/i.exec(segment);
    if (match) {
      const port = Number(match[1]);
      if (Number.isInteger(port) && port >= 1 && port <= 65_535) return port;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
