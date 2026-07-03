/**
 * Deno command executor: the live {@link CommandExecutor} used to boot the
 * candidate service in the conformance path (Slice 1b). Agent subprocesses run
 * under restricted permissions scoped to the sandbox workdir (OQ4) — callers
 * pass an explicit `command`/`args` allowlist; this adapter never shells out to
 * a shell interpreter.
 *
 * @module
 */

import type {
  CommandExecutor,
  CommandHandle,
  CommandRequest,
  CommandResult,
} from '../../ports/command-executor.ts';

function buildCommand(request: CommandRequest): Deno.Command {
  return new Deno.Command(request.command, {
    args: [...request.args],
    cwd: request.cwd,
    env: request.env ? { ...request.env } : undefined,
    stdout: request.stdout ?? 'piped',
    stderr: request.stderr ?? 'piped',
  });
}

/** {@link CommandExecutor} backed by `Deno.Command`. */
export class DenoCommandExecutor implements CommandExecutor {
  async run(request: CommandRequest): Promise<CommandResult> {
    const command = buildCommand(request);
    const child = command.spawn();
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        // Already exited.
      }
    }, request.timeoutMs);

    let timedOut = false;
    try {
      const output = await child.output();
      clearTimeout(timer);
      const decoder = new TextDecoder();
      return {
        code: output.code,
        success: output.success,
        stdout: decoder.decode(output.stdout),
        stderr: decoder.decode(output.stderr),
        timedOut,
      };
    } catch (error) {
      clearTimeout(timer);
      timedOut = true;
      throw error;
    }
  }

  spawn(request: CommandRequest): Promise<CommandHandle> {
    const command = buildCommand(request);
    const child = command.spawn();
    let stopped = false;
    const handle: CommandHandle = {
      stop: async (): Promise<void> => {
        if (stopped) return;
        stopped = true;
        try {
          child.kill('SIGTERM');
        } catch {
          // Already exited.
        }
        try {
          await child.status;
        } catch {
          // Ignore post-termination status errors.
        }
      },
    };
    return Promise.resolve(handle);
  }
}
