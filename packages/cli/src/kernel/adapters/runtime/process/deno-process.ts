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
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
  ): Promise<ProcessResult> {
    const output = await new Deno.Command(command, {
      args: [...args],
      cwd: options?.cwd,
      env: options?.env,
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    const decoder = new TextDecoder();
    return {
      code: output.code,
      stdout: decoder.decode(output.stdout),
      stderr: decoder.decode(output.stderr),
    };
  }
}
