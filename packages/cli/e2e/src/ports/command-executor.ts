/** Output handling strategy for a subprocess. */
export type CommandOutputMode = 'capture' | 'discard';

/** Command execution request. */
export interface CommandRequest {
  readonly command: readonly string[];
  readonly cwd: string;
  readonly timeoutMs?: number;
  readonly outputMode?: CommandOutputMode;
  readonly failureHint?: string;
}

/** Actual existing cancellation state, sampled immediately after native settlement. */
export interface CommandSignalAtSettlement {
  readonly abortRequested: boolean;
  readonly deadlineExpired: boolean;
}

/** Captured subprocess result. */
export interface CommandResult {
  readonly command: readonly string[];
  readonly cwd: string;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly signalAtSettlement?: CommandSignalAtSettlement;
}

/** Port for running external commands. */
export interface CommandExecutor {
  run(request: CommandRequest): Promise<CommandResult>;
}
