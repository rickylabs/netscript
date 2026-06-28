import { dirname } from '@std/path';

import type { FileSystemPort } from '../ports/mod.ts';

/** Deno-backed file system adapter for plugin scaffolding. */
export class DenoFileSystemAdapter implements FileSystemPort {
  /** Read text content from a file path. */
  readText(path: string): Promise<string> {
    return Deno.readTextFile(path);
  }

  /** Write text content to a file path, creating parent directories first. */
  async writeText(path: string, text: string): Promise<void> {
    await Deno.mkdir(dirname(path), { recursive: true });
    await Deno.writeTextFile(path, text);
  }

  /** Check whether a path exists on disk. */
  async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      throw error;
    }
  }
}
