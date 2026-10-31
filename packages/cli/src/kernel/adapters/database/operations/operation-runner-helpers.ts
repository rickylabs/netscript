import type { DbOperationRequest } from '../../../domain/db-engine.ts';
import type { AspireCommandExecutor } from './aspire-command-executor.ts';

interface AspireResourceStatus {
  readonly displayName?: string;
  readonly name?: string;
  readonly exitCode?: number | null;
  readonly type?: string;
  readonly resourceType?: string;
  readonly state?: string | null;
}

interface AspireAppHostStatus {
  readonly appHostPath?: string;
  readonly resources?: readonly AspireResourceStatus[];
}

export const TERMINAL_RESOURCE_STATES: ReadonlySet<string> = new Set([
  'Exited',
  'Failed',
  'Finished',
  'Stopped',
]);

interface ExecutableWatchOptions {
  readonly resourceName: string;
  readonly apphostPath: string;
  readonly cwd: string;
  readonly timeoutMs: number;
  readonly signal: AbortSignal;
  readonly start: (signal: AbortSignal) => Promise<void>;
}

/** Establish the baseline before start, then observe only the new executable lifecycle. */
export async function watchExecutableCompletion(
  executor: AspireCommandExecutor,
  options: ExecutableWatchOptions,
): Promise<number> {
  const { resourceName, apphostPath } = options;
  const deadline = new AbortController();
  const timer = setTimeout(() =>
    deadline.abort(
      new Error(`Timed out waiting for Aspire resource ${resourceName} to complete.`),
    ), options.timeoutMs);
  const signal = AbortSignal.any([options.signal, deadline.signal]);
  const stream = executor.stream(
    [
      'describe',
      resourceName,
      '--follow',
      '--format',
      'Json',
      '--apphost',
      apphostPath,
      '--non-interactive',
      '--nologo',
    ],
    { cwd: options.cwd, signal },
  );
  try {
    // A previous invocation may have left a terminal snapshot. Never accept it as this run's exit.
    let baseline = false;
    while (!baseline) {
      const initial = await stream.next();
      if (initial.done) {
        throw new Error(`Aspire stream ended before ${resourceName} initial snapshot.`);
      }
      baseline = findExecutableStatus(initial.value, apphostPath, resourceName) !== null;
    }
    signal.throwIfAborted();
    await options.start(signal);
    let started = false;
    for await (const line of stream) {
      signal.throwIfAborted();
      const resource = findExecutableStatus(line, apphostPath, resourceName);
      if (!resource?.state) continue;
      if (!TERMINAL_RESOURCE_STATES.has(resource.state)) {
        started = true;
        continue;
      }
      if (!started) continue;
      if (
        typeof resource.exitCode === 'number' && Number.isInteger(resource.exitCode) &&
        resource.exitCode >= 0
      ) {
        return resource.exitCode;
      }
      throw new Error(
        `Aspire resource ${resourceName} reached ${resource.state} without an exit code.`,
      );
    }
    throw new Error(`Aspire stream ended before ${resourceName} completed.`);
  } catch (error) {
    signal.throwIfAborted();
    throw error;
  } finally {
    clearTimeout(timer);
    await stream.return();
  }
}

