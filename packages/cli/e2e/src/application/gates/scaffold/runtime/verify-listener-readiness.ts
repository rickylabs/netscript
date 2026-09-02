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

/** Poll named Aspire health so unpublished and unhealthy states remain distinguishable. */
export async function verifyListenerReadiness(
  appHost: string,
  resourceName: string,
  healthCheckKey: string,
  timeoutSeconds: number,
): Promise<ListenerHealthReport> {
  const deadline = performance.now() + timeoutSeconds * 1_000;
  let lastFailure = `resource ${resourceName} health key ${healthCheckKey} was never published`;

  while (true) {
    try {
      const topology = JSON.parse(
        await runAspire([
          'describe',
          '--apphost',
          appHost,
          '--format',
          'Json',
          '--non-interactive',
          '--nologo',
        ]),
      );
      const reports = readListenerHealthReports(topology, resourceName);
      const expected = reports.find((report) => report.healthCheckKey === healthCheckKey);
      if (!expected) {
        lastFailure = `resource ${resourceName} health key ${healthCheckKey} was never published`;
      } else {
        const blocker = expected.status === 'Healthy'
          ? reports.find((report) => report.status !== 'Healthy')
          : expected;
        if (!blocker) {
          console.info(`${resourceName} ${healthCheckKey} listener health is Healthy`);
          return expected;
        }
        lastFailure = listenerReadinessFailure(blocker);
        if (isTerminalListenerFailure(blocker)) throw new Error(lastFailure);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('exists but is unhealthy')) throw error;
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    const remainingMs = deadline - performance.now();
    if (remainingMs <= 0) {
      throw new Error(
        await captureListenerReadinessDeadline(
          appHost,
          resourceName,
          healthCheckKey,
          timeoutSeconds,
          lastFailure,
        ),
      );
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(1_000, remainingMs)));
  }
}

async function captureListenerReadinessDeadline(
  appHost: string,
  resourceName: string,
  healthCheckKey: string,
  timeoutSeconds: number,
  lastFailure: string,
): Promise<string> {
  let snapshot: ListenerReadinessSnapshot;
  try {
    const topology = JSON.parse(
      await runAspire([
        'describe',
        '--apphost',
        appHost,
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ]),
    );
    snapshot = readListenerReadinessSnapshot(topology, resourceName);
  } catch (error) {
    snapshot = {
      resourceName,
      match: 'unknown',
      healthReports: [],
      describeError: `${lastFailure}; final describe failed: ${renderError(error)}`,
    };
  }

  let logLines: readonly string[];
  try {
    logLines = readAspireLogLines(
      await runAspire([
        'logs',
        resourceName,
        '--apphost',
        appHost,
        '--tail',
        String(LISTENER_LOG_TAIL_LINES),
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ]),
    );
  } catch (error) {
    logLines = [`<unavailable: ${renderError(error)}>`];
  }
  return formatListenerReadinessDeadline(snapshot, healthCheckKey, timeoutSeconds, logLines);
}

function isTerminalListenerFailure(report: ListenerHealthReport): boolean {
  if (!isRecord(report.data)) return false;
  return report.data.code === 'NOAUTH' || report.data.code === 'EPROTO';
}

function renderDiagnostic(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
}

function renderError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
  const timeoutSeconds = Number.parseInt(Deno.args[3] ?? '', 10);
  if (!appHost) throw new Error('AppHost path argument is required');
  if (!resourceName) throw new Error('resource name argument is required');
  if (!healthCheckKey) throw new Error('health-check key argument is required');
  if (!Number.isSafeInteger(timeoutSeconds) || timeoutSeconds <= 0) {
    throw new Error('positive timeout-seconds argument is required');
  }
  await verifyListenerReadiness(appHost, resourceName, healthCheckKey, timeoutSeconds);
}
