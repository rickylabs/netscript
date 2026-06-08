import type { FileSystemPort } from '../ports/mod.ts';

/** In-memory file system adapter for plugin tests. */
export class MemoryFileSystemAdapter implements FileSystemPort {
  /** Mutable in-memory file contents keyed by path. */
  readonly files: Map<string, string> = new Map<string, string>();

  /** Read text content from an in-memory path. */
  readText(path: string): Promise<string> {
    return Promise.resolve(this.files.get(path) ?? '');
  }

  /** Write text content to an in-memory path. */
  writeText(path: string, text: string): Promise<void> {
    this.files.set(path, text);
    return Promise.resolve();
  }

  /** Check whether an in-memory path exists. */
  exists(path: string): Promise<boolean> {
    return Promise.resolve(this.files.has(path));
  }
}
