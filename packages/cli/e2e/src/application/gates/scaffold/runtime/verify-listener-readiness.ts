import { type ResourceUpdate, watchResourceUpdates } from './resource-state-stream.ts';

/** One custom listener health report selected from `aspire describe --format Json`. */
export interface ListenerHealthReport {
  readonly resourceName: string;
  readonly healthCheckKey: string;
  readonly status: string;
  readonly description?: string;
  readonly data?: unknown;
  readonly exception?: unknown;
}

/** One key/status pair published in a resource's Aspire health report map. */
export interface ListenerHealthSummary {
  readonly healthCheckKey: string;
  readonly status: string;
}

/** One post-deadline resource snapshot used to explain listener-readiness failure. */
export interface ListenerReadinessSnapshot {
  readonly resourceName: string;
  readonly match: 'matched' | 'not-found' | 'unknown';
  readonly matchedResourceName?: string;
  readonly state?: string;
  readonly healthStatus?: string;
  readonly healthReports: readonly ListenerHealthSummary[];
  readonly describeError?: string;
}

const LISTENER_LOG_TAIL_LINES = 20;

/** Read a resource's named object-valued 13.5 health report without accepting array drift. */
export function readListenerHealthReport(
  topology: unknown,
  resourceName: string,
  healthCheckKey: string,
): ListenerHealthReport {
  const reports = readListenerHealthReports(topology, resourceName);
  const report = reports.find((candidate) => candidate.healthCheckKey === healthCheckKey);
  if (!report) {
    throw new Error(`resource ${resourceName} health key ${healthCheckKey} was never published`);
  }
  return report;
}

/**
 * Look up one named report without failing when it is absent.
 *
 * A report that has not been published *yet* is not the same as one that will never appear. Wait
 * loops need the first case to mean "keep waiting"; `readListenerHealthReport` throws for both,
 * which turned a transient absence into a fatal error inside a loop written to tolerate it.
 */
export function findListenerHealthReport(
  topology: unknown,
  resourceName: string,
  healthCheckKey: string,
): ListenerHealthReport | undefined {
  return readListenerHealthReports(topology, resourceName)
    .find((candidate) => candidate.healthCheckKey === healthCheckKey);
}

/** Read every named report on one described resource, retaining diagnostic payloads. */
export function readListenerHealthReports(
  topology: unknown,
  resourceName: string,
): readonly ListenerHealthReport[] {
  const resource = findListenerResource(topology, resourceName);
  if (resource) return parseListenerHealthReports(resource, resourceName);
  throw new Error(`resource ${resourceName} was never published`);
}

/** Select the state and named-health evidence from one described resource. */
export function readListenerReadinessSnapshot(
  topology: unknown,
  resourceName: string,
): ListenerReadinessSnapshot {
  const resource = findListenerResource(topology, resourceName);
  if (!resource) {
    return { resourceName, match: 'not-found', healthReports: [] };
  }
  const healthReports = parseListenerHealthReports(resource, resourceName)
    .map(({ healthCheckKey, status }) => ({ healthCheckKey, status }))
    .sort((left, right) => left.healthCheckKey.localeCompare(right.healthCheckKey));
  return {
    resourceName,
    match: 'matched',
    ...(readResourceName(resource) ? { matchedResourceName: readResourceName(resource) } : {}),
    ...(typeof resource.state === 'string' ? { state: resource.state } : {}),
    ...(typeof resource.healthStatus === 'string' ? { healthStatus: resource.healthStatus } : {}),
    healthReports,
  };
}

