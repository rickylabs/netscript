/** Minimal file system port used by plugin scaffolding. */
export interface FileSystemPort {
  /** Read text content from a path. */
  readText(path: string): Promise<string>;
  /** Write text content to a path. */
  writeText(path: string, text: string): Promise<void>;
  /** Check whether a path exists. */
  exists(path: string): Promise<boolean>;
}
