/**
 * Generic local project-file adapter shared by NetScript plugin CLIs.
 *
 * Plugin CLI backends (workers, sagas, triggers, and future plugins) discover,
 * read, and write project-relative source files through the {@linkcode ProjectFiles}
 * boundary. {@linkcode LocalProjectFiles} is the Deno-backed implementation rooted at a
 * project directory. This module unifies what were previously per-plugin forks into one
 * generic, parameterized only by the project root — there is no per-plugin branching.
 *
 * @module
 */

import { dirname, fromFileUrl, join, relative, resolve as resolvePath, toFileUrl } from '@std/path';

/**
 * File entry discovered by a plugin CLI filesystem scan.
 *
 * Carries both the absolute {@linkcode ProjectFileEntry.path} and the project-relative
 * {@linkcode ProjectFileEntry.relativePath}, plus the byte {@linkcode ProjectFileEntry.size},
 * so every plugin CLI consumer can use the field it needs from a single shape.
 */
export interface ProjectFileEntry {
  /** Absolute path on disk. */
  readonly path: string;
  /** Path relative to the project root, using `/` separators. */
  readonly relativePath: string;
  /** File size in bytes. */
  readonly size: number;
}

/**
 * Project file operations used by plugin CLI commands.
 *
 * Implementations resolve paths against a {@linkcode ProjectFiles.projectRoot} and expose
 * read/write/list primitives plus path helpers shared across plugin CLI backends.
 */
export interface ProjectFiles {
  /** Current project root. */
  readonly projectRoot: string;
  /** Resolve a path relative to the project root. */
  resolve(path: string): string;
  /** Write a UTF-8 text file, creating parent directories. */
  writeTextFile(path: string, content: string): Promise<void>;
  /** Read a UTF-8 text file, returning `undefined` when absent. */
  readTextFile(path: string): Promise<string | undefined>;
  /** Remove a file, returning false when it was already absent. */
  removeFile?(path: string): Promise<boolean>;
  /** List files below a project-relative directory, optionally filtered by extension. */
  listFiles(path: string, extensions?: readonly string[]): Promise<readonly ProjectFileEntry[]>;
  /** Convert a path to an importable file URL. */
  toImportUrl(path: string): string;
  /** Make a path project-relative, using `/` separators. */
  relative(path: string): string;
}

/**
 * Deno-backed project file adapter for local plugin CLI execution.
 *
 * Generic over the project root only; every NetScript plugin CLI shares this single
 * implementation rather than forking it per plugin kind.
 *
 * @example
 * ```ts
 * const files = new LocalProjectFiles(Deno.cwd());
 * await files.writeTextFile('workers/jobs/hello.ts', 'export default () => {};');
 * const entries = await files.listFiles('workers/jobs', ['.ts']);
 * console.log(entries.map((entry) => entry.relativePath));
 * ```
 */
export class LocalProjectFiles implements ProjectFiles {
  /** Absolute root path for project-relative file operations. */
  readonly projectRoot: string;

  /** Create a project file adapter rooted at the current working directory by default. */
  constructor(projectRoot: string = Deno.cwd()) {
    this.projectRoot = resolvePath(projectRoot);
  }

  /** Resolve a path relative to the project root. */
  resolve(path: string): string {
    return join(this.projectRoot, path);
  }

  /** Write a UTF-8 text file, creating parent directories. */
  async writeTextFile(path: string, content: string): Promise<void> {
    const target = this.resolve(path);
    await Deno.mkdir(dirname(target), { recursive: true });
    await Deno.writeTextFile(target, content);
  }

  /** Read a UTF-8 text file, returning `undefined` when absent. */
  async readTextFile(path: string): Promise<string | undefined> {
    try {
      return await Deno.readTextFile(this.resolve(path));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return undefined;
      }
      throw error;
    }
  }

  /** Remove a project-relative file, returning false when it was absent. */
  async removeFile(path: string): Promise<boolean> {
    try {
      await Deno.remove(this.resolve(path));
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      throw error;
    }
  }

  /** List files below a project-relative directory, optionally filtered by extension. */
  async listFiles(
    path: string,
    extensions: readonly string[] = [],
  ): Promise<readonly ProjectFileEntry[]> {
    const entries: ProjectFileEntry[] = [];
    await this.collectFiles(this.resolve(path), entries, extensions);
    return Object.freeze(
      entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
    );
  }

  /** Convert a path to an importable file URL. */
  toImportUrl(path: string): string {
    return toFileUrl(this.resolve(path)).href;
  }

  /** Make a path project-relative, using `/` separators. */
  relative(path: string): string {
    return relative(this.projectRoot, path).replaceAll('\\', '/');
  }

  /** Recursively collect matching files below an absolute root directory. */
  private async collectFiles(
    root: string,
    entries: ProjectFileEntry[],
    extensions: readonly string[],
  ): Promise<void> {
    let iterator: AsyncIterable<Deno.DirEntry>;
    try {
      iterator = Deno.readDir(root);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return;
      }
      throw error;
    }

    for await (const entry of iterator) {
      const path = join(root, entry.name);
      if (entry.isDirectory) {
        await this.collectFiles(path, entries, extensions);
      } else if (
        !extensions.length || extensions.some((extension) => entry.name.endsWith(extension))
      ) {
        const info = await Deno.stat(path);
        entries.push(
          Object.freeze({ path, relativePath: this.relative(path), size: info.size }),
        );
      }
    }
  }
}

/**
 * Resolve a URL or path to a local project root.
 *
 * @param input Optional `file:` URL or filesystem path; defaults to the current directory.
 * @returns An absolute project root path.
 *
 * @example
 * ```ts
 * console.log(resolveProjectRoot('file:///repo/app'));
 * ```
 */
export function resolveProjectRoot(input?: string): string {
  if (!input) {
    return Deno.cwd();
  }
  if (input.startsWith('file:')) {
    return fromFileUrl(input);
  }
  return resolvePath(input);
}
