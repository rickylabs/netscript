/**
 * CommandExecutor port: runs a subprocess in the sandbox (e.g. to boot the
 * candidate service). Mirrors the cli-e2e executor shape but is bench-local.
 *
 * @module
 */

/** A subprocess invocation. */
export interface CommandRequest {
  readonly command: string;
  readonly args: readonly string[];
  /** Absolute working directory. */
  readonly cwd: string;
  /** Extra environment variables to inject. */
  readonly env?: Readonly<Record<string, string>>;
  /** Wall-clock budget in milliseconds. */
  readonly timeoutMs: number;
  /**
   * Child stdout disposition (default `'piped'`). A long-running `spawn`ed
   * service should use `'null'` so an unread pipe never fills and blocks it.
   */
  readonly stdout?: 'piped' | 'null' | 'inherit';
  /** Child stderr disposition (default `'piped'`). */
  readonly stderr?: 'piped' | 'null' | 'inherit';
}

/** Outcome of a completed subprocess. */
export interface CommandResult {
  readonly code: number;
  readonly success: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
}

/** A handle to a long-running subprocess (e.g. a booted service). */
export interface CommandHandle {
  /** Terminate the process; idempotent. */
  stop(): Promise<void>;
}

/** Runs and supervises subprocesses inside a sandbox. */
export interface CommandExecutor {
  /** Run to completion and collect output. */
  run(request: CommandRequest): Promise<CommandResult>;
  /** Spawn a background process, returning a stop handle. */
  spawn(request: CommandRequest): Promise<CommandHandle>;
}
