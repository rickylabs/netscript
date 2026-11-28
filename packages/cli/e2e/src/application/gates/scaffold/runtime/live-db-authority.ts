/** Redaction and topology/authority comparisons for live second-start DB verification. */

export interface EndpointReceipt {
  readonly allocation: 'first' | 'second';
  readonly postgresUrl: string;
  readonly usersDatabaseUrl: string | null;
}

export interface DatabaseEndpointPortComparison {
  readonly ok: boolean;
  readonly livePort?: number;
  readonly usersPort?: number;
  readonly error?: string;
}

export interface LiveSecondEndpointComparison {
  readonly ok: boolean;
  readonly receiptPostgresUrl: string;
  readonly livePostgresUrl?: string;
  readonly error?: string;
}

export function findTopologyResource(
  value: unknown,
  name: string,
): Record<string, unknown> | undefined {
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
      ? child.map((entry) => findTopologyResource(entry, name)).find(Boolean)
      : findTopologyResource(child, name);
    if (found) return found;
  }
  return undefined;
}

export function extractTcpUrl(resource: Record<string, unknown>): string {
  if (!Array.isArray(resource.urls)) throw new Error('Postgres resource exposed no URLs');
  for (const item of resource.urls) {
    const value = isRecord(item) ? item.url : item;
    if (typeof value === 'string' && /^(?:tcp|postgres(?:ql)?):\/\//.test(value)) {
      return value.replace(/^tcp:/, 'postgres:');
    }
  }
  throw new Error('Postgres resource exposed no TCP URL');
}