const DB_CLI_ASPIRE_START_TIMEOUT_SECONDS = 300;
const ASPIRE_CLI_START_TIMEOUT_ENV = 'ASPIRE_CLI_START_TIMEOUT';
const NO_RUNNING_APPHOST_LINE =
  /^[ \t]*(?:error:[ \t]*)?No AppHost is currently running(?:[ \t]|[.'"]|$)/m;

/** Whether Aspire output is the documented no-running-AppHost diagnostic. */
export function isNoRunningAppHostOutput(stdout: string, stderr: string): boolean {
  return NO_RUNNING_APPHOST_LINE.test(`${stdout}\n${stderr}`);
}

/** Whether `aspire ps --format Json` contains the project's exact AppHost path. */
export function findRunningAppHost(statusJson: string, apphostPath: string): boolean {
  const parsed: unknown = JSON.parse(statusJson);
  if (!Array.isArray(parsed)) {
    throw new Error('Expected aspire ps JSON to return an array.');
  }
  return parsed.some((entry) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const candidate = Reflect.get(entry, 'appHostPath');
    return typeof candidate === 'string' && normalisePath(candidate) === normalisePath(apphostPath);
  });
}

export function buildDbCliEnv(
  operation: DbOperationRequest['operation'],
  configKey: string,
  migrationName?: string,
  interactive?: boolean,
): Record<string, string> {
  return {
    ASPIRE_CLI_START_TIMEOUT: String(resolveDbCliTimeoutSeconds()),
    ...buildDbTaskEnv(operation, configKey, migrationName, interactive),
  };
}

/** Operation inputs the generated database workspace scripts read from the environment. */
export function buildDbTaskEnv(
  operation: DbOperationRequest['operation'],
  configKey: string,
  migrationName?: string,
  interactive?: boolean,
): Record<string, string> {
  const env: Record<string, string> = {
    NETSCRIPT_PRISMA_OPERATION: operation,
    NETSCRIPT_PRISMA_TARGET: configKey,
  };
  if (migrationName) {
    env.PRISMA_MIGRATION_NAME = migrationName;
  }
  if (interactive !== undefined) {
    env.NETSCRIPT_MIGRATION_INTERACTIVE = String(interactive);
  }
  return env;
}

/** Resolve the bounded database readiness budget from the established CLI timeout input. */
export function resolveDbCliTimeoutSeconds(): number {
  const configured = Deno.env.get(ASPIRE_CLI_START_TIMEOUT_ENV);
  if (!configured) return DB_CLI_ASPIRE_START_TIMEOUT_SECONDS;
  const timeoutSeconds = Number(configured);
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1) {
    throw new Error(`${ASPIRE_CLI_START_TIMEOUT_ENV} must be a positive whole number.`);
  }
  return timeoutSeconds;
}

export function buildAspireArgs(
  command: 'run' | 'start',
  apphostPath: string,
  options: { readonly isolated?: boolean } = {},
): string[] {
  const args = [command, '--apphost', apphostPath];
  if (command === 'start') {
    args.push('--format', 'Json', '--non-interactive');
    if (options.isolated) {
      args.push('--isolated');
    }
  }
  args.push('--nologo');
  return args;
}

export function buildExecutableDisplayName(
  _operation: DbOperationRequest['operation'],
  configKey: string,
): string {
  return `${configKey}-cli`;
}

export function findExecutableStatus(
  statusJson: string,
  apphostPath: string,
  displayName: string,
): AspireResourceStatus | null {
  return parseAspireResourceStatuses(statusJson, apphostPath).find((resource) =>
    (resource.displayName === displayName || resource.name === displayName) &&
    (resource.resourceType === 'Executable' || resource.type === 'Executable')
  ) ?? null;
}

function parseAspireResourceStatuses(
  statusJson: string,
  apphostPath: string,
): AspireResourceStatus[] {
  if (statusJson.trim().length === 0) {
    return [];
  }

  const parsed = JSON.parse(statusJson) as unknown;
  if (!Array.isArray(parsed)) {
    if (isResourceStatus(parsed)) return [parsed];
    if (isObjectWithResources(parsed)) {
      return [...parsed.resources];
    }
    throw new Error('Expected Aspire resource JSON to return an array or object with resources.');
  }

  if (parsed.every(isResourceStatus)) {
    return parsed;
  }

  const apphost = (parsed as AspireAppHostStatus[]).find((entry) =>
    typeof entry.appHostPath === 'string' &&
    normalisePath(entry.appHostPath) === normalisePath(apphostPath)
  );
  return apphost?.resources ? [...apphost.resources] : [];
}

function isObjectWithResources(
  value: unknown,
): value is { resources: readonly AspireResourceStatus[] } {
  return typeof value === 'object' && value !== null && Array.isArray(
    (value as { resources?: unknown }).resources,
  );
}

function isResourceStatus(value: unknown): value is AspireResourceStatus {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.displayName === 'string' || typeof record.name === 'string';
}

function normalisePath(path: string): string {
  return path.replaceAll('/', '\\').toLowerCase();
}
