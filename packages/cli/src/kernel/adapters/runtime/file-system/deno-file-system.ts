/**
 * Deno-backed filesystem adapter for CLI workflows.
 */

import { ensureDir, walk } from "@std/fs";
import { dirname, resolve } from "@std/path";

import type {
  DirEntry,
  FileInfo,
  WalkEntry,
} from "../../../domain/core-types.ts";
import type { FileSystemPort } from "../../../ports/file-system-port.ts";

interface CopyFileOperations {
  copyFile(src: string, dest: string): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
}

const denoCopyFileOperations: CopyFileOperations = {
  copyFile: Deno.copyFile,
  readFile: Deno.readFile,
  writeFile: Deno.writeFile,
};

/**
 * Copy a file with a byte-stream fallback for hosts where native copy is blocked.
 *
 * Deno.copyFile can return EPERM on WSL DrvFS mounts such as `/mnt/c` even when
 * normal read/write access is available. Scaffold materialization only needs
 * file contents, so fall back to read/write for that specific failure mode.
 */
export async function copyFilePortable(
  src: string,
  dest: string,
  operations: CopyFileOperations = denoCopyFileOperations,
): Promise<void> {
  try {
    await operations.copyFile(src, dest);
  } catch (error) {
    if (!(error instanceof Deno.errors.PermissionDenied)) {
      throw error;
    }
    await operations.writeFile(dest, await operations.readFile(src));
  }
}

/** Filesystem adapter backed by Deno APIs and `@std/fs`. */
export class DenoFileSystem implements FileSystemPort {
  /** Read a file as UTF-8 text. */
  async readFile(path: string): Promise<string> {
    return await Deno.readTextFile(path);
  }

  /** Write UTF-8 text to a file. */
  async writeFile(path: string, content: string): Promise<void> {
    await ensureDir(dirname(path));
    await Deno.writeTextFile(path, content);
  }

  /** Check whether a path exists. */
  async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) return false;
      throw error;
    }
  }

  /** Get file or directory metadata. */
  async stat(path: string): Promise<FileInfo> {
    const info = await Deno.stat(path);
    return { isFile: info.isFile, isDirectory: info.isDirectory };
  }

  /** Create a directory and all parent directories. */
  async createDir(path: string): Promise<void> {
    await ensureDir(path);
  }

  /** List directory entries. */
  async readDir(path: string): Promise<DirEntry[]> {
    const entries: DirEntry[] = [];
    for await (const entry of Deno.readDir(path)) {
      entries.push({
        name: entry.name,
        isFile: entry.isFile,
        isDirectory: entry.isDirectory,
      });
    }
    return entries;
  }

  /** Remove a file or directory recursively. */
  async remove(path: string): Promise<void> {
    await Deno.remove(path, { recursive: true });
  }

  /** Copy a file and create parent directories first. */
  async copy(src: string, dest: string): Promise<void> {
    await ensureDir(dirname(dest));
    await copyFilePortable(src, dest);
  }

  /** Walk a directory tree recursively. */
  async *walk(dir: string): AsyncIterable<WalkEntry> {
    const root = resolve(dir);
    for await (const entry of walk(root)) {
      yield {
        path: resolve(entry.path),
        name: entry.name,
        isFile: entry.isFile,
        isDirectory: entry.isDirectory,
      };
    }
  }
}
