/**
 * Shared filesystem utilities for the watcher package.
 *
 * Centralizes `Deno.stat`/`Deno.lstat`/`Deno.readFile` calls with typed
 * `Deno.errors` handling so strategies and filters don't duplicate logic.
 *
 * @module
 */

import type { FileInfo } from './types.ts';

/**
 * Stat a file, returning `null` when the file is missing or inaccessible.
 *
 * Only swallows `Deno.errors.NotFound` and `Deno.errors.PermissionDenied`;
 * any other error (I/O failure, filesystem loop, etc.) is re-thrown.
 *
 * @param path - Absolute path to stat.
 * @returns File metadata, or `null` if the file was removed or access is denied.
 */
export async function safeStat(path: string): Promise<FileInfo | null> {
  try {
    const stat = await Deno.stat(path);
    return {
      size: stat.size,
      modifiedAt: stat.mtime,
      createdAt: stat.birthtime,
      isFile: stat.isFile,
      isSymlink: stat.isSymlink,
    };
  } catch (error: unknown) {
    if (
      error instanceof Deno.errors.NotFound ||
      error instanceof Deno.errors.PermissionDenied
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Read a file's content, returning `null` when the file is missing or inaccessible.
 *
 * @param path - Absolute path to read.
 * @returns File content as `Uint8Array`, or `null`.
 */
export async function safeReadFile(path: string): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return await Deno.readFile(path);
  } catch (error: unknown) {
    if (
      error instanceof Deno.errors.NotFound ||
      error instanceof Deno.errors.PermissionDenied
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Tracks consecutive access failures per path and surfaces persistent errors.
 *
 * Use this in long-running loops (polling) to distinguish transient hiccups
 * (network blip, file locked) from permanent access problems (wrong permissions,
 * deleted directory). After `maxConsecutiveFailures` consecutive failures the
 * tracker calls the `onPersistentFailure` callback so the caller can log, throw,
 * or abort.
 */
export class AccessFailureTracker {
  private readonly failures = new Map<string, number>();
  private readonly maxFailures: number;
  private readonly onPersistentFailure: (path: string, count: number) => void;

  /**
   * Create an access failure tracker.
   *
   * @param options - Failure threshold and persistent-failure callback.
   */
  constructor(options: {
    /** Consecutive failures before reporting. @default 3 */
    maxConsecutiveFailures?: number;
    /** Called when a path exceeds the failure threshold. */
    onPersistentFailure: (path: string, count: number) => void;
  }) {
    this.maxFailures = options.maxConsecutiveFailures ?? 3;
    this.onPersistentFailure = options.onPersistentFailure;
  }

  /** Record a successful access — resets the counter for the path. */
  recordSuccess(path: string): void {
    this.failures.delete(path);
  }

  /**
   * Record a failed access. Returns `true` when the threshold is exceeded
   * (and invokes the callback on the exact crossing).
   */
  recordFailure(path: string): boolean {
    const count = (this.failures.get(path) ?? 0) + 1;
    this.failures.set(path, count);

    if (count === this.maxFailures) {
      this.onPersistentFailure(path, count);
      return true;
    }
    return count >= this.maxFailures;
  }

  /** Clear all tracked state. */
  clear(): void {
    this.failures.clear();
  }
}
