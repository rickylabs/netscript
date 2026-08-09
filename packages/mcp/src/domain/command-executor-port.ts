/** One normalized CLI execution request. */
export interface CommandExecutionRequest {
  /** Tokenized command path. */ readonly path: readonly string[];
  /** Arguments passed after the command path. */ readonly args: readonly string[];
}

/** Hosting identity for the CLI process an executor will run. */
export interface CliExecutionIdentity {
  /** Whether an outer CLI injected itself or MCP selected its standalone fallback. */
  readonly mode: 'host' | 'standalone';
  /** Version of the CLI selected by this executor. */
  readonly version: string;
  /** Executable and fixed arguments placed before the requested command path. */
  readonly command: readonly string[];
}

/** Bounded subprocess execution evidence. */
export interface CommandExecutionResult {
  /** Truthful identity of the CLI process that produced this result. */
  readonly executor: CliExecutionIdentity;
  /** Process exit code, or 124 when timed out. */ readonly exitCode: number;
  /** Wall-clock execution duration. */ readonly durationMs: number;
  /** Last bounded bytes of combined stdout and stderr. */ readonly outputTail: string;
  /** Whether earlier output was discarded. */ readonly truncated: boolean;
  /** Whether the configured deadline terminated the process. */ readonly timedOut: boolean;
}

/** Runs a CLI verb behind the MCP command policy gate. */
export interface CommandExecutorPort {
  /** Truthful identity of the CLI process this adapter executes. */
  readonly identity: CliExecutionIdentity;
  /** Execute one normalized command request. */
  execute(request: CommandExecutionRequest): Promise<CommandExecutionResult>;
}
