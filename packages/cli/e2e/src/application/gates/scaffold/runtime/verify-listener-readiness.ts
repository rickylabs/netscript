/** One custom listener health report selected from `aspire describe --format Json`. */
export interface ListenerHealthReport {
  readonly resourceName: string;
  readonly healthCheckKey: string;
  readonly status: string;
  readonly description?: string;
  readonly data?: unknown;
  readonly exception?: unknown;
}

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

/** Read every named report on one described resource, retaining diagnostic payloads. */
export function readListenerHealthReports(
  topology: unknown,
  resourceName: string,
): readonly ListenerHealthReport[] {
  const resources = isRecord(topology) && Array.isArray(topology.resources)
    ? topology.resources
    : [];
  for (const candidate of resources) {
    if (!isRecord(candidate) || !resourceMatches(candidate, resourceName)) continue;
    const reports = candidate.healthReports;
    if (!isRecord(reports)) return [];
    const parsed: ListenerHealthReport[] = [];
    for (const [healthCheckKey, report] of Object.entries(reports)) {
      if (!isRecord(report) || typeof report.status !== 'string') {
        throw new Error(`${resourceName} healthReports.${healthCheckKey} has no string status`);
      }
      parsed.push({
        resourceName,
        healthCheckKey,
        status: report.status,
        ...(typeof report.description === 'string' ? { description: report.description } : {}),
        ...('data' in report ? { data: report.data } : {}),
        ...('exception' in report ? { exception: report.exception } : {}),
      });
    }
    return parsed;
  }
  throw new Error(`resource ${resourceName} was never published`);
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
      throw new Error(`${lastFailure}; readiness deadline ${timeoutSeconds}s elapsed`);
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(1_000, remainingMs)));
  }
}

function isTerminalListenerFailure(report: ListenerHealthReport): boolean {
  if (!isRecord(report.data)) return false;
  return report.data.code === 'NOAUTH' || report.data.code === 'EPROTO';
}

function renderDiagnostic(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
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
