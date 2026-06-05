/** Minimal file system port used by plugin scaffolding. */
export interface FileSystemPort {
  readText(path: string): Promise<string>;
  writeText(path: string, text: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}
