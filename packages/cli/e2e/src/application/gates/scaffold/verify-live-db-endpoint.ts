import { join } from '@std/path';
import { createLiveAspireTelemetryQuery } from './aspire-dashboard-telemetry.ts';
import { requireResourceProcesses, scanResourceProcesses } from './service-env/process-evidence.ts';
import {
  assertDatabaseAuthority,
  compareDatabaseEndpointPorts,
  compareSecondReceiptWithLiveTopology,
  type EndpointReceipt,
  extractTcpUrl,
  findTopologyResource,
  readResourceEnvValue,
  redactDatabaseConnectionUrl,
  redactEndpointReceipt,
  resolveDatabaseEndpointResource,
  resolveLiveUsersDatabaseAuthority,
} from './runtime/live-db-authority.ts';

export {
  compareDatabaseEndpointPorts,
  compareSecondReceiptWithLiveTopology,
  redactDatabaseConnectionUrl,
  resolveDatabaseEndpointResource,
  resolveLiveUsersDatabaseAuthority,
};

interface TelemetryLogCandidate {
  readonly traceId?: string;
}

interface TelemetrySpanCandidate {
  readonly name: string;
}

interface TelemetryTraceCandidate {
  readonly traceId: string;
  readonly spans: readonly TelemetrySpanCandidate[];
}

interface UsersTelemetryReader {
  queryLogs(
    filter?: { readonly serviceName?: string; readonly limit?: number },
  ): Promise<readonly TelemetryLogCandidate[]>;
  queryTraces(
    filter?: { readonly serviceName?: string; readonly limit?: number },
  ): Promise<readonly TelemetryTraceCandidate[]>;
}

interface TelemetryCorrelationResult {
  readonly ok: boolean;
  readonly traceId?: string;
  readonly error?: string;
}

type HttpFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface GeneratedCrudAcceptanceReceipt {
  readonly representativeId: string | number;
  readonly missingId: number;
  readonly projected404Methods: readonly ['get', 'patch', 'delete'];
}

const MISSING_ROW_ID = 2_147_483_647;
const CRUD_BY_ID_PATH = '/users/{id}';
const CRUD_404_METHODS = ['get', 'patch', 'delete'] as const;

const [appHost = '', projectRoot = '', database = 'postgres'] = Deno.args;

if (import.meta.main) await verifyLiveDbEndpoint();

async function verifyLiveDbEndpoint(): Promise<void> {
  if (!appHost || !projectRoot) throw new Error('AppHost and project root are required');

  const first = await readReceipt('first');
  const second = await readReceipt('second');
  assertDatabaseAuthority(first);
  assertDatabaseAuthority(second);

  const liveTopology = await readLiveTopology();
  const liveSecondEndpoint = compareSecondReceiptWithLiveTopology(
    second.postgresUrl,
    liveTopology,
    database,
  );
  if (!liveSecondEndpoint.ok) throw new Error(liveSecondEndpoint.error);
  const usersDir = join(projectRoot, 'services', 'users');
  const liveUsersDatabaseUrl = await resolveLiveUsersDatabaseAuthority(
    liveTopology,
    liveSecondEndpoint.livePostgresUrl,
    async () => {
      const processes = requireResourceProcesses(
        await scanResourceProcesses(usersDir, 'users'),
        'users',
        usersDir,
      );
      return processes.map((process) => process.environment.get('DATABASE_URL'));
    },
  );

  const usersUrl = liveHttpUrl(liveTopology, 'users');
  const healthResponse = await fetch(new URL('/health', usersUrl));
  const healthBody = await healthResponse.text();
  if (!healthResponse.ok || !matchesDatabaseHealthContract(healthBody, database)) {
    throw new Error(
      `users health did not prove database readiness: ${healthResponse.status} ${healthBody}`,
    );
  }

  const crud = await verifyGeneratedCrudAcceptance(usersUrl);

  const telemetryQuery = await createLiveAspireTelemetryQuery(projectRoot);
  const { traceId } = await pollUsersTelemetryCorrelation(telemetryQuery);

  const receiptPath = join(projectRoot, '.netscript', 'e2e', 'live-db-endpoint-receipt.json');
  await Deno.writeTextFile(
    receiptPath,
    JSON.stringify(
      {
        first: redactEndpointReceipt(first),
        second: redactEndpointReceipt(second),
        liveSecondPostgresUrl: liveSecondEndpoint.livePostgresUrl,
        liveUsersDatabaseUrl,
        health: JSON.parse(healthBody),
        crud,
        traceId,
      },
      null,
      2,
    ),
  );
  console.info(`live DB endpoint receipt: ${receiptPath}; traceId=${traceId}`);
}

