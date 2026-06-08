/** File discovered by a plugin source walker. */
export interface WalkedFile {
  /** Path to the discovered source file. */
  readonly path: string;
  /** Text content of the discovered source file. */
  readonly text: string;
}

/** Port for discovering plugin source files. */
export interface WalkerPort {
  /** Walk a root directory and return source files. */
  walk(root: string): Promise<readonly WalkedFile[]>;
}
