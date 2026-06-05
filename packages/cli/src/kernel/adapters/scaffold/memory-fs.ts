/**
 * @module infra/scaffold/memory-fs
 *
 * In-memory filesystem adapter for testing the scaffold system.
 *
 * Uses a `Map<string, string>` for file content and a `Set<string>` for
 * directories. All operations are synchronous in nature but wrapped in
 * promises to satisfy {@link FileSystemPort}. Zero disk I/O.
 */

import {
  basename as posixBasename,
  dirname as posixDirname,
  normalize as posixNormalize,
} from '@std/path/posix';
import type { DirEntry, FileInfo, WalkEntry } from '../../domain/core-types.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';

/**
 * Normalise a raw path to the internal POSIX representation used by the
 * in-memory store: forward slashes, no trailing slash, collapsed duplicates.
 *
 * Uses `@std/path/posix.normalize()` for correct POSIX semantics on every
 * host OS, then strips any trailing slash left by the normaliser.
 *
 * @param path - Raw path string (may use OS separators).
 * @returns POSIX-normalised path with no trailing slash.
 */
function normalizePath(path: string): string {
  // Convert backslashes first so the POSIX normaliser sees a valid path.
  const posix = posixNormalize(path.replace(/\\/g, '/'));
  // posixNormalize may return '/' for root — leave that intact.
  return posix.length > 1 ? posix.replace(/\/$/, '') : posix;
}

/**
 * Return the parent directory of a normalised path.
 *
 * Delegates to `@std/path/posix.dirname()`.  Returns an empty string when
 * the path has no parent (i.e. dirname would return `'.'` or `'/'`).
 *
 * @param path - POSIX-normalised path.
 */
function parentDir(path: string): string {
  const dir = posixDirname(path);
  // '.' means same directory (no parent segment); '/' is the FS root.
  return dir === '.' || dir === path ? '' : dir;
}

/**
 * Return the final path segment of a normalised path.
 *
 * Delegates to `@std/path/posix.basename()`.
 *
 * @param path - POSIX-normalised path.
 */
function baseName(path: string): string {
  return posixBasename(path);
}

/**
 * In-memory filesystem adapter for tests.
 *
 * Implements {@link FileSystemPort} without touching the real filesystem.
 * Ideal for unit tests that need deterministic, instant scaffold operations
 * with no cleanup overhead.
 *
 * @example
 * ```typescript
 * const fs = new MemoryFileSystemAdapter();
 * await fs.writeFile('/project/src/main.ts', 'outputText("hello");');
 * const content = await fs.readFile('/project/src/main.ts');
 * outputText(content); // 'outputText("hello");'
 *
 * // Inspect all stored files for assertions
 * const files = fs.getFiles();
 * assertEquals(files.size, 1);
 * ```
 */
export class MemoryFileSystemAdapter implements FileSystemPort {
  /** Internal store mapping normalized paths to file content. */
  readonly #files: Map<string, string> = new Map();

  /** Internal store of directory paths. */
  readonly #dirs: Set<string> = new Set();

  /**
   * Read a file as UTF-8 text from the in-memory store.
   *
   * @param path - Path to the file
   * @returns File content
   * @throws {Error} If the file does not exist (`ENOENT`)
   */
  readFile(path: string): Promise<string> {
    const normalized = normalizePath(path);
    const content = this.#files.get(normalized);
    if (content === undefined) {
      return Promise.reject(new Error(`ENOENT: no such file: ${normalized}`));
    }
    return Promise.resolve(content);
  }

  /**
   * Write UTF-8 text to a file in the in-memory store.
   *
   * Automatically creates all parent directories.
   *
   * @param path - Path to the file
   * @param content - Text content to write
   */
  async writeFile(path: string, content: string): Promise<void> {
    const normalized = normalizePath(path);
    const parent = parentDir(normalized);
    if (parent) {
      await this.createDir(parent);
    }
    this.#files.set(normalized, content);
  }

  /**
   * Check if a path exists in the in-memory store (file or directory).
   *
   * @param path - Path to check
   * @returns `true` if the path exists as a file or directory
   */
  exists(path: string): Promise<boolean> {
    const normalized = normalizePath(path);
    return Promise.resolve(this.#files.has(normalized) || this.#dirs.has(normalized));
  }

  /**
   * Get file/directory metadata from the in-memory store.
   *
   * @param path - Path to stat
   * @returns Metadata with `isFile` and `isDirectory` flags
   * @throws {Error} If the path does not exist (`ENOENT`)
   */
  stat(path: string): Promise<FileInfo> {
    const normalized = normalizePath(path);
    if (this.#files.has(normalized)) {
      return Promise.resolve({ isFile: true, isDirectory: false });
    }
    if (this.#dirs.has(normalized)) {
      return Promise.resolve({ isFile: false, isDirectory: true });
    }
    return Promise.reject(new Error(`ENOENT: no such file or directory: ${normalized}`));
  }

  /**
   * Create a directory and all parent directories in the in-memory store.
   *
   * Idempotent — calling multiple times with the same path is a no-op.
   *
   * @param path - Directory path to create
   */
  createDir(path: string): Promise<void> {
    const normalized = normalizePath(path);
    if (!normalized) return Promise.resolve();

    // Walk up the tree and register every ancestor directory.
    const parts = normalized.split('/').filter(Boolean);
    const prefix = normalized.startsWith('/') ? '/' : '';
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : `${prefix}${part}`;
      this.#dirs.add(current);
    }
    return Promise.resolve();
  }