/**
 * Verify the generated database seed and defined missing-row HTTP/OpenAPI contract.
 * The live database endpoint and shared record-activity gates use this contract;
 * both runtime tiers commit an update before requiring populated Overview activity.
 */
export async function verifyGeneratedCrudAcceptance(
  usersUrl: string,
  fetcher: HttpFetcher = fetch,
): Promise<GeneratedCrudAcceptanceReceipt> {
  const listUrl = new URL('/api/users?page=1&limit=100', usersUrl);
  const listResponse = await fetcher(listUrl);
  const listBody = await responseJson(listResponse, 'generated users list');
  if (!listResponse.ok || !isRecord(listBody) || !Array.isArray(listBody.data)) {
    throw new Error(
      `generated users list did not return paginated data: ${listResponse.status} ${
        JSON.stringify(listBody)
      }`,
    );
  }
  const representative = listBody.data.filter(isRecord).find((row) => row.name === 'Seed User');
  if (
    !representative ||
    (typeof representative.id !== 'number' && typeof representative.id !== 'string')
  ) {
    throw new Error(
      `generated users list omitted the representative Seed User row: ${JSON.stringify(listBody)}`,
    );
  }

  const openApiResponse = await fetcher(new URL('/api/openapi.json', usersUrl));
  const openApi = await responseJson(openApiResponse, 'generated users OpenAPI');
  if (!openApiResponse.ok) {
    throw new Error(
      `generated users OpenAPI request failed: ${openApiResponse.status} ${
        JSON.stringify(openApi)
      }`,
    );
  }
  assertCrud404Projection(openApi);

  const missingUrl = new URL(`/api/users/${MISSING_ROW_ID}`, usersUrl);
  await assertDefinedNotFound(fetcher, missingUrl, 'GET');
  await assertDefinedNotFound(fetcher, missingUrl, 'PATCH', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: { name: 'Missing User' } }),
  });
  await assertDefinedNotFound(fetcher, missingUrl, 'DELETE');

  // Exercise the committed mutation path before the Overview requires a populated
  // record activity stream. Keep the seed's values and row count unchanged.
  const updated = await fetcher(new URL(`/api/users/${representative.id}`, usersUrl), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: { name: 'Seed User' } }),
  });
  const updatedBody = await responseJson(updated, 'representative record update');
  if (!updated.ok || !isRecord(updatedBody) || updatedBody.id !== representative.id) {
    throw new Error(`Representative record update failed: ${updated.status}`);
  }

  return {
    representativeId: representative.id,
    missingId: MISSING_ROW_ID,
    projected404Methods: [...CRUD_404_METHODS],
  };
}

function assertCrud404Projection(document: unknown): void {
  const paths = isRecord(document) && isRecord(document.paths) ? document.paths : undefined;
  const byId = paths && isRecord(paths[CRUD_BY_ID_PATH]) ? paths[CRUD_BY_ID_PATH] : undefined;
  for (const method of CRUD_404_METHODS) {
    const operation = byId && isRecord(byId[method]) ? byId[method] : undefined;
    const responses = operation && isRecord(operation.responses) ? operation.responses : undefined;
    if (!responses || !('404' in responses)) {
      throw new Error(`${method.toUpperCase()} ${CRUD_BY_ID_PATH} omitted 404 from OpenAPI`);
    }
  }
}

