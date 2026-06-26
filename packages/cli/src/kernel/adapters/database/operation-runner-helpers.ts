import type { DbOperationRequest } from '../../domain/db-engine.ts';

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

const DB_CLI_ASPIRE_START_TIMEOUT_SECONDS = '300';
const ASPIRE_CLI_START_TIMEOUT_ENV = 'ASPIRE_CLI_START_TIMEOUT';

export function buildDbCliEnv(
  operation: DbOperationRequest['operation'],
  configKey: string,
  migrationName?: string,
): Record<string, string> {
  const env: Record<string, string> = {
    ASPIRE_CLI_START_TIMEOUT: resolveAspireCliStartTimeout(),
    NETSCRIPT_PRISMA_OPERATION: operation,
    NETSCRIPT_PRISMA_TARGET: configKey,
  };
  if (migrationName) {
    env.NETSCRIPT_PRISMA_NAME = migrationName;
  }
  return env;
}

function resolveAspireCliStartTimeout(): string {
  const configured = Deno.env.get(ASPIRE_CLI_START_TIMEOUT_ENV);
  return configured && configured.length > 0 ? configured : DB_CLI_ASPIRE_START_TIMEOUT_SECONDS;
}

export function buildAspireArgs(
  command: 'run' | 'start',
  apphostPath: string,
): string[] {
  const args = [command, '--apphost', apphostPath];
  if (command === 'start') {
    args.push('--format', 'Json', '--non-interactive');
  }
  args.push('--nologo');
  return args;
}

export function buildExecutableDisplayName(
  operation: DbOperationRequest['operation'],
  configKey: string,
): string {
  return `prisma-${operation}-${configKey}`;
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
