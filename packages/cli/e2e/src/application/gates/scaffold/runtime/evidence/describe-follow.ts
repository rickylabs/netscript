import { captureAspireStartAndDescribe, captureDescribeFollow } from './describe-capture.ts';
export { captureAspireStartAndDescribe, captureDescribeFollow } from './describe-capture.ts';

const READY_STATES: readonly string[] = ['Healthy', 'Ready', 'Running', 'Finished'];

/** One object-valued Aspire health report, including the DTO's nullable pending state. */
export type DescribeHealthReport =
  | {
    readonly status: 'Unknown';
    readonly pending: true;
    readonly description?: string;
  }
  | {
    readonly status: string;
    readonly pending: false;
    readonly description?: string;
  };

interface DescribeResourceNullableFields {
  readonly name?: string | null;
  readonly displayName?: string | null;
  readonly resourceName?: string | null;
  readonly resourceType?: string | null;
  readonly uid?: string | null;
  readonly state?: string | null;
  readonly waitingFor?: readonly string[] | null;
  readonly stateStyle?: string | null;
  readonly creationTimestamp?: string | null;
  readonly startTimestamp?: string | null;
  readonly stopTimestamp?: string | null;
  readonly source?: string | null;
  readonly exitCode?: number | null;
  readonly healthStatus?: string | null;
  readonly dashboardUrl?: string | null;
  readonly relationships?: readonly unknown[] | null;
  readonly urls?: readonly unknown[] | null;
  readonly volumes?: readonly unknown[] | null;
  readonly properties?: Readonly<Record<string, unknown>> | null;
  readonly environment?: Readonly<Record<string, string | null>> | null;
  readonly healthReports?: Readonly<Record<string, DescribeHealthReport>> | null;
  readonly commands?: Readonly<Record<string, unknown>> | null;
}

/** Nullable Aspire ResourceJson line with at least one usable identity field. */
export type DescribeResourceLine =
  & DescribeResourceNullableFields
  & (
    | { readonly displayName: string }
    | { readonly name: string }
    | { readonly resourceName: string }
  );

/** Last-seen resource observation in an Aspire describe stream. */
export interface DescribeResourceObservation {
  readonly name: string;
  readonly state: string;
  readonly statePending: boolean;
  readonly healthStatus?: string;
  readonly healthReports: Readonly<Record<string, DescribeHealthReport>>;
}

/** Parse last-seen resource observations without applying the convergence policy. */
export function parseDescribeFollow(
  text: string,
): { readonly resources: readonly DescribeResourceObservation[] } {
  const observations = new Map<string, DescribeResourceObservation>();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('aspire describe follow stream is empty');
  for (const [index, line] of lines.entries()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`aspire describe follow line ${index + 1} is not JSON`);
    }
    for (const resource of resources(parsed, index)) observations.set(resource.name, resource);
  }
  return { resources: [...observations.values()] };
}

/** Evaluate last-seen resource state and health from an Aspire describe NDJSON stream. */
export function evaluateDescribeFollow(
  text: string,
  expectedResources: readonly string[],
): { readonly resources: readonly DescribeResourceObservation[] } {
  const observations = new Map(
    parseDescribeFollow(text).resources.map((resource) => [resource.name, resource]),
  );
  const missing = expectedResources.filter((name) => !observations.has(normalizeName(name)));
  if (missing.length > 0) {
    throw new Error(`describe stream omitted resources: ${missing.join(', ')}`);
  }
  const selected = expectedResources.map((name) => observations.get(normalizeName(name))).filter(
    (entry): entry is DescribeResourceObservation => entry !== undefined,
  );
  const pending = selected.filter((entry) => entry.statePending || !isReadyState(entry.state));
  if (pending.length > 0) {
    throw new Error(
      `describe resources did not converge: ${
        pending.map((entry) => `${entry.name}=${entry.state}`).join(', ')
      }`,
    );
  }
  const unhealthy = selected.flatMap((entry) => [
    ...(entry.healthStatus && entry.healthStatus !== 'Healthy'
      ? [`${entry.name}.healthStatus=${entry.healthStatus}`]
      : []),
    ...Object.entries(entry.healthReports)
      .filter(([, report]) => report.pending || report.status !== 'Healthy')
      .map(([key, report]) => `${entry.name}.healthReports.${key}=${report.status}`),
  ]);
  if (unhealthy.length > 0) {
    throw new Error(`describe resources did not converge: ${unhealthy.join(', ')}`);
  }
  return { resources: selected };
}

