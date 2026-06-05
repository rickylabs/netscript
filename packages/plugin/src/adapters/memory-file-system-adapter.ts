import type { FileSystemPort } from '../ports/mod.ts';

/** In-memory file system adapter for plugin tests. */
export class MemoryFileSystemAdapter implements FileSystemPort {
  readonly files: Map<string, string> = new Map<string, string>();

  async readText(path: string): Promise<string> {
    return this.files.get(path) ?? '';
  }

  async writeText(path: string, text: string): Promise<void> {
    this.files.set(path, text);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }
}
