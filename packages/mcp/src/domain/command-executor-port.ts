/** One normalized CLI execution request. */
export interface CommandExecutionRequest {
  /** Tokenized command path. */ readonly path: readonly string[];
  /** Arguments passed after the command path. */ readonly args: readonly string[];
}

/** Bounded subprocess execution evidence. */
export interface CommandExecutionResult {
  /** Process exit code, or 124 when timed out. */ readonly exitCode: number;
  /** Wall-clock execution duration. */ readonly durationMs: number;
  /** Last bounded bytes of combined stdout and stderr. */ readonly outputTail: string;
  /** Whether earlier output was discarded. */ readonly truncated: boolean;
  /** Whether the configured deadline terminated the process. */ readonly timedOut: boolean;
}

/** Runs a CLI verb behind the MCP command policy gate. */
export interface CommandExecutorPort {
  /** Execute one normalized command request. */
  execute(request: CommandExecutionRequest): Promise<CommandExecutionResult>;
}
