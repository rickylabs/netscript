/**
 * @module infra/scaffold/dry-run-fs
 *
 * Dry-run filesystem adapter that records write operations without performing
 * them. Read operations delegate to a wrapped {@link FileSystemPort} so
 * templates and existing files can still be read during a preview run.
 *
 * Collected operations are exposed via {@link DryRunFileSystemAdapter.operations}
 * and {@link DryRunFileSystemAdapter.getOperations} for rendering dry-run
 * output to the user. Reads first consult recorded writes so later scaffold
 * phases can patch files created earlier in the same dry-run.
 */

import type { DirEntry, DryRunOperation, FileInfo, WalkEntry } from '../../domain/core-types.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';

/**
 * Filesystem adapter that records mutating operations without executing them.
 *
 * All read operations (`readFile`, `exists`, `stat`, `readDir`, `walk`)
 * delegate to the inner adapter so that template resolution and existence
 * checks work correctly during a dry-run scaffold.
 *
 * All write operations (`writeFile`, `createDir`, `remove`, `copy`) are
 * captured as {@link DryRunOperation} entries and can be inspected after the
 * scaffold completes.
 *
 * @example
 * ```typescript
 * const real = new DenoFileSystem();
 * const dryRun = new DryRunFileSystemAdapter(real);
 *
 * await scaffolder.scaffold(options); // uses dryRun as its FS
 *
 * for (const op of dryRun.getOperations()) {
 *   outputText(`${op.type}: ${op.path}`);
 * }
 * ```
 */
export class DryRunFileSystemAdapter implements FileSystemPort {
  /** Ordered list of mutating operations that would have been performed. */
  readonly operations: DryRunOperation[] = [];

  /** The real filesystem adapter used for read delegation. */
  readonly #inner: FileSystemPort;

  /**
   * Create a new dry-run adapter wrapping an inner filesystem.
   *
   * @param inner - The real filesystem adapter to delegate reads to.
   */
  constructor(inner: FileSystemPort) {
    this.#inner = inner;
  }

  /**
   * Read a file as UTF-8 text.
   *
   * Returns recorded write content when a previous dry-run phase created or
   * patched the file, then delegates to the inner adapter for source templates.
   *
   * @param path - Absolute path to the file.
   * @returns The file content as a string.
   * @throws If the file does not exist in the inner adapter.
   */
  async readFile(path: string): Promise<string> {
    for (let i = this.operations.length - 1; i >= 0; i--) {
      const op = this.operations[i];
      if (op.path !== path) continue;
      if (op.type === 'write' && op.content !== undefined) return op.content;
      if (op.type === 'remove') break;
    }
    return await this.#inner.readFile(path);
  }

  /**
   * Record a file write without performing it.
   *
   * Pushes a `write` operation to {@link operations}.
   *
   * @param path - Absolute path where the file would be written.
   * @param content - The content that would be written.
   */
  async writeFile(path: string, content: string): Promise<void> {
    this.operations.push({ type: 'write', path, content });
    await Promise.resolve();
  }

  /**
   * Check if a path exists.
   *
   * First checks whether any recorded `write` or `mkdir` operation targets
   * the given path (so that files "created" during dry-run are visible to
   * later scaffold phases). Falls back to the inner adapter.
   *
   * @param path - Absolute path to check.
   * @returns `true` if the path exists or was recorded during dry-run.
   */
  async exists(path: string): Promise<boolean> {
    if (this.#hasRecordedPath(path)) {
      return true;
    }
    return await this.#inner.exists(path);
  }

  /**
   * Get file or directory metadata.
   *
   * If the path was recorded as a `write` operation during dry-run, returns
   * file metadata. If recorded as `mkdir`, returns directory metadata.
   * Otherwise delegates to the inner adapter.
   *
   * @param path - Absolute path to stat.
   * @returns File metadata with `isFile` and `isDirectory` flags.
   * @throws If the path does not exist in either recorded ops or inner adapter.
   */
  async stat(path: string): Promise<FileInfo> {
    for (const op of this.operations) {
      if (op.path === path) {
        if (op.type === 'write') {
          return { isFile: true, isDirectory: false };
        }
        if (op.type === 'mkdir') {
          return { isFile: false, isDirectory: true };
        }
      }
    }
    return await this.#inner.stat(path);
  }

  /**
   * Record a directory creation without performing it.
   *
   * Pushes a `mkdir` operation to {@link operations}.
   *
   * @param path - Absolute path of the directory that would be created.
   */
  async createDir(path: string): Promise<void> {
    this.operations.push({ type: 'mkdir', path });
    await Promise.resolve();
  }

  /**
   * List directory entries.
   *
   * Delegates to the inner adapter. Dry-run recorded entries are not
   * synthesised because `readDir` is primarily used for template walking
   * which reads from the source (not output) tree.
   *
   * @param path - Absolute path to the directory.
   * @returns Array of directory entries.
   * @throws If the path is not a directory in the inner adapter.
   */
  async readDir(path: string): Promise<DirEntry[]> {
    return await this.#inner.readDir(path);
  }

  /**
   * Record a file or directory removal without performing it.
   *
   * Pushes a `remove` operation to {@link operations}.
   *
   * @param path - Absolute path that would be removed.
   */
  async remove(path: string): Promise<void> {
    this.operations.push({ type: 'remove', path });
    await Promise.resolve();
  }

  /**
   * Record a file copy without performing it.
   *
   * Pushes a `copy` operation to {@link operations}. The source path is
   * stored in `content` so callers can trace the origin.
   *
   * @param src - Absolute path of the source file.
   * @param dest - Absolute path of the destination file.
   */
  async copy(src: string, dest: string): Promise<void> {
    this.operations.push({ type: 'copy', path: dest, content: src });
    await Promise.resolve();
  }

  /**
   * Walk a directory tree recursively.
   *
   * Delegates to the inner adapter. Dry-run recorded entries are not
   * synthesised because `walk` is used for template source traversal.
   *
   * @param dir - Absolute path of the directory to walk.
   * @yields Walk entries in depth-first order.
   */
  async *walk(dir: string): AsyncIterable<WalkEntry> {
    yield* this.#inner.walk(dir);
  }

  /**
   * Get a read-only snapshot of all recorded operations.
   *
   * @returns Frozen array of dry-run operations in recording order.
   */
  getOperations(): readonly DryRunOperation[] {
    return [...this.operations];
  }

  /**
   * Check whether any recorded operation makes the given path appear to exist.
   *
   * A path is considered to exist if the most recent relevant operation on it
   * was a `write`, `mkdir`, or `copy` (destination). A subsequent `remove`
   * operation cancels earlier writes/mkdirs — the path is treated as absent.
   *
   * @param path - Absolute path to check.
   * @returns `true` if the path would exist after replaying recorded operations.
   */
  #hasRecordedPath(path: string): boolean {
    // Walk operations in reverse order; the most recent op on this path wins.
    for (let i = this.operations.length - 1; i >= 0; i--) {
      const op = this.operations[i];
      if (op.path !== path) continue;
      // copy records the destination in `path` — treat it as an existing file.
      if (op.type === 'write' || op.type === 'mkdir' || op.type === 'copy') {
        return true;
      }
      // remove means the path was explicitly deleted — treat as absent.
      if (op.type === 'remove') {
        return false;
      }
    }
    return false;
  }
}