/** Format one deadline snapshot without treating logs as the readiness authority. */
export function formatListenerReadinessDeadline(
  snapshot: ListenerReadinessSnapshot,
  healthCheckKey: string,
  timeoutSeconds: number,
  logLines: readonly string[],
): string {
  const expected = snapshot.healthReports.find((report) =>
    report.healthCheckKey === healthCheckKey
  );
  let classification: string;
  if (snapshot.match === 'unknown') {
    classification = `resource ${snapshot.resourceName} match is unknown: ${
      snapshot.describeError ?? 'describe failed without detail'
    }`;
  } else if (snapshot.match === 'not-found') {
    classification = `resource ${snapshot.resourceName} was not matched`;
  } else if (snapshot.state !== 'Running') {
    classification = `resource ${snapshot.resourceName} not Running (state=${
      snapshot.state ?? 'unknown'
    })`;
  } else if (!expected) {
    classification =
      `resource ${snapshot.resourceName} Running but health key ${healthCheckKey} was never published`;
  } else if (expected.status !== 'Healthy') {
    classification =
      `resource ${snapshot.resourceName} Running with health key ${healthCheckKey}=${expected.status}`;
  } else {
    classification =
      `resource ${snapshot.resourceName} Running with health key ${healthCheckKey}=Healthy but readiness remained blocked`;
  }

  const published = snapshot.healthReports.length === 0
    ? 'none'
    : snapshot.healthReports.map((report) => `${report.healthCheckKey}=${report.status}`).join(
      ', ',
    );
  const matched = snapshot.match === 'unknown' ? 'unknown' : String(snapshot.match === 'matched');
  const logs = logLines.length === 0
    ? '<none>'
    : logLines.slice(-LISTENER_LOG_TAIL_LINES).join('\n');
  return `${classification}; matched=${matched}; matchedResource=${
    snapshot.matchedResourceName ?? 'none'
  }; state=${snapshot.state ?? 'unknown'}; healthStatus=${
    snapshot.healthStatus ?? 'unknown'
  }; published health reports=${published}; readiness deadline ${timeoutSeconds}s elapsed; ` +
    `aspire logs (last ${LISTENER_LOG_TAIL_LINES} lines):\n${logs}`;
}

/** Parse Aspire's JSON array/object or NDJSON console-log output into content lines. */
export function readAspireLogLines(output: string): readonly string[] {
  const trimmed = output.trim();
  if (!trimmed) return [];
  try {
    return collectAspireLogLines(JSON.parse(trimmed));
  } catch {
    return trimmed.split(/\r?\n/).flatMap((line) => {
      try {
        return collectAspireLogLines(JSON.parse(line));
      } catch {
        return [line];
      }
    });
  }
}

/** Format the published-but-unhealthy state without discarding report diagnostics. */
export function listenerReadinessFailure(report: ListenerHealthReport): string {
  const details = [
    `status=${report.status}`,
    ...(report.description === undefined
      ? []
      : [`description=${renderDiagnostic(report.description)}`]),
    ...(report.data === undefined ? [] : [`data=${renderDiagnostic(report.data)}`]),
    ...(report.exception === undefined ? [] : [`exception=${renderDiagnostic(report.exception)}`]),
  ];
  return `${report.resourceName} health key ${report.healthCheckKey} exists but is unhealthy: ${
    details.join(' ')
  }`;
}

/** Observe aggregate readiness, then validate named reports from one settled snapshot. */
export async function verifyListenerReadiness(
  appHost: string,
  resourceName: string,
  healthCheckKey: string,
  failureCeilingMs: number,
  watch: typeof watchResourceUpdates = watchResourceUpdates,
  readSnapshot: (appHost: string, resourceName: string) => Promise<string> = describeResource,
): Promise<ListenerHealthReport> {
  const subscription = await watch(appHost, resourceName);
  try {
    let update: ResourceUpdate;
    try {
      update = await subscription.waitFor(
        (candidate) => resourceHealthIs(candidate, 'Healthy'),
        failureCeilingMs,
      );
    } catch (error) {
      throw new Error(
        `Aspire did not observe ${resourceName} transition to aggregate Healthy before the ` +
          `${failureCeilingMs}ms test-failure ceiling`,
        { cause: error },
      );
    }

    // Follow output establishes the transition but does not promise per-check healthReports. This
    // single snapshot is attribution after an observed event, never a sample used to discover it.
    const rawSnapshot = await readSnapshot(appHost, resourceName);
    const reports = readListenerHealthReports(JSON.parse(rawSnapshot), resourceName);
    const expected = reports.find((report) => report.healthCheckKey === healthCheckKey);
    if (!expected) {
      throw observedWrongValue(
        resourceName,
        healthCheckKey,
        `the named report was not published; raw event: ${update.rawLine}`,
      );
    }
    const blocker = expected.status === 'Healthy'
      ? reports.find((report) => report.status !== 'Healthy')
      : expected;
    if (blocker) {
      throw observedWrongValue(
        resourceName,
        healthCheckKey,
        listenerReadinessFailure(blocker),
      );
    }
    console.info(`${resourceName} ${healthCheckKey} listener health is Healthy`);
    return expected;
  } finally {
    await subscription.close();
  }
}

