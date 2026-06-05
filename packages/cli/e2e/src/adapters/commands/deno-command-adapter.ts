import type {
  CommandExecutor,
  CommandRequest,
  CommandResult,
} from '../../ports/command-executor.ts';

const decoder = new TextDecoder();

/** Deno.Command-backed process adapter. */
export class DenoCommandAdapter implements CommandExecutor {
  async run(request: CommandRequest): Promise<CommandResult> {
    const controller = new AbortController();
    const timeout = request.timeoutMs
      ? setTimeout(() => controller.abort(), request.timeoutMs)
      : undefined;
    try {
      const [command, ...args] = request.command;
      if (request.outputMode === 'discard') {
        const child = new Deno.Command(command, {
          args,
          cwd: request.cwd,
          stdout: 'null',
          stderr: 'null',
          signal: controller.signal,
        }).spawn();
        const status = await child.status;
        return {
          command: request.command,
          cwd: request.cwd,
          code: status.code,
          stdout: '',
          stderr: status.code === 0 ? '' : request.failureHint ??
            'Command failed while output capture was disabled. Re-run the command directly to inspect its output.',
          timedOut: false,
        };
      }

      const output = await new Deno.Command(command, {
        args,
        cwd: request.cwd,
        stdout: 'piped',
        stderr: 'piped',
        signal: controller.signal,
      }).output();
      return {
        command: request.command,
        cwd: request.cwd,
        code: output.code,
        stdout: decoder.decode(output.stdout),
        stderr: decoder.decode(output.stderr),
        timedOut: false,
      };
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'AbortError';
      return {
        command: request.command,
        cwd: request.cwd,
        code: 124,
        stdout: '',
        stderr: timedOut ? 'Command timed out.' : String(error),
        timedOut,
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
