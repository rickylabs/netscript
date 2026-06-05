/**
 * Filesystem port shared by CLI application services.
 */

import type { DirEntry, FileInfo, WalkEntry } from '../domain/core-types.ts';

/**
 * Abstraction over filesystem operations.
 */
export interface FileSystemPort {
  /** Read a file as UTF-8 text. */
  readFile(path: string): Promise<string>;

  /** Write UTF-8 text to a file. */
  writeFile(path: string, content: string): Promise<void>;

  /** Check if a path exists. */
  exists(path: string): Promise<boolean>;

  /** Get file or directory metadata. */
  stat(path: string): Promise<FileInfo>;

  /** Create a directory and all parent directories. */
  createDir(path: string): Promise<void>;

  /** List directory entries. */
  readDir(path: string): Promise<DirEntry[]>;

  /** Remove a file or directory. */
  remove(path: string): Promise<void>;

  /** Copy a file. */
  copy(src: string, dest: string): Promise<void>;

  /** Walk a directory tree recursively. */
  walk(dir: string): AsyncIterable<WalkEntry>;
}
