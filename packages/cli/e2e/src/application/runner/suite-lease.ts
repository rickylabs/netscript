import { join } from '@std/path';
import { DEPLOY, SCAFFOLD, type SuiteId } from '../../domain/cli-surface.ts';

export const SUITE_LEASE_FILENAME = 'netscript-e2e-scaffold-runtime.lease';
export const SUITE_LEASE_STALE_CHECK = 'holder-process-dead' as const;

/** Metadata persisted while an expensive suite owns the local lease. */
export interface SuiteLeaseRecord {
  readonly pid: number;
  readonly startedAt: string;
  readonly suiteId: SuiteId;
  readonly worktree: string;
}

/** An acquired suite lease that must be released after execution. */
export interface SuiteLease {
  release(): Promise<void>;
}

/** Acquires exclusive local ownership for an expensive suite. */
export interface SuiteLeaseManager {
  acquire(suiteId: SuiteId, worktree: string): Promise<SuiteLease>;
}

export interface SuiteLeaseFileSystem {
  createExclusive(path: string, content: string): Promise<boolean>;
  readText(path: string): Promise<string>;
  remove(path: string): Promise<void>;
}

export interface SuiteLeaseDependencies {
  readonly fileSystem: SuiteLeaseFileSystem;
  readonly isProcessAlive: (pid: number) => boolean;
  readonly leasePath: string;
  readonly now: () => Date;
  readonly pid: number;
  readonly notice: (message: string) => void;
}

/** Error raised when another live process owns the expensive-suite lease. */
export class SuiteLeaseContentionError extends Error {
  constructor(readonly holder: SuiteLeaseRecord, readonly leasePath: string) {
    super(
      `E2E suite contention: refused to start because pid ${holder.pid} holds ${leasePath} ` +
        `for ${holder.suiteId} from worktree ${holder.worktree} since ${holder.startedAt}. ` +
        'This is a contention verdict, not a product failure.',
    );
    this.name = 'SuiteLeaseContentionError';
  }
}

function parseLeaseRecord(content: string, leasePath: string): SuiteLeaseRecord {
  const value: unknown = JSON.parse(content);
  if (
    typeof value !== 'object' || value === null ||
    !('pid' in value) || typeof value.pid !== 'number' ||
    !('startedAt' in value) || typeof value.startedAt !== 'string' ||
    !('suiteId' in value) || typeof value.suiteId !== 'string' || !isSuiteId(value.suiteId) ||
    !('worktree' in value) || typeof value.worktree !== 'string'
  ) {
    throw new Error(`E2E suite lease at ${leasePath} is invalid; refusing to overwrite it.`);
  }
  return {
    pid: value.pid,
    startedAt: value.startedAt,
    suiteId: value.suiteId,
    worktree: value.worktree,
  };
}

function isSuiteId(value: string): value is SuiteId {
  return [...Object.values(SCAFFOLD), ...Object.values(DEPLOY)].some((suiteId) =>
    suiteId === value
  );
}

/** Creates a lease manager whose staleness verdict depends only on holder PID liveness. */
export function createSuiteLeaseManager(dependencies: SuiteLeaseDependencies): SuiteLeaseManager {
  return {
    async acquire(suiteId, worktree) {
      const record: SuiteLeaseRecord = {
        pid: dependencies.pid,
        startedAt: dependencies.now().toISOString(),
        suiteId,
        worktree,
      };
      const content = `${JSON.stringify(record)}\n`;

      while (!(await dependencies.fileSystem.createExclusive(dependencies.leasePath, content))) {
        const holder = parseLeaseRecord(
          await dependencies.fileSystem.readText(dependencies.leasePath),
          dependencies.leasePath,
        );
        if (dependencies.isProcessAlive(holder.pid)) {
          throw new SuiteLeaseContentionError(holder, dependencies.leasePath);
        }
        dependencies.notice(
          `Stale E2E suite lease detected at ${dependencies.leasePath}: ` +
            `holder pid ${holder.pid} is dead (${SUITE_LEASE_STALE_CHECK}); removing it.`,
        );
        await dependencies.fileSystem.remove(dependencies.leasePath);
      }

      let released = false;
      return {
        async release() {
          if (released) return;
          released = true;
          await dependencies.fileSystem.remove(dependencies.leasePath);
        },
      };
    },
  };
}

class DenoSuiteLeaseFileSystem implements SuiteLeaseFileSystem {
  async createExclusive(path: string, content: string): Promise<boolean> {
    try {
      const file = await Deno.open(path, { createNew: true, write: true });
      try {
        await file.write(new TextEncoder().encode(content));
      } finally {
        file.close();
      }
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.AlreadyExists) return false;
      throw error;
    }
  }

  readText(path: string): Promise<string> {
    return Deno.readTextFile(path);
  }

  async remove(path: string): Promise<void> {
    try {
      await Deno.remove(path);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    Deno.kill(pid, 0);
    return true;
  } catch (error) {
    return !(error instanceof Deno.errors.NotFound);
  }
}

function osTempDirectory(): string {
  return Deno.env.get('TMPDIR') ?? Deno.env.get('TEMP') ?? Deno.env.get('TMP') ??
    (Deno.build.os === 'windows' ? 'C:\\Windows\\Temp' : '/tmp');
}

/** Creates the process-backed suite lease used by the CLI runner. */
export function createDefaultSuiteLeaseManager(): SuiteLeaseManager {
  return createSuiteLeaseManager({
    fileSystem: new DenoSuiteLeaseFileSystem(),
    isProcessAlive,
    leasePath: join(osTempDirectory(), SUITE_LEASE_FILENAME),
    now: () => new Date(),
    pid: Deno.pid,
    notice: (message) => console.error(message),
  });
}
