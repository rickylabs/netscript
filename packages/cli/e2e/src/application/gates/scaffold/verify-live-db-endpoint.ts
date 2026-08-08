import { join } from '@std/path';

interface EndpointReceipt {
  readonly allocation: 'first' | 'second';
  readonly postgresUrl: string;
  readonly usersDatabaseUrl: string;
}

interface DatabaseEndpointPortComparison {
  readonly ok: boolean;
  readonly livePort?: number;
  readonly usersPort?: number;
  readonly error?: string;
}

const [appHost = '', projectRoot = '', database = 'postgres'] = Deno.args;

if (import.meta.main) await verifyLiveDbEndpoint();

async function verifyLiveDbEndpoint(): Promise<void> {
  if (!appHost || !projectRoot) throw new Error('AppHost and project root are required');

  const first = await readReceipt('first');
  const second = await readReceipt('second');
  if (first.postgresUrl === second.postgresUrl) {
    throw new Error(
      `consecutive AppHost starts reused the same database allocation: ${first.postgresUrl}`,
    );
  }
  assertDatabaseAuthority(first);
  assertDatabaseAuthority(second);

  const usersUrl = await liveHttpUrl('users');
  const healthResponse = await fetch(new URL('/health', usersUrl));
  const healthBody = await healthResponse.text();
  if (!healthResponse.ok || !matchesDatabaseHealthContract(healthBody, database)) {
    throw new Error(
      `users health did not prove database readiness: ${healthResponse.status} ${healthBody}`,
    );
  }

  const structuredLogs = await aspireOtel('logs');
  const traces = await aspireOtel('traces');
  const traceIds = [
    ...structuredLogs.matchAll(/(?:traceId|trace_id)["':=\s]+([0-9a-f]{16,32})/gi),
  ].map((match) => match[1]);
  const traceId = traceIds.find((candidate) => traces.includes(candidate));
  if (!traceId) {
    throw new Error('users structured logs and OTEL traces had no shared trace id');
  }

  const receiptPath = join(projectRoot, '.netscript', 'e2e', 'live-db-endpoint-receipt.json');
  await Deno.writeTextFile(
    receiptPath,
    JSON.stringify({ first, second, health: JSON.parse(healthBody), traceId }, null, 2),
  );
  console.info(`live DB endpoint receipt: ${receiptPath}; traceId=${traceId}`);
}

async function readReceipt(allocation: 'first' | 'second'): Promise<EndpointReceipt> {
  const topology = JSON.parse(
    await Deno.readTextFile(
      join(projectRoot, '.netscript', 'e2e', `db-allocation-${allocation}.json`),
    ),
  );
  const postgres = findResource(topology, database);
  const users = findResource(topology, 'users');
  if (!postgres || !users) {
    throw new Error(`${allocation} topology omitted postgres/users resources`);
  }
  const postgresUrl = tcpUrl(postgres);
  const usersDatabaseUrl = environmentValue(users, 'DATABASE_URL');
  return { allocation, postgresUrl, usersDatabaseUrl };
}

function assertDatabaseAuthority(receipt: EndpointReceipt): void {
  const comparison = compareDatabaseEndpointPorts(
    receipt.postgresUrl,
    receipt.usersDatabaseUrl,
  );
  if (!comparison.ok) throw new Error(`${receipt.allocation} ${comparison.error}`);
}

/**
 * Compares ports across the two explicitly supported connection-string dialects:
 * URL form (`postgres://host:port/db`) and semicolon key/value form
 * (`Host=...;Port=...;Database=...`). Aspire reports live resources as URLs while
 * generated service environments may use the Npgsql-style key/value form. A third
 * dialect must be added here with focused tests rather than accepted accidentally.
 */
export function compareDatabaseEndpointPorts(
  livePostgres: string,
  usersDatabaseUrl: string,
): DatabaseEndpointPortComparison {
  const livePort = databasePort(livePostgres);
  if (livePort === undefined) {
    return {
      ok: false,
      error: `could not parse live Postgres port from ${JSON.stringify(livePostgres)}`,
    };
  }

  const usersPort = databasePort(usersDatabaseUrl);
  if (usersPort === undefined) {
    return {
      ok: false,
      livePort,
      error: `could not parse users DATABASE_URL port from ${JSON.stringify(usersDatabaseUrl)}`,
    };
  }

  if (livePort !== usersPort) {
    return {
      ok: false,
      livePort,
      usersPort,
      error: `users DATABASE_URL port ${usersPort} did not match live Postgres port ${livePort}`,
    };
  }

  return { ok: true, livePort, usersPort };
}

function databasePort(connection: string): number | undefined {
  const value = unquoteConnectionValue(connection);
  try {
    const url = new URL(value);
    if (url.port) return validPort(url.port);
  } catch {
    // The other enumerated dialect is not a URL; parse it as key/value below.
  }

  for (const segment of value.split(';')) {
    const match = /^\s*port\s*=\s*(\d+)\s*$/i.exec(segment);
    if (match) return validPort(match[1]);
  }
  return undefined;
}

function unquoteConnectionValue(connection: string): string {
  const value = connection.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === 'string') return parsed;
    } catch {
      return value;
    }
  }
  return value;
}

