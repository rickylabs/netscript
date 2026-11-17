import type {
  CommandExecutor,
  CommandRequest,
  CommandResult,
} from '../../ports/command-executor.ts';

const decoder = new TextDecoder();

/** Deno.Command-backed process adapter. */
export class DenoCommandAdapter implements CommandExecutor {
  constructor(
    private readonly native: {
      capture(command: string, options: Deno.CommandOptions): Promise<Deno.CommandOutput>;
      status(command: string, options: Deno.CommandOptions): Promise<Deno.CommandStatus>;
    } = {
      capture: (command, options) => new Deno.Command(command, options).output(),
      status: (command, options) => new Deno.Command(command, options).spawn().status,
    },
  ) {}
  async run(request: CommandRequest): Promise<CommandResult> {
    const controller = new AbortController();
    let deadlineExpired = false;
    const settlementSignal = () => ({ abortRequested: controller.signal.aborted, deadlineExpired });
    const timeout = request.timeoutMs
      ? setTimeout(() => {
        deadlineExpired = true;
        controller.abort();
      }, request.timeoutMs)
      : undefined;
    try {
      const [command, ...args] = request.command;
      if (request.outputMode === 'discard') {
        const status = await this.native.status(command, {
          args,
          cwd: request.cwd,
          stdout: 'null',
          stderr: 'null',
          signal: controller.signal,
        });
        const signalAtSettlement = settlementSignal();
        return {
          command: request.command,
          cwd: request.cwd,
          code: status.code,
          stdout: '',
          stderr: status.code === 0 ? '' : request.failureHint ??
            'Command failed while output capture was disabled. Re-run the command directly to inspect its output.',
          timedOut: signalAtSettlement.deadlineExpired,
          signalAtSettlement,
        };
      }

      const output = await this.native.capture(command, {
        args,
        cwd: request.cwd,
        stdout: 'piped',
        stderr: 'piped',
        signal: controller.signal,
      });
      const signalAtSettlement = settlementSignal();
      return {
        command: request.command,
        cwd: request.cwd,
        code: output.code,
        stdout: decoder.decode(output.stdout),
        stderr: decoder.decode(output.stderr),
        timedOut: signalAtSettlement.deadlineExpired,
        signalAtSettlement,
      };
    } catch (error) {
      const signalAtSettlement = settlementSignal();
      const timedOut = signalAtSettlement.deadlineExpired;
      return {
        command: request.command,
        cwd: request.cwd,
        code: 124,
        stdout: '',
        stderr: timedOut ? 'Command timed out.' : String(error),
        timedOut,
        signalAtSettlement,
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
