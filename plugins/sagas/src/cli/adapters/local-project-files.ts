/** Project file returned by CLI filesystem adapters. */
export interface ProjectFileEntry {
  /** Path relative to the project root, using `/` separators. */
  readonly relativePath: string;
  /** File size in bytes when available. */
  readonly size: number;
}

/** Filesystem boundary used by the sagas CLI backend. */
export interface ProjectFiles {
  /** Return files below a project-relative root with one of the requested extensions. */
  listFiles(root: string, extensions: readonly string[]): Promise<readonly ProjectFileEntry[]>;
  /** Read a project-relative text file. */
  readTextFile(path: string): Promise<string | undefined>;
  /** Write a project-relative text file, creating parent directories when needed. */
  writeTextFile(path: string, content: string): Promise<void>;
}

/** Local Deno filesystem adapter for project CLI commands. */
export class LocalProjectFiles implements ProjectFiles {
  private readonly root: string;

  /** Create a local project file adapter rooted at `Deno.cwd()` by default. */
  constructor(root: string = Deno.cwd()) {
    this.root = normalize(root);
  }

  /** Return files below a project-relative root with one of the requested extensions. */
  async listFiles(
    root: string,
    extensions: readonly string[],
  ): Promise<readonly ProjectFileEntry[]> {
    const base = normalizeRelative(root);
    const basePath = joinPath(this.root, base);
    const exists = await isDirectory(basePath);
    if (!exists) {
      return [];
    }

    const files = await collectFiles(basePath, base, extensions);
    return files.toSorted((left, right) => left.relativePath.localeCompare(right.relativePath));
  }

  /** Read a project-relative text file. */
  async readTextFile(path: string): Promise<string | undefined> {
    try {
      return await Deno.readTextFile(joinPath(this.root, normalizeRelative(path)));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return undefined;
      }
      throw error;
    }
  }

  /** Write a project-relative text file, creating parent directories when needed. */
  async writeTextFile(path: string, content: string): Promise<void> {
    const relativePath = normalizeRelative(path);
    const target = joinPath(this.root, relativePath);
    const directory = dirname(target);
    if (directory !== target) {
      await Deno.mkdir(directory, { recursive: true });
    }
    await Deno.writeTextFile(target, content);
  }
}

async function collectFiles(
  absoluteRoot: string,
  relativeRoot: string,
  extensions: readonly string[],
): Promise<readonly ProjectFileEntry[]> {
  const entries: ProjectFileEntry[] = [];
  for await (const entry of Deno.readDir(absoluteRoot)) {
    const absolutePath = joinPath(absoluteRoot, entry.name);
    const relativePath = joinPath(relativeRoot, entry.name);
    if (entry.isDirectory) {
      entries.push(...await collectFiles(absolutePath, relativePath, extensions));
      continue;
    }
    if (entry.isFile && hasExtension(entry.name, extensions)) {
      const stat = await Deno.stat(absolutePath);
      entries.push(Object.freeze({ relativePath: normalize(relativePath), size: stat.size }));
    }
  }
  return entries;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

function hasExtension(fileName: string, extensions: readonly string[]): boolean {
  return extensions.some((extension) => fileName.endsWith(extension));
}

function dirname(path: string): string {
  const normalized = normalize(path);
  const index = normalized.lastIndexOf('/');
  return index < 0 ? normalized : normalized.slice(0, index);
}

function joinPath(...parts: readonly string[]): string {
  return normalize(parts.filter((part) => part.length > 0).join('/'));
}

function normalizeRelative(path: string): string {
  return normalize(path).replace(/^\/+/, '').replace(/\/+$/, '');
}

function normalize(path: string): string {
  return path.replaceAll('\\', '/').replace(/\/+/g, '/');
}
