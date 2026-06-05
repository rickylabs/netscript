import type { DbOperationRequest } from '../../domain/db-engine.ts';

interface AspireResourceStatus {
  readonly displayName?: string;
  readonly exitCode?: number | null;
  readonly resourceType?: string;
  readonly state?: string | null;
}

interface AspireAppHostStatus {
  readonly appHostPath?: string;
  readonly resources?: readonly AspireResourceStatus[];
}

export const TERMINAL_RESOURCE_STATES = new Set([
  'Exited',
  'Failed',
  'Finished',
  'Stopped',
]);

export function buildDbCliEnv(
  operation: DbOperationRequest['operation'],
  configKey: string,
  migrationName?: string,
): Record<string, string> {
  const env: Record<string, string> = {
    NETSCRIPT_PRISMA_OPERATION: operation,
    NETSCRIPT_PRISMA_TARGET: configKey,
  };
  if (migrationName) {
    env.NETSCRIPT_PRISMA_NAME = migrationName;
  }
  return env;
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
  psJson: string,
  apphostPath: string,
  displayName: string,
): AspireResourceStatus | null {
  const apphosts = parseAspirePsJson(psJson);
  const apphost = apphosts.find((entry) =>
    typeof entry.appHostPath === 'string' &&
    normalisePath(entry.appHostPath) === normalisePath(apphostPath)
  );
  if (!apphost?.resources) {
    return null;
  }
  return apphost.resources.find((resource) =>
    resource.displayName === displayName && resource.resourceType === 'Executable'
  ) ?? null;
}

function parseAspirePsJson(psJson: string): AspireAppHostStatus[] {
  const parsed = JSON.parse(psJson) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Expected `aspire ps --resources --format Json` to return an array.');
  }
  return parsed as AspireAppHostStatus[];
}

function normalisePath(path: string): string {
  return path.replaceAll('/', '\\').toLowerCase();
}
