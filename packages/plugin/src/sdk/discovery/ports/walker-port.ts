/** File discovered by a plugin source walker. */
export interface WalkedFile {
  readonly path: string;
  readonly text: string;
}

/** Port for discovering plugin source files. */
export interface WalkerPort {
  walk(root: string): Promise<readonly WalkedFile[]>;
}
