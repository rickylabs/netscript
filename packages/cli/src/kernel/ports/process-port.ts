/**
 * Process execution port shared by CLI application services.
 */

/** Result of an external process invocation. */
export interface ProcessResult {
  /** Process exit code. */
  readonly code: number;

  /** Captured standard output. */
  readonly stdout: string;

  /** Captured standard error. */
  readonly stderr: string;
}

/** Process execution abstraction. */
export interface ProcessPort {
  /** Execute a command with arguments. */
  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
  ): Promise<ProcessResult>;
}