  /**
   * List directory entries (non-recursive) from the in-memory store.
   *
   * Returns only immediate children of the given directory.
   *
   * @param path - Directory path to list
   * @returns Array of directory entries
   * @throws {Error} If the path is not a directory (`ENOTDIR`)
   */
  readDir(path: string): Promise<DirEntry[]> {
    const normalized = normalizePath(path);
    if (!this.#dirs.has(normalized)) {
      return Promise.reject(new Error(`ENOTDIR: not a directory: ${normalized}`));
    }

    const prefix = normalized + '/';
    const seen = new Set<string>();
    const entries: DirEntry[] = [];

    // Scan files for immediate children.
    for (const filePath of this.#files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const rest = filePath.slice(prefix.length);
      // Immediate child has no further slashes.
      if (!rest.includes('/')) {
        const name = rest;
        if (!seen.has(name)) {
          seen.add(name);
          entries.push({ name, isFile: true, isDirectory: false });
        }
      }
    }

    // Scan directories for immediate children.
    for (const dirPath of this.#dirs) {
      if (!dirPath.startsWith(prefix)) continue;
      const rest = dirPath.slice(prefix.length);
      if (!rest.includes('/') && rest.length > 0) {
        const name = rest;
        if (!seen.has(name)) {
          seen.add(name);
          entries.push({ name, isFile: false, isDirectory: true });
        }
      }
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    return Promise.resolve(entries);
  }

  /**
   * Remove a file or directory (recursive for directories) from the store.
   *
   * @param path - Path to remove
   */
  remove(path: string): Promise<void> {
    const normalized = normalizePath(path);

    // If it's a file, just remove it.
    if (this.#files.has(normalized)) {
      this.#files.delete(normalized);
      return Promise.resolve();
    }

    // If it's a directory, remove it and all children.
    if (this.#dirs.has(normalized)) {
      const prefix = normalized + '/';

      // Remove child files.
      for (const filePath of [...this.#files.keys()]) {
        if (filePath.startsWith(prefix)) {
          this.#files.delete(filePath);
        }
      }

      // Remove child directories.
      for (const dirPath of [...this.#dirs]) {
        if (dirPath === normalized || dirPath.startsWith(prefix)) {
          this.#dirs.delete(dirPath);
        }
      }
    }
    return Promise.resolve();
  }

  /**
   * Copy a file from src to dest in the in-memory store.
   *
   * Creates parent directories for the destination as needed.
   *
   * @param src - Source file path
   * @param dest - Destination file path
   * @throws {Error} If the source file does not exist (`ENOENT`)
   */
  async copy(src: string, dest: string): Promise<void> {
    const content = await this.readFile(src);
    await this.writeFile(dest, content);
  }

  /**
   * Walk a directory tree recursively in the in-memory store.
   *
   * Yields entries in sorted order for deterministic test output.
   *
   * @param dir - Root directory to walk
   * @yields {WalkEntry} Entries for every file and directory under `dir`
   */
  async *walk(dir: string): AsyncIterable<WalkEntry> {
    const normalized = normalizePath(dir);
    const prefix = normalized + '/';
    const collected: WalkEntry[] = [];

    // Collect matching directories.
    for (const dirPath of this.#dirs) {
      if (dirPath === normalized || dirPath.startsWith(prefix)) {
        collected.push({
          path: dirPath,
          name: baseName(dirPath),
          isFile: false,
          isDirectory: true,
        });
      }
    }

    // Collect matching files.
    for (const filePath of this.#files.keys()) {
      if (filePath.startsWith(prefix)) {
        collected.push({
          path: filePath,
          name: baseName(filePath),
          isFile: true,
          isDirectory: false,
        });
      }
    }

    collected.sort((a, b) => a.path.localeCompare(b.path));

    for (const entry of collected) {
      yield entry;
    }
  }

  /**
   * Get a read-only view of all stored files for test assertions.
   *
   * @returns Immutable map of normalized file paths to their content
   */
  getFiles(): ReadonlyMap<string, string> {
    return this.#files;
  }

  /**
   * Reset all in-memory state, clearing files and directories.
   *
   * Useful for resetting between test cases without creating a new instance.
   */
  clear(): void {
    this.#files.clear();
    this.#dirs.clear();
  }
}