export function readResourceEnvValue(
  resource: Record<string, unknown>,
  key: string,
): string | null {
  const environment = resource.environment;
  if (isRecord(environment) && key in environment) {
    const value = environment[key];
    if (value === null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  if (Array.isArray(environment)) {
    for (const entry of environment) {
      if (isRecord(entry) && entry.name === key && ('value' in entry)) {
        if (entry.value === null) return null;
        if (typeof entry.value === 'string') return entry.value;
      }
    }
  }
  const text = JSON.stringify(resource);
  const match = new RegExp(`${key}[^a-z0-9]+([^"\\s]+)`, 'i').exec(text);
  if (match) return match[1];
  throw new Error(`users resource omitted ${key}`);
}

export function assertDatabaseAuthority(receipt: EndpointReceipt): void {
  if (receipt.usersDatabaseUrl === null) {
    if (databasePort(receipt.postgresUrl) === undefined) {
      throw new Error(
        `${receipt.allocation} could not parse live Postgres port from ${
          JSON.stringify(receipt.postgresUrl)
        }`,
      );
    }
    return;
  }
  const safeUsersUrl = redactDatabaseConnectionUrl(receipt.usersDatabaseUrl);
  const comparison = compareDatabaseEndpointPorts(receipt.postgresUrl, safeUsersUrl);
  if (!comparison.ok) throw new Error(`${receipt.allocation} ${comparison.error}`);
}

export function redactEndpointReceipt(receipt: EndpointReceipt): EndpointReceipt {
  return {
    ...receipt,
    usersDatabaseUrl: receipt.usersDatabaseUrl === null
      ? null
      : redactDatabaseConnectionUrl(receipt.usersDatabaseUrl),
  };
}

/**
 * Strip embedded credentials and query params from a PostgreSQL connection string
 * while preserving the endpoint host, port, and database name for diagnostics/receipts.
 */
export function redactDatabaseConnectionUrl(connection: string): string {
  const value = unquoteConnectionValue(connection);
  try {
    const url = new URL(value);
    if (url.protocol && url.host) {
      url.username = '';
      url.password = '';
      url.search = '';
      url.hash = '';
      return url.toString();
    }
  } catch {
    // Try Npgsql semicolon key/value form below.
  }
  if (value.includes(';') || /^\s*[a-z ]+\s*=/i.test(value)) {
    const secretKeys = new Set(['password', 'pwd', 'username', 'user id', 'user']);
    const kept = value
      .split(';')
      .map((segment) => segment.trim())
      .filter((segment) => {
        if (!segment) return false;
        const eq = segment.indexOf('=');
        if (eq <= 0) return true;
        const key = segment.slice(0, eq).trim().replace(/\s+/g, ' ').toLowerCase();
        return !secretKeys.has(key);
      });
    return kept.join(';');
  }
  return '[redacted-unparseable-connection]';
}

/** Proves that the second receipt names the Postgres endpoint in the live second-start topology. */
export function compareSecondReceiptWithLiveTopology(
  receiptPostgresUrl: string,
  liveTopology: unknown,
  databaseName: string,
): LiveSecondEndpointComparison {
  let postgres: Record<string, unknown>;
  try {
    postgres = resolveDatabaseEndpointResource(liveTopology, databaseName);
  } catch (error) {
    return {
      ok: false,
      receiptPostgresUrl,
      error: `live second-start Postgres resource was unavailable: ${errorMessage(error)}`,
    };
  }

  let livePostgresUrl: string;
  try {
    livePostgresUrl = extractTcpUrl(postgres);
  } catch (error) {
    return {
      ok: false,
      receiptPostgresUrl,
      error: `live second-start Postgres endpoint was unavailable: ${errorMessage(error)}`,
    };
  }

  if (receiptPostgresUrl !== livePostgresUrl) {
    return {
      ok: false,
      receiptPostgresUrl,
      livePostgresUrl,
      error: `second receipt Postgres URL ${
        JSON.stringify(receiptPostgresUrl)
      } did not match live second-start Postgres URL ${JSON.stringify(livePostgresUrl)}`,
    };
  }

  return { ok: true, receiptPostgresUrl, livePostgresUrl };
}

/**
 * Verify `users` `DATABASE_URL` port parity from `aspire describe` when unredacted, or from the
 * running OS process `/proc/<pid>/environ` when Aspire 17.0.0 redacts describe `environment` to
 * `null`, and return a credential-free URL for the E2E receipt.
 */
export async function resolveLiveUsersDatabaseAuthority(
  liveTopology: unknown,
  livePostgresUrl: string | undefined,
  readProcessDatabaseUrls: () => Promise<readonly (string | undefined)[]>,
): Promise<string> {
  const users = findTopologyResource(liveTopology, 'users');
  if (!users) throw new Error('live second-start topology omitted users resource');
  if (!livePostgresUrl) throw new Error('live second-start topology omitted Postgres URL');
  const describedUrl = readResourceEnvValue(users, 'DATABASE_URL');
  if (describedUrl !== null) {
    const safeUrl = redactDatabaseConnectionUrl(describedUrl);
    const comparison = compareDatabaseEndpointPorts(livePostgresUrl, safeUrl);
    if (!comparison.ok) throw new Error(`live second-start ${comparison.error}`);
    return safeUrl;
  }
  const processUrls = await readProcessDatabaseUrls();
  if (processUrls.length === 0) {
    throw new Error('live second-start users process scan returned no processes');
  }
  const redacted: string[] = [];
  for (const candidate of processUrls) {
    if (!candidate) throw new Error('live second-start users process omitted DATABASE_URL');
    const safeUrl = redactDatabaseConnectionUrl(candidate);
    const comparison = compareDatabaseEndpointPorts(livePostgresUrl, safeUrl);
    if (!comparison.ok) throw new Error(`live second-start ${comparison.error}`);
    redacted.push(safeUrl);
  }
  return redacted[0];
}

/**
 * Compares ports across URL form (`postgres://host:port/db`) and semicolon key/value form
 * (`Host=...;Port=...;Database=...`).
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

/** Resolve a database endpoint resource without confusing its parameter siblings for the container. */
export function resolveDatabaseEndpointResource(
  topology: unknown,
  databaseName: string,
): Record<string, unknown> {
  const resources = topologyResources(topology);
  const exact = resources.filter((resource) =>
    resource.displayName === databaseName || resource.name === databaseName
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new Error(
      `database resource ${JSON.stringify(databaseName)} had ambiguous exact matches: ` +
        describeResourceCandidates(exact),
    );
  }

  const fallback = resources.filter((resource) =>
    isDcpSuffixedName(resource.name, databaseName) && hasDatabaseEndpoint(resource)
  );
  if (fallback.length === 1) return fallback[0];
  if (fallback.length > 1) {
    throw new Error(
      `database resource ${JSON.stringify(databaseName)} had ambiguous DCP endpoint matches: ` +
        describeResourceCandidates(fallback),
    );
  }

  throw new Error(
    `database resource ${JSON.stringify(databaseName)} had no exact identity or unique DCP ` +
      `endpoint match; available resources: ${describeResourceCandidates(resources)}`,
  );
}

function databasePort(connection: string): number | undefined {
  const value = unquoteConnectionValue(connection);
  try {
    const url = new URL(value);
    if (url.port) return validPort(url.port);
  } catch {
    // Parse semicolon dialect below.
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function topologyResources(topology: unknown): Record<string, unknown>[] {
  if (!isRecord(topology) || !Array.isArray(topology.resources)) return [];
  return topology.resources.filter(isRecord);
}

function isDcpSuffixedName(value: unknown, databaseName: string): boolean {
  if (typeof value !== 'string') return false;
  const prefix = `${databaseName}-`;
  return value.startsWith(prefix) && /^[a-z0-9]{8}$/i.test(value.slice(prefix.length));
}

function hasDatabaseEndpoint(resource: Record<string, unknown>): boolean {
  if (!Array.isArray(resource.urls)) return false;
  return resource.urls.some((item) => {
    const value = isRecord(item) ? item.url : item;
    return typeof value === 'string' && /^(?:tcp|postgres(?:ql)?):\/\//.test(value);
  });
}

function describeResourceCandidates(resources: readonly Record<string, unknown>[]): string {
  if (resources.length === 0) return '(none)';
  return resources.map((resource) => {
    const name = typeof resource.name === 'string' ? resource.name : '(unnamed)';
    const displayName = typeof resource.displayName === 'string'
      ? resource.displayName
      : '(no displayName)';
    const type = typeof resource.resourceType === 'string'
      ? resource.resourceType
      : '(unknown type)';
    return `${name} [displayName=${displayName}, type=${type}]`;
  }).join(', ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
