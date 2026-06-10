import { dirname, fromFileUrl, join, relative, resolve as resolvePath, toFileUrl } from '@std/path';

/** File entry discovered by the triggers CLI. */
export interface ProjectFileEntry {
  /** Absolute path on disk. */
  readonly path: string;
  /** Path relative to the project root. */
  readonly relativePath: string;
}

/** Project file operations used by triggers CLI commands. */
export interface ProjectFiles {
  /** Current project root. */
  readonly projectRoot: string;
  /** Resolve a path relative to the project root. */
  resolve(path: string): string;
  /** Write a UTF-8 text file, creating parent directories. */
  writeTextFile(path: string, content: string): Promise<void>;
  /** Read a UTF-8 text file, returning undefined when absent. */
  readTextFile(path: string): Promise<string | undefined>;
  /** List files below a project-relative directory. */
  listFiles(path: string, extensions?: readonly string[]): Promise<readonly ProjectFileEntry[]>;
  /** Convert a path to an importable file URL. */
  toImportUrl(path: string): string;
  /** Make a path project-relative. */
  relative(path: string): string;
}

/** Deno-backed project file adapter for local triggers CLI execution. */
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

  /** Read a UTF-8 text file, returning undefined when absent. */
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

  /** List files below a project-relative directory. */
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

  /** Make a path project-relative. */
  relative(path: string): string {
    return relative(this.projectRoot, path).replaceAll('\\', '/');
  }

  /** Recursively collect matching files below a root directory. */
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
        entries.push({ path, relativePath: this.relative(path) });
      }
    }
  }
}

/** Resolve a URL or path to a local project root. */
export function resolveProjectRoot(input?: string): string {
  if (!input) {
    return Deno.cwd();
  }
  if (input.startsWith('file:')) {
    return fromFileUrl(input);
  }
  return resolvePath(input);
}
