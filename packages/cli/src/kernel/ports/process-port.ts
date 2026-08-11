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

  /** Whether the adapter terminated the process after its configured timeout. */
  readonly timedOut?: boolean;
}

/** Process execution abstraction. */
export interface ProcessPort {
  /** Execute a command with arguments. */
  exec(
    command: string,
    args: readonly string[],
    options?: {
      readonly cwd?: string;
      readonly env?: Readonly<Record<string, string>>;
      /** Whether the child starts without inheriting the parent environment. */
      readonly clearEnv?: boolean;
      /** Maximum runtime before the adapter kills and awaits the child. */
      readonly timeoutMs?: number;
    },
  ): Promise<ProcessResult>;
}
