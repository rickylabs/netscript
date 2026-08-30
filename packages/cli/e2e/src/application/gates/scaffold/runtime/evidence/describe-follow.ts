import { join } from '@std/path';
import { resolveDbCliTimeoutSeconds } from '../../../../../../../src/kernel/adapters/database/operation-runner-helpers.ts';

const READY_STATES: readonly string[] = ['Healthy', 'Ready', 'Running', 'Finished'];
const RESOURCE_NAME_FIELDS: readonly string[] = ['displayName', 'name', 'resourceName'];

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

/** Last-seen resource observation in an Aspire describe stream. */
export interface DescribeResourceObservation {
  readonly name: string;
  readonly state: string;
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
  const pending = selected.filter((entry) => !isReadyState(entry.state));
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

/** Start Aspire and capture a bounded describe-follow stream through resource convergence. */
export async function captureAspireStartAndDescribe(
  appHost: string,
  projectRoot: string,
  expectedResources: readonly string[],
): Promise<void> {
  const start = await commandOutput('aspire', [
    'start',
    '--apphost',
    appHost,
    '--isolated',
    '--non-interactive',
    '--nologo',
    '--format',
    'Json',
  ]);
  const metadata: unknown = JSON.parse(extractJson(start));
  const stateDir = join(projectRoot, '.netscript', 'e2e');
  const startPath = join(stateDir, 'aspire-start.json');
  const describePath = join(stateDir, 'aspire-describe.ndjson');
  await Deno.mkdir(stateDir, { recursive: true });
  await Deno.writeTextFile(startPath, `${JSON.stringify(metadata, null, 2)}\n`);
  await captureDescribeFollow(appHost, describePath, expectedResources);
  console.info(`Aspire describe evidence: ${describePath}`);
}

/** Capture a bounded describe-follow stream until the expected resource set converges. */
export async function captureDescribeFollow(
  appHost: string,
  describePath: string,
  expectedResources: readonly string[],
): Promise<void> {
  await Deno.writeTextFile(describePath, '');
  const timeoutSeconds = resolveDbCliTimeoutSeconds();
  const child = new Deno.Command('aspire', {
    args: [
      'describe',
      '--follow',
      '--format',
      'Json',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let timedOut = false;
  let converged = false;
  let accumulated = '';
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
  }, timeoutSeconds * 1_000);
  try {
    for await (const line of lines(child.stdout)) {
      if (!line.trim()) continue;
      accumulated += `${line}\n`;
      await Deno.writeTextFile(describePath, `${line}\n`, { append: true });
      try {
        evaluateDescribeFollow(accumulated, expectedResources);
        converged = true;
        child.kill('SIGTERM');
        break;
      } catch (error) {
        if (!(error instanceof Error) || !isPendingConvergence(error.message)) throw error;
      }
    }
    const status = await child.status;
    if (!converged) {
      const stderr = new TextDecoder().decode(await new Response(child.stderr).arrayBuffer())
        .trim();
      const reason = timedOut
        ? `timed out after ${timeoutSeconds}s`
        : `exited ${status.code}${stderr ? `: ${stderr}` : ''}`;
      throw new Error(`aspire describe --follow did not converge: ${reason}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function resources(value: unknown, lineIndex: number): DescribeResourceObservation[] {
  const root = record(value, `describe line ${lineIndex + 1}`);
  const source = Reflect.get(root, 'resources');
  const candidates = Array.isArray(source)
    ? source
    : RESOURCE_NAME_FIELDS.some((key) => Reflect.has(root, key))
    ? [root]
    : undefined;
  if (!candidates) {
    throw new Error(
      `describe line ${lineIndex + 1} is neither wrapped resources[] nor a bare resource object`,
    );
  }
  return candidates.map((entry, resourceIndex) => resource(entry, lineIndex, resourceIndex));
}

function resource(
  value: unknown,
  lineIndex: number,
  resourceIndex: number,
): DescribeResourceObservation {
  const source = record(value, `describe line ${lineIndex + 1} resource ${resourceIndex + 1}`);
  const name = firstString(source, RESOURCE_NAME_FIELDS);
  if (!name) {
    throw new Error(`describe line ${lineIndex + 1} resource ${resourceIndex + 1} omitted name`);
  }
  const state = firstString(source, ['state', 'status', 'resourceState']);
  if (!state) throw new Error(`${name} omitted state`);
  const healthStatus = firstString(source, ['healthStatus']);
  const reportsValue = Reflect.get(source, 'healthReports');
  const reports = reportsValue === undefined ? {} : healthReports(reportsValue, name, lineIndex);
  return {
    name: normalizeName(name),
    state,
    ...(healthStatus ? { healthStatus } : {}),
    healthReports: reports,
  };
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

async function* lines(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  let buffered = '';
  const decoder = new TextDecoder();
  for await (const chunk of stream) {
    buffered += decoder.decode(chunk, { stream: true });
    const parts = buffered.split(/\r?\n/);
    buffered = parts.pop() ?? '';
    for (const line of parts) yield line;
  }
  buffered += decoder.decode();
  if (buffered) yield buffered;
}

async function commandOutput(command: string, args: readonly string[]): Promise<string> {
  const output = await new Deno.Command(command, {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr).trim();
  if (!output.success) throw new Error(`${command} ${args.join(' ')} failed: ${stderr || stdout}`);
  return stdout;
}

function extractJson(output: string): string {
  const index = output.indexOf('{');
  if (index < 0) throw new Error('aspire start did not emit JSON');
  return output.slice(index);
}

function firstString(source: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = Reflect.get(source, key);
    if (typeof value === 'string') return value;
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

function isPendingConvergence(message: string): boolean {
  return message.includes('omitted resources:') || message.includes('did not converge:');
}

function normalizeName(name: string): string {
  return name.toLowerCase();
}

if (import.meta.main) {
  const [mode, first, second, third] = Deno.args;
  if (mode === 'capture') {
    if (!first || !second || !third) {
      throw new Error('capture requires AppHost, project root, and expected-resource JSON');
    }
    const expected: unknown = JSON.parse(third);
    if (!Array.isArray(expected) || !expected.every((entry) => typeof entry === 'string')) {
      throw new Error('expected-resource JSON must be a string array');
    }
    await captureAspireStartAndDescribe(first, second, expected);
  } else if (mode === 'assert') {
    if (!first || !second) throw new Error('assert requires stream path and resource name');
    const observation = assertDescribeResource(await Deno.readTextFile(first), second, third);
    console.info(`${observation.name} converged at ${observation.state}`);
  } else {
    throw new Error('mode must be capture or assert');
  }
}
