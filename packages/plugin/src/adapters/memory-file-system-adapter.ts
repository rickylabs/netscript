import type { FileSystemPort } from '../ports/mod.ts';

/** In-memory file system adapter for plugin tests. */
export class MemoryFileSystemAdapter implements FileSystemPort {
  /** Mutable in-memory file contents keyed by path. */
  readonly files: Map<string, string> = new Map<string, string>();

  /** Read text content from an in-memory path. */
  async readText(path: string): Promise<string> {
    return this.files.get(path) ?? '';
  }

  /** Write text content to an in-memory path. */
  async writeText(path: string, text: string): Promise<void> {
    this.files.set(path, text);
  }

  /** Check whether an in-memory path exists. */
  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }
}
