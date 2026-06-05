/** Scaffolder port for writing generated plugin files. */
export interface ScaffolderPort {
  scaffold(targetRoot: string): Promise<readonly string[]>;
}
