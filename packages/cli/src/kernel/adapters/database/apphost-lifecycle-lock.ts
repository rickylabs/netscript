/** Inter-process ownership lock for detached database AppHost lifecycles. */

import { dirname, join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';

interface LockRecord {
  readonly pid: number;
  readonly acquiredAt: string;
  readonly token: string;
}

export interface AppHostLifecycleLease {
  /** Release this holder's lifecycle lease. */
  release(): Promise<void>;
}

export interface AppHostLifecycleLockOptions {
  readonly timeoutMs: number;
  readonly pollIntervalMs: number;
  readonly sleep: (ms: number) => Promise<void>;
}

/** Serializes detached database operations that target one AppHost path. */
export interface AppHostLifecycleLock {
  /** Wait for and atomically acquire the AppHost lifecycle lease. */
  acquire(
    apphostPath: string,
    options: AppHostLifecycleLockOptions,
  ): Promise<AppHostLifecycleLease>;
}

interface FileAppHostLifecycleLockOptions {
  readonly pid?: number;
  readonly now?: () => Date;
  readonly isProcessAlive?: (pid: number) => boolean;
}

/** File-backed inter-process lock stored under generated Aspire state. */
export class FileAppHostLifecycleLock implements AppHostLifecycleLock {
  private readonly pid: number;
  private readonly now: () => Date;
  private readonly isProcessAlive: (pid: number) => boolean;

  constructor(options: FileAppHostLifecycleLockOptions = {}) {
    this.pid = options.pid ?? Deno.pid;
    this.now = options.now ?? (() => new Date());
    this.isProcessAlive = options.isProcessAlive ?? processIsAlive;
  }

  async acquire(
    apphostPath: string,
    options: AppHostLifecycleLockOptions,
  ): Promise<AppHostLifecycleLease> {
    const lockPath = await resolveAppHostLifecycleLockPath(apphostPath);
    await Deno.mkdir(dirname(lockPath), { recursive: true });

    while (true) {
      const token = crypto.randomUUID();
      const record: LockRecord = {
        pid: this.pid,
        acquiredAt: this.now().toISOString(),
        token,
      };
      if (await createLockFile(lockPath, record)) {
        return {
          release: async () => await releaseLockFile(lockPath, token),
        };
      }

      if (await this.isStale(lockPath, options.timeoutMs)) {
        await removeIfPresent(lockPath);
        continue;
      }
      await options.sleep(options.pollIntervalMs);
    }
  }

  private async isStale(lockPath: string, timeoutMs: number): Promise<boolean> {
    const record = await readLockRecord(lockPath);
    if (record) {
      const ageMs = this.now().getTime() - Date.parse(record.acquiredAt);
      return !this.isProcessAlive(record.pid) || !Number.isFinite(ageMs) || ageMs > timeoutMs;
    }

    try {
      const stat = await Deno.stat(lockPath);
      const modifiedAt = stat.mtime?.getTime();
      return modifiedAt !== undefined && this.now().getTime() - modifiedAt > timeoutMs;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return true;
      throw error;
    }
  }
}

/** Resolve the ignored, AppHost-keyed lifecycle lock path. */
export async function resolveAppHostLifecycleLockPath(apphostPath: string): Promise<string> {
  const normalized = apphostPath.replaceAll('\\', '/').toLowerCase();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const key = Array.from(
    new Uint8Array(digest),
    (value) => value.toString(16).padStart(2, '0'),
  ).join('');
  return join(
    dirname(apphostPath),
    SCAFFOLD_DIRS.ASPIRE_GENERATED,
    `netscript-db-${key}.lock`,
  );
}

async function createLockFile(lockPath: string, record: LockRecord): Promise<boolean> {
  try {
    const file = await Deno.open(lockPath, {
      createNew: true,
      write: true,
      mode: 0o600,
    });
    let writeError: unknown;
    try {
      await writeAll(file, new TextEncoder().encode(`${JSON.stringify(record)}\n`));
    } catch (error) {
      writeError = error;
    } finally {
      file.close();
    }
    if (writeError !== undefined) {
      await removeIfPresent(lockPath);
      throw writeError;
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) return false;
    throw error;
  }
}

async function releaseLockFile(lockPath: string, token: string): Promise<void> {
  const record = await readLockRecord(lockPath);
  if (!record) return;
  if (record.token !== token) {
    throw new Error(`AppHost lifecycle lock holder changed before release: ${lockPath}`);
  }
  await removeIfPresent(lockPath);
}

async function readLockRecord(lockPath: string): Promise<LockRecord | null> {
  try {
    const value: unknown = JSON.parse(await Deno.readTextFile(lockPath));
    if (!isRecord(value)) return null;
    if (
      typeof value.pid !== 'number' || !Number.isSafeInteger(value.pid) || value.pid <= 0 ||
      typeof value.acquiredAt !== 'string' || !Number.isFinite(Date.parse(value.acquiredAt)) ||
      typeof value.token !== 'string' || value.token.length === 0
    ) return null;
    return { pid: value.pid, acquiredAt: value.acquiredAt, token: value.token };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function removeIfPresent(path: string): Promise<void> {
  try {
    await Deno.remove(path);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

async function writeAll(file: Deno.FsFile, bytes: Uint8Array): Promise<void> {
  let offset = 0;
  while (offset < bytes.length) {
    offset += await file.write(bytes.subarray(offset));
  }
}

function processIsAlive(pid: number): boolean {
  try {
    Deno.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    if (error instanceof Deno.errors.PermissionDenied) return true;
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