/** Assert one resource and optional health report from a captured describe stream. */
export function assertDescribeResource(
  text: string,
  resourceName: string,
  healthCheckKey?: string,
): DescribeResourceObservation {
  const resource = evaluateDescribeFollow(text, [resourceName]).resources[0];
  if (!resource) throw new Error(`describe stream omitted ${resourceName}`);
  if (healthCheckKey) {
    const report = resource.healthReports[healthCheckKey];
    if (!report) throw new Error(`${resourceName} omitted healthReports.${healthCheckKey}`);
    if (report.status !== 'Healthy') {
      throw new Error(
        `${resourceName} healthReports.${healthCheckKey} is ${report.status}, expected Healthy`,
      );
    }
  }
  return resource;
}

function resources(value: unknown, lineIndex: number): DescribeResourceObservation[] {
  const root = record(value, `describe line ${lineIndex + 1}`);
  const wrapped = Reflect.has(root, 'resources');
  const source = Reflect.get(root, 'resources');
  if (wrapped && !Array.isArray(source)) {
    throw new Error(`describe line ${lineIndex + 1} resources is not an array`);
  }
  const candidates = wrapped && Array.isArray(source) ? source : [root];
  return candidates.map((entry, resourceIndex) => resource(entry, lineIndex, resourceIndex));
}

function resource(
  value: unknown,
  lineIndex: number,
  resourceIndex: number,
): DescribeResourceObservation {
  const line = describeResourceLine(value, lineIndex, resourceIndex);
  const name = describeResourceIdentity(line);
  const statePending = line.state === undefined || line.state === null;
  return {
    name: normalizeName(name),
    state: statePending ? 'Unknown' : line.state,
    statePending,
    ...(line.healthStatus === undefined || line.healthStatus === null
      ? {}
      : { healthStatus: line.healthStatus }),
    healthReports: line.healthReports ?? {},
  };
}

function describeResourceLine(
  value: unknown,
  lineIndex: number,
  resourceIndex: number,
): DescribeResourceLine {
  const resourceLabel = `describe line ${lineIndex + 1} resource ${resourceIndex + 1}`;
  const source = record(value, resourceLabel);
  const identity = resourceIdentity(source, resourceLabel);
  const fieldLabel = `describe line ${lineIndex + 1} ${identity.value}`;
  const state = nullableString(source, 'state', fieldLabel);
  const healthStatus = nullableString(source, 'healthStatus', fieldLabel);
  const reportsValue = Reflect.get(source, 'healthReports');
  const healthReportsValue = reportsValue === undefined
    ? undefined
    : reportsValue === null
    ? null
    : healthReports(reportsValue, identity.value, lineIndex);
  const nullableFields = {
    ...(state === undefined ? {} : { state }),
    ...(healthStatus === undefined ? {} : { healthStatus }),
    ...(healthReportsValue === undefined ? {} : { healthReports: healthReportsValue }),
  };
  if (identity.field === 'displayName') {
    return { displayName: identity.value, ...nullableFields };
  }
  if (identity.field === 'name') return { name: identity.value, ...nullableFields };
  return { resourceName: identity.value, ...nullableFields };
}

function resourceIdentity(
  source: Record<string, unknown>,
  label: string,
):
  | { readonly field: 'displayName'; readonly value: string }
  | { readonly field: 'name'; readonly value: string }
  | { readonly field: 'resourceName'; readonly value: string } {
  const displayName = nonEmptyString(Reflect.get(source, 'displayName'));
  if (displayName) return { field: 'displayName', value: displayName };
  const name = nonEmptyString(Reflect.get(source, 'name'));
  if (name) return { field: 'name', value: name };
  const resourceName = nonEmptyString(Reflect.get(source, 'resourceName'));
  if (resourceName) return { field: 'resourceName', value: resourceName };
  throw new Error(`${label} omitted identity (displayName/name/resourceName)`);
}

