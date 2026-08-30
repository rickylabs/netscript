/** One custom listener health report selected from `aspire describe --format Json`. */
export interface ListenerHealthReport {
  readonly resourceName: string;
  readonly healthCheckKey: string;
  readonly status: string;
  readonly description?: string;
}

/** Read a resource's named object-valued 13.5 health report without accepting array drift. */
export function readListenerHealthReport(
  topology: unknown,
  resourceName: string,
  healthCheckKey: string,
): ListenerHealthReport {
  const resources = isRecord(topology) && Array.isArray(topology.resources)
    ? topology.resources
    : [];
  for (const candidate of resources) {
    if (!isRecord(candidate) || !resourceMatches(candidate, resourceName)) continue;
    const reports = candidate.healthReports;
    if (!isRecord(reports) || !(healthCheckKey in reports)) continue;
    const report = reports[healthCheckKey];
    if (!isRecord(report) || typeof report.status !== 'string') {
      throw new Error(`${resourceName} healthReports.${healthCheckKey} has no string status`);
    }
    return {
      resourceName,
      healthCheckKey,
      status: report.status,
      ...(typeof report.description === 'string' ? { description: report.description } : {}),
    };
  }
  throw new Error(`${resourceName} omitted healthReports.${healthCheckKey}`);
}

/** Wait for Aspire health, then require the expected custom report to be Healthy. */
export async function verifyListenerReadiness(
  appHost: string,
  resourceName: string,
  healthCheckKey: string,
  timeoutSeconds: number,
): Promise<ListenerHealthReport> {
  await runAspire([
    'wait',
    resourceName,
    '--status',
    'healthy',
    '--timeout',
    String(timeoutSeconds),
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
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
  const report = readListenerHealthReport(topology, resourceName, healthCheckKey);
  if (report.status !== 'Healthy') {
    throw new Error(
      `${resourceName} healthReports.${healthCheckKey} is ${report.status}, expected Healthy`,
    );
  }
  console.info(`${resourceName} ${healthCheckKey} listener health is Healthy`);
  return report;
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

function resourceMatches(resource: Readonly<Record<string, unknown>>, expected: string): boolean {
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