async function assertDefinedNotFound(
  fetcher: HttpFetcher,
  url: URL,
  method: 'GET' | 'PATCH' | 'DELETE',
  init: Omit<RequestInit, 'method'> = {},
): Promise<void> {
  const response = await fetcher(url, { ...init, method });
  const body = await responseJson(response, `missing-row ${method}`);
  if (response.status !== 404 || !isRecord(body) || body.code !== 'NOT_FOUND') {
    throw new Error(
      `missing-row ${method} was not a defined NOT_FOUND: ${response.status} ${
        JSON.stringify(body)
      }`,
    );
  }
}

async function responseJson(response: Response, label: string): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} returned non-JSON: ${response.status} ${text}`);
  }
}

async function readReceipt(allocation: 'first' | 'second'): Promise<EndpointReceipt> {
  const topology = JSON.parse(
    await Deno.readTextFile(
      join(projectRoot, '.netscript', 'e2e', `db-allocation-${allocation}.json`),
    ),
  );
  const postgres = resolveDatabaseEndpointResource(topology, database);
  const users = findTopologyResource(topology, 'users');
  if (!users) throw new Error(`${allocation} topology omitted users resource`);
  const postgresUrl = extractTcpUrl(postgres);
  const usersDatabaseUrl = readResourceEnvValue(users, 'DATABASE_URL');
  return { allocation, postgresUrl, usersDatabaseUrl };
}

async function readLiveTopology(): Promise<unknown> {
  return JSON.parse(
    extractJson(await runAspire(['describe', '--apphost', appHost, '--format', 'Json'])),
  );
}

function liveHttpUrl(topology: unknown, name: string): string {
  const resource = findTopologyResource(topology, name);
  if (!resource) throw new Error(`live topology omitted ${name}`);
  const urls = resource.urls;
  if (!Array.isArray(urls)) throw new Error(`${name} exposed no URLs`);
  for (const item of urls) {
    const value = isRecord(item) ? item.url : item;
    if (typeof value === 'string' && value.startsWith('http://')) return value;
  }
  throw new Error(`${name} exposed no HTTP URL`);
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

/** Compare structured-log trace IDs with normalized Aspire Dashboard traces. */
export function correlateUsersTelemetry(
  logs: readonly TelemetryLogCandidate[],
  traces: readonly TelemetryTraceCandidate[],
): TelemetryCorrelationResult {
  const logTraceIds = uniqueStrings(logs.map((log) => log.traceId));
  const otelTraceIds = uniqueStrings(traces.map((trace) => trace.traceId));
  const traceId = logTraceIds.find((candidate) => otelTraceIds.includes(candidate));
  if (traceId) return { ok: true, traceId };

  const candidateSpans = traces.map((trace) =>
    `${trace.traceId}:[${trace.spans.map((span) => span.name).join(', ')}]`
  );
  return {
    ok: false,
    error: `users telemetry correlation mismatch: structured-log trace ids=[${
      logTraceIds.join(', ') || 'none'
    }]; OTEL trace ids=[${otelTraceIds.join(', ') || 'none'}]; candidate spans=[${
      candidateSpans.join('; ') || 'none'
    }]`,
  };
}

/** Poll eventual telemetry export after HTTP success; this does not infer Aspire resource state. */
export async function pollUsersTelemetryCorrelation(
  reader: UsersTelemetryReader,
  options: { readonly maxAttempts?: number; readonly delayMs?: number } = {},
): Promise<{ readonly traceId: string; readonly attempts: number }> {
  const maxAttempts = options.maxAttempts ?? 20;
  const delayMs = options.delayMs ?? 500;
  let lastError = 'no telemetry queried';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const [logs, traces] = await Promise.all([
      reader.queryLogs({ serviceName: 'users', limit: 500 }),
      reader.queryTraces({ serviceName: 'users', limit: 500 }),
    ]);
    const correlation = correlateUsersTelemetry(logs, traces);
    if (correlation.ok && correlation.traceId) {
      return { traceId: correlation.traceId, attempts: attempt };
    }
    lastError = correlation.error ?? 'unknown telemetry mismatch';
    if (attempt < maxAttempts && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(
    `users telemetry correlation did not converge after ${maxAttempts} attempt(s): ${lastError}`,
  );
}

function uniqueStrings(values: readonly (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
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