function validPort(value: string): number | undefined {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65_535 ? port : undefined;
}

async function liveHttpUrl(name: string): Promise<string> {
  const topology = JSON.parse(
    extractJson(await runAspire(['describe', '--apphost', appHost, '--format', 'Json'])),
  );
  const resource = findResource(topology, name);
  if (!resource) throw new Error(`live topology omitted ${name}`);
  const urls = resource.urls;
  if (!Array.isArray(urls)) throw new Error(`${name} exposed no URLs`);
  for (const item of urls) {
    const value = isRecord(item) ? item.url : item;
    if (typeof value === 'string' && value.startsWith('http://')) return value;
  }
  throw new Error(`${name} exposed no HTTP URL`);
}

async function aspireOtel(kind: 'logs' | 'traces'): Promise<string> {
  return await runAspire(['otel', kind, 'users', '--apphost', appHost, '--format', 'Json']);
}

async function runAspire(args: string[]): Promise<string> {
  const output = await new Deno.Command('aspire', {
    args: [...args, '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`aspire ${args.join(' ')} failed (${output.code}): ${stderr || stdout}`);
  }
  return stdout;
}

function findResource(value: unknown, name: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const resources = value.resources;
  if (Array.isArray(resources)) {
    return resources.filter(isRecord).find((entry) =>
      [entry.displayName, entry.name].some((candidate) =>
        typeof candidate === 'string' && (candidate === name || candidate.startsWith(`${name}-`))
      )
    );
  }
  for (const child of Object.values(value)) {
    const found = Array.isArray(child)
      ? child.map((entry) => findResource(entry, name)).find(Boolean)
      : findResource(child, name);
    if (found) return found;
  }
  return undefined;
}

function tcpUrl(resource: Record<string, unknown>): string {
  if (!Array.isArray(resource.urls)) throw new Error('Postgres resource exposed no URLs');
  for (const item of resource.urls) {
    const value = isRecord(item) ? item.url : item;
    if (typeof value === 'string' && /^(?:tcp|postgres(?:ql)?):\/\//.test(value)) {
      return value.replace(/^tcp:/, 'postgres:');
    }
  }
  throw new Error('Postgres resource exposed no TCP URL');
}

function environmentValue(resource: Record<string, unknown>, key: string): string {
  const environment = resource.environment;
  if (isRecord(environment) && key in environment) {
    const value = environment[key];
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  const text = JSON.stringify(resource);
  const match = new RegExp(`${key}[^a-z0-9]+([^"\\s]+)`, 'i').exec(text);
  if (match) return match[1];
  throw new Error(`users resource omitted ${key}`);
}

/**
 * Matches the documented `HealthResponse` serialized by
 * `@netscript/service`'s `createHealthHandler`: overall `status` plus checks
 * shaped as `{ name, healthy, message?, latency? }`. `defineService` names a
 * single client `database` and a selected multi-client provider
 * `database:<provider>`; those are the only two explicitly accepted names.
 * The contract does not define a per-check `status` dialect.
 */
export function matchesDatabaseHealthContract(
  body: string,
  expectedDatabase: string,
): boolean {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return false;
  }
  if (!isRecord(value) || value.status !== 'healthy' || !Array.isArray(value.checks)) {
    return false;
  }

  const expectedNames = new Set(['database', `database:${expectedDatabase}`]);
  const databaseChecks = value.checks.filter(isRecord).filter((check) =>
    typeof check.name === 'string' && expectedNames.has(check.name)
  );
  return databaseChecks.length === 1 && databaseChecks[0].healthy === true;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error('Aspire output omitted JSON');
  return trimmed.slice(Math.min(...indexes));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
