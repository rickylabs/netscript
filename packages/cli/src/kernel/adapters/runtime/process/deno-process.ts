/**
 * Deno-backed process adapter for CLI workflows.
 */

import type { ProcessPort, ProcessResult } from '../../../ports/process-port.ts';

/** Process adapter backed by `Deno.Command`. */
export class DenoProcess implements ProcessPort {
  /** Execute a command and capture text output. */
  async exec(
    command: string,
    args: readonly string[],
    options?: {
      readonly cwd?: string;
      readonly env?: Readonly<Record<string, string>>;
      readonly clearEnv?: boolean;
      readonly timeoutMs?: number;
    },
  ): Promise<ProcessResult> {
    const child = new Deno.Command(command, {
      args: [...args],
      cwd: options?.cwd,
      env: options?.env,
      clearEnv: options?.clearEnv,
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    let completed = false;
    let timedOut = false;
    const timeout = options?.timeoutMs === undefined
      ? undefined
      : setTimeout(() => {
        if (completed) return;
        timedOut = true;
        child.kill('SIGKILL');
      }, options.timeoutMs);
    const output = await child.output();
    completed = true;
    if (timeout !== undefined) clearTimeout(timeout);

    const decoder = new TextDecoder();
    return {
      code: output.code,
      stdout: decoder.decode(output.stdout),
      stderr: decoder.decode(output.stderr),
      timedOut,
    };
  }
}