function renderDiagnostic(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
}

function observedWrongValue(
  resourceName: string,
  healthCheckKey: string,
  detail: string,
): Error {
  return new Error(
    `Aspire observed ${resourceName} aggregate Healthy, but healthReports.${healthCheckKey} ` +
      `had the wrong value: ${detail}`,
  );
}

function findListenerResource(
  topology: unknown,
  resourceName: string,
): Readonly<Record<string, unknown>> | undefined {
  const resources = isRecord(topology) && Array.isArray(topology.resources)
    ? topology.resources
    : [];
  return resources.find((candidate): candidate is Readonly<Record<string, unknown>> =>
    isRecord(candidate) && resourceMatches(candidate, resourceName)
  );
}

function parseListenerHealthReports(
  resource: Readonly<Record<string, unknown>>,
  resourceName: string,
): readonly ListenerHealthReport[] {
  const reports = resource.healthReports;
  if (!isRecord(reports)) return [];
  return Object.entries(reports).map(([healthCheckKey, report]) => {
    if (!isRecord(report) || typeof report.status !== 'string') {
      throw new Error(`${resourceName} healthReports.${healthCheckKey} has no string status`);
    }
    return {
      resourceName,
      healthCheckKey,
      status: report.status,
      ...(typeof report.description === 'string' ? { description: report.description } : {}),
      ...('data' in report ? { data: report.data } : {}),
      ...('exception' in report ? { exception: report.exception } : {}),
    };
  });
}

function readResourceName(resource: Readonly<Record<string, unknown>>): string | undefined {
  for (const key of ['name', 'displayName', 'resourceName']) {
    if (typeof resource[key] === 'string') return resource[key];
  }
  return undefined;
}

function collectAspireLogLines(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap(collectAspireLogLines);
  if (!isRecord(value)) return [];
  if (Array.isArray(value.logs)) return value.logs.flatMap(collectAspireLogLines);
  if (typeof value.content !== 'string') return [];
  const prefix = value.isError === true ? '[stderr] ' : '';
  return value.content.split(/\r?\n/).map((line) => `${prefix}${line}`);
}

async function runAspire(args: readonly string[]): Promise<string> {
  const result = await new Deno.Command('aspire', {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(result.stdout).trim();
  const stderr = new TextDecoder().decode(result.stderr).trim();
  if (!result.success) {
    throw new Error(`aspire ${args.join(' ')} failed (${result.code}): ${stderr || stdout}`);
  }
  return stdout;
}

async function describeResource(appHost: string, resourceName: string): Promise<string> {
  return await runAspire([
    'describe',
    resourceName,
    '--apphost',
    appHost,
    '--format',
    'Json',
    '--non-interactive',
    '--nologo',
  ]);
}

function resourceHealthIs(update: ResourceUpdate, expected: 'Healthy'): boolean {
  const healthStatus = update.resource.healthStatus;
  if (typeof healthStatus !== 'string') {
    throw new Error(
      `Aspire follow update for the scoped resource has no string healthStatus; raw line: ` +
        update.rawLine,
    );
  }
  return healthStatus.toLowerCase() === expected.toLowerCase();
}

/** Match a resource's `displayName`/`name`/`resourceName` against a base or ID-suffixed name. */
export function resourceMatches(
  resource: Readonly<Record<string, unknown>>,
  expected: string,
): boolean {
  for (const key of ['displayName', 'name', 'resourceName']) {
    const candidate = resource[key];
    if (
      typeof candidate === 'string' &&
      (candidate.toLowerCase() === expected.toLowerCase() ||
        candidate.toLowerCase().startsWith(`${expected.toLowerCase()}-`))
    ) {
      return true;
    }
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const appHost = Deno.args[0];
  const resourceName = Deno.args[1];
  const healthCheckKey = Deno.args[2];
  const failureCeilingMs = Number.parseInt(Deno.args[3] ?? '', 10);
  if (!appHost) throw new Error('AppHost path argument is required');
  if (!resourceName) throw new Error('resource name argument is required');
  if (!healthCheckKey) throw new Error('health-check key argument is required');
  if (!Number.isSafeInteger(failureCeilingMs) || failureCeilingMs <= 0) {
    throw new Error('positive failure-ceiling-ms argument is required');
  }
  await verifyListenerReadiness(appHost, resourceName, healthCheckKey, failureCeilingMs);
}
