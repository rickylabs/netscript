import type { ListenerReadinessExpectation } from './listener-readiness-gates.ts';
import {
  type ListenerHealthReport,
  readListenerHealthReport,
} from './evidence/listener-readiness.ts';

const UNHEALTHY_DESCRIPTION = /listener unreachable: (?:ECONNREFUSED|ETIMEDOUT)/;
const REPORT_DEADLINE_MS = 30_000;
const REPORT_POLL_MS = 1_000;

interface ListenerRecoveryReceipt {
  readonly resource: string;
  readonly healthCheckKey: string;
  readonly unhealthy: ListenerHealthReport;
  readonly waitExitCode: number;
  readonly recovered: ListenerHealthReport;
}

interface AspireResult {
  readonly code: number;
  readonly success: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

/** Exercise stop → Unhealthy/exit-18 → start → Healthy for each selected backing service. */
export async function verifyListenerFailureRecovery(
  appHost: string,
  projectRoot: string,
  expectations: readonly ListenerReadinessExpectation[],
): Promise<readonly ListenerRecoveryReceipt[]> {
  const receipts: ListenerRecoveryReceipt[] = [];
  for (const expectation of expectations) {
    let stopped = false;
    let unhealthy: ListenerHealthReport | undefined;
    let waitExitCode: number | undefined;
    try {
      await requireAspireSuccess([
        'resource',
        expectation.resource,
        'stop',
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ]);
      stopped = true;
      unhealthy = await pollReport(
        appHost,
        expectation,
        (report) =>
          report.status === 'Unhealthy' &&
          report.description !== undefined &&
          UNHEALTHY_DESCRIPTION.test(report.description),
      );

      const wait = await runAspire([
        'wait',
        expectation.resource,
        '--status',
        'healthy',
        '--timeout',
        '10',
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ]);
      waitExitCode = wait.code;
      if (waitExitCode !== 18) {
        throw new Error(
          `aspire wait ${expectation.resource} exited ${waitExitCode}, expected 18: ${
            wait.stderr || wait.stdout
          }`,
        );
      }
    } finally {
      if (stopped) {
        await requireAspireSuccess([
          'resource',
          expectation.resource,
          'start',
          '--apphost',
          appHost,
          '--non-interactive',
          '--nologo',
        ]);
      }
    }

    if (!unhealthy || waitExitCode === undefined) {
      throw new Error(`${expectation.resource} did not produce complete unhealthy evidence`);
    }
    const recovered = await pollReport(
      appHost,
      expectation,
      (report) => report.status === 'Healthy',
    );
    receipts.push({
      resource: expectation.resource,
      healthCheckKey: expectation.healthCheckKey,
      unhealthy,
      waitExitCode,
      recovered,
    });
  }

  const receiptDir = `${projectRoot}/.netscript/e2e`;
  const receiptPath = `${receiptDir}/listener-unreachable-receipt.json`;
  await Deno.mkdir(receiptDir, { recursive: true });
  await Deno.writeTextFile(receiptPath, `${JSON.stringify(receipts, null, 2)}\n`);
  console.info(`listener failure/recovery receipt: ${receiptPath}`);
  return receipts;
}

async function pollReport(
  appHost: string,
  expectation: ListenerReadinessExpectation,
  accepts: (report: ListenerHealthReport) => boolean,
): Promise<ListenerHealthReport> {
  const deadline = Date.now() + REPORT_DEADLINE_MS;
  let last = 'report absent';
  while (Date.now() < deadline) {
    try {
      const topology = JSON.parse(
        (await requireAspireSuccess([
          'describe',
          '--apphost',
          appHost,
          '--format',
          'Json',
          '--non-interactive',
          '--nologo',
        ])).stdout,
      );
      const report = readListenerHealthReport(
        topology,
        expectation.resource,
        expectation.healthCheckKey,
      );
      last = `${report.status}: ${report.description ?? '(no description)'}`;
      if (accepts(report)) return report;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, REPORT_POLL_MS));
  }
  throw new Error(
    `${expectation.resource} healthReports.${expectation.healthCheckKey} missed its 30s transition; last=${last}`,
  );
}

async function requireAspireSuccess(args: readonly string[]): Promise<AspireResult> {
  const result = await runAspire(args);
  if (!result.success) {
    throw new Error(
      `aspire ${args.join(' ')} failed (${result.code}): ${result.stderr || result.stdout}`,
    );
  }
  return result;
}

async function runAspire(args: readonly string[]): Promise<AspireResult> {
  const output = await new Deno.Command('aspire', {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    success: output.success,
    stdout: new TextDecoder().decode(output.stdout).trim(),
    stderr: new TextDecoder().decode(output.stderr).trim(),
  };
}

function parseExpectations(value: string): readonly ListenerReadinessExpectation[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('listener readiness expectations must be a non-empty array');
  }
  return parsed.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.resource !== 'string' ||
      typeof entry.healthCheckKey !== 'string' ||
      typeof entry.timeoutSeconds !== 'number'
    ) {
      throw new Error(`listener readiness expectation ${index} is invalid`);
    }
    return {
      resource: entry.resource,
      healthCheckKey: entry.healthCheckKey,
      timeoutSeconds: entry.timeoutSeconds,
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const appHost = Deno.args[0];
  const projectRoot = Deno.args[1];
  const expectations = Deno.args[2];
  if (!appHost) throw new Error('AppHost path argument is required');
  if (!projectRoot) throw new Error('project root argument is required');
  if (!expectations) throw new Error('listener readiness expectations are required');
  await verifyListenerFailureRecovery(appHost, projectRoot, parseExpectations(expectations));
}
