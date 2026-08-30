import type { AspireMcpSmokeDependencies, AspireMcpSmokeReceipt } from './contract.ts';

/** Read the in-scope paths returned by `list_apphosts`. */
export function appHostEvidence(value: unknown): { inScope: readonly string[] } {
  const source = record(value, 'list_apphosts result');
  const entries = Reflect.get(source, 'inScope');
  if (!Array.isArray(entries)) throw new Error('list_apphosts omitted inScope[]');
  return {
    inScope: entries.map((entry) => {
      const path = Reflect.get(record(entry, 'AppHost entry'), 'appHostPath');
      if (typeof path !== 'string') throw new Error('AppHost entry omitted appHostPath');
      return path;
    }),
  };
}

/** Realpath-compare the MCP AppHost list with the suite-owned AppHost. */
export async function matchingAppHosts(
  paths: readonly string[],
  expected: string,
  dependencies: AspireMcpSmokeDependencies,
): Promise<string[]> {
  const matches: string[] = [];
  for (const path of paths) {
    if (await realPath(path, dependencies) === expected) matches.push(path);
  }
  return matches;
}

/** Extract the locked CLI-version and summary evidence from `doctor`. */
export function doctorEvidence(value: unknown): AspireMcpSmokeReceipt['doctor'] {
  const source = record(value, 'doctor result');
  const checks = Reflect.get(source, 'checks');
  const summary = record(Reflect.get(source, 'summary'), 'doctor summary');
  if (!Array.isArray(checks)) throw new Error('doctor omitted checks[]');
  const versionCheck = checks.find((entry) =>
    Reflect.get(record(entry, 'doctor check'), 'name') === 'cli-version'
  );
  if (!versionCheck) throw new Error('doctor omitted cli-version check');
  const check = record(versionCheck, 'cli-version check');
  const metadata = record(Reflect.get(check, 'metadata'), 'cli-version metadata');
  const currentVersion = Reflect.get(metadata, 'currentVersion');
  const status = Reflect.get(check, 'status');
  if (typeof currentVersion !== 'string' || typeof status !== 'string') {
    throw new Error('doctor cli-version check is malformed');
  }
  return {
    cliVersion: status,
    currentVersion,
    summary: {
      passed: numberField(summary, 'passed'),
      warnings: numberField(summary, 'warnings'),
      failed: numberField(summary, 'failed'),
    },
  };
}

/** Extract resource display names and parameter-secret nulling evidence. */
export function resourceEvidence(
  value: unknown,
): { names: string[]; secretParamsNull: boolean } {
  if (!Array.isArray(value)) throw new Error('list_resources result is not an array');
  const names: string[] = [];
  let secretParamsNull = false;
  for (const item of value) {
    const resource = record(item, 'resource');
    const name = Reflect.get(resource, 'display_name') ?? Reflect.get(resource, 'displayName') ??
      Reflect.get(resource, 'name');
    if (typeof name !== 'string') throw new Error('resource omitted display name');
    names.push(name);
    if (!name.endsWith('-password')) continue;
    const properties = record(Reflect.get(resource, 'properties'), 'parameter properties');
    const environment = record(Reflect.get(resource, 'environment'), 'parameter environment');
    secretParamsNull = Reflect.get(properties, 'Value') === null &&
      Object.values(environment).every((entry) => entry === null);
  }
  return { names, secretParamsNull };
}

/** Return true when an MCP-excluded resource has no accessible console output. */
export function emptyOrNotFound(value: unknown): boolean {
  const source = record(value, 'console log result');
  if (Reflect.get(source, 'notFound') === true || Reflect.get(source, 'isError') === true) {
    return true;
  }
  return logCount(value) === 0;
}

/** Count normalized console log lines. */
export function logCount(value: unknown): number {
  const source = record(value, 'console log result');
  const lines = Reflect.get(source, 'lines');
  return Array.isArray(lines) ? lines.length : 0;
}

/** Reject MCP errors and count structured log entries. */
export function structuredLogEvidence(
  value: unknown,
): AspireMcpSmokeReceipt['structuredLogs'] {
  const source = record(value, 'structured log result');
  const isError = Reflect.get(source, 'isError') === true;
  if (isError) throw new Error('list_structured_logs returned an MCP error');
  const items = Reflect.get(source, 'items');
  if (!Array.isArray(items)) throw new Error('list_structured_logs omitted items[]');
  return { entryCount: items.length, isError };
}

/** Resolve a path through the injected filesystem seam. */
export async function realPath(
  path: string,
  dependencies: AspireMcpSmokeDependencies,
): Promise<string> {
  return dependencies.realPath ? await dependencies.realPath(path) : path;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return Object.fromEntries(Object.entries(value));
}

function numberField(source: Record<string, unknown>, key: string): number {
  const value = Reflect.get(source, key);
  if (typeof value !== 'number') throw new Error(`Expected numeric ${key}`);
  return value;
}