function describeResourceIdentity(line: DescribeResourceLine): string {
  const displayName = nonEmptyString(line.displayName);
  if (displayName) return displayName;
  const name = nonEmptyString(line.name);
  if (name) return name;
  const resourceName = nonEmptyString(line.resourceName);
  if (resourceName) return resourceName;
  throw new Error('DescribeResourceLine identity invariant failed');
}

function healthReports(
  value: unknown,
  resourceName: string,
  lineIndex: number,
): Record<string, DescribeHealthReport> {
  const prefix = `describe line ${lineIndex + 1} ${resourceName} healthReports`;
  const source = record(value, prefix);
  const reports: Record<string, DescribeHealthReport> = {};
  for (const [key, candidate] of Object.entries(source)) {
    const report = record(candidate, `${prefix}.${key}`);
    const status = Reflect.get(report, 'status');
    if (status !== undefined && status !== null && typeof status !== 'string') {
      throw new Error(`${prefix}.${key} status must be a string, null, or omitted`);
    }
    const description = Reflect.get(report, 'description');
    const details = typeof description === 'string' ? { description } : {};
    reports[key] = status === undefined || status === null
      ? { status: 'Unknown', pending: true, ...details }
      : { status, pending: false, ...details };
  }
  return reports;
}

function nullableString(
  source: Record<string, unknown>,
  key: string,
  label: string,
): string | null | undefined {
  const value = Reflect.get(source, key);
  if (value === undefined || value === null || typeof value === 'string') return value;
  throw new Error(`${label} ${key} must be a string, null, or omitted`);
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return Object.fromEntries(Object.entries(value));
}

function isReadyState(state: string): boolean {
  return READY_STATES.some((candidate) => candidate.toLowerCase() === state.toLowerCase());
}

/** Whether a valid describe stream still awaits resources or healthy states. */
export function isPendingConvergence(message: string): boolean {
  return message.includes('omitted resources:') || message.includes('did not converge:');
}

function normalizeName(name: string): string {
  return name.toLowerCase();
}

if (import.meta.main) {
  const [mode, first, second, third, fourth] = Deno.args;
  if (mode === 'capture') {
    if (!first || !second || !third) {
      throw new Error('capture requires AppHost, project root, and expected-resource JSON');
    }
    const expected: unknown = JSON.parse(third);
    if (!Array.isArray(expected) || !expected.every((entry) => typeof entry === 'string')) {
      throw new Error('expected-resource JSON must be a string array');
    }
    await captureAspireStartAndDescribe(first, second, expected, timeoutArgument(fourth));
  } else if (mode === 'refresh') {
    if (!first || !second || !third) {
      throw new Error('refresh requires AppHost, stream path, and expected-resource JSON');
    }
    const expected: unknown = JSON.parse(third);
    if (!Array.isArray(expected) || !expected.every((entry) => typeof entry === 'string')) {
      throw new Error('expected-resource JSON must be a string array');
    }
    await captureDescribeFollow(first, second, expected, timeoutArgument(fourth));
  } else if (mode === 'assert') {
    if (!first || !second) throw new Error('assert requires stream path and resource name');
    const observation = assertDescribeResource(await Deno.readTextFile(first), second, third);
    console.info(`${observation.name} converged at ${observation.state}`);
  } else {
    throw new Error('mode must be capture, refresh, or assert');
  }
}

function timeoutArgument(value: string | undefined): number {
  if (value === undefined) return 0;
  const timeoutSeconds = Number(value);
  if (!Number.isSafeInteger(timeoutSeconds) || timeoutSeconds <= 0) {
    throw new Error('timeout argument must be a positive integer');
  }
  return timeoutSeconds;
}
