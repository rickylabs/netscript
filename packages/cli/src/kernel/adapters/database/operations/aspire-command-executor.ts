import { resolveAspireExecutable } from '../../runtime/process/resolve-aspire-executable.ts';

type CommandStdio = 'inherit' | 'null' | 'piped';

export interface AspireCommandOptions {
  readonly cwd: string;
  readonly env?: Record<string, string>;
  readonly stdin?: CommandStdio;
  readonly stdout?: CommandStdio;
  readonly stderr?: CommandStdio;
  readonly signal?: AbortSignal;
}

export interface CommandOutput {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface AspireCommandExecutor {
  output(args: readonly string[], options: AspireCommandOptions): Promise<CommandOutput>;
  spawn(args: readonly string[], options: AspireCommandOptions): Promise<number>;
  /** Own one line stream until EOF, cancellation, failure, or iterator disposal. */
  stream(args: readonly string[], options: AspireCommandOptions): AsyncGenerator<string, void>;
}

const MAX_STREAM_LINE_CHARS = 1_048_576;
const MAX_STREAM_DIAGNOSTIC_CHARS = 4_096;
const STREAM_KILL_GRACE_MS = 1_000;

export class DenoAspireCommandExecutor implements AspireCommandExecutor {
  /** Stream NDJSON without accumulating the full watch history or leaving a child behind. */
  async *stream(
    args: readonly string[],
    options: AspireCommandOptions,
  ): AsyncGenerator<string, void> {
    options.signal?.throwIfAborted();
    const child = new Deno.Command(resolveAspireExecutable(options.env), {
      args: [...args],
      cwd: options.cwd,
      env: options.env,
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    let exited = false;
    let stopping = false;
    let escalation: ReturnType<typeof setTimeout> | undefined;
    const status = child.status.then((result) => {
      exited = true;
      return result;
    });
    const stop = () => {
      if (exited || stopping) return;
      stopping = true;
      try {
        child.kill('SIGTERM');
      } catch { /* Already exiting. */ }
      escalation = setTimeout(() => {
        if (!exited) {
          try {
            child.kill('SIGKILL');
          } catch { /* Already exiting. */ }
        }
      }, STREAM_KILL_GRACE_MS);
    };
    const stderr = drainDiagnostics(child.stderr);
    // Observe immediately so an I/O failure cannot become an unhandled rejection.
    const diagnostics = stderr.catch(() => 'Aspire diagnostic stream failed.');
    options.signal?.addEventListener('abort', stop, { once: true });
    if (options.signal?.aborted) stop();
    const reader = child.stdout.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    try {
      while (true) {
        options.signal?.throwIfAborted();
        const { value, done } = await reader.read();
        options.signal?.throwIfAborted();
        pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
        let newline: number;
        while ((newline = pending.indexOf('\n')) !== -1) {
          if (newline > MAX_STREAM_LINE_CHARS) throw new Error('Aspire stream line too large.');
          const line = pending.slice(0, newline).trim();
          pending = pending.slice(newline + 1);
          if (line) yield line;
        }
        if (pending.length > MAX_STREAM_LINE_CHARS) {
          throw new Error('Aspire stream line too large.');
        }
        if (done) break;
      }
      if (pending.trim()) yield pending.trim();
      const result = await status;
      if (!result.success) {
        throw new Error(`Aspire stream exited ${result.code}: ${await diagnostics}`);
      }
    } finally {
      stop();
      await reader.cancel().catch(() => {});
      reader.releaseLock();
      try {
        await status;
        await diagnostics;
      } finally {
        if (escalation !== undefined) clearTimeout(escalation);
        options.signal?.removeEventListener('abort', stop);
      }
    }
  }

  async output(
    args: readonly string[],
    options: AspireCommandOptions,
  ): Promise<CommandOutput> {
    const output = await new Deno.Command(
      resolveAspireExecutable(options.env),
      {
        args: [...args],
        cwd: options.cwd,
        env: options.env,
        stdin: options.stdin ?? 'null',
        stdout: options.stdout ?? 'piped',
        stderr: options.stderr ?? 'piped',
        signal: options.signal,
      },
    ).output();

    return {
      code: output.code,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
    };
  }

  async spawn(
    args: readonly string[],
    options: AspireCommandOptions,
  ): Promise<number> {
    const child = new Deno.Command(
      resolveAspireExecutable(options.env),
      {
        args: [...args],
        cwd: options.cwd,
        env: options.env,
        stdin: options.stdin ?? 'inherit',
        stdout: options.stdout ?? 'inherit',
        stderr: options.stderr ?? 'inherit',
        signal: options.signal,
      },
    ).spawn();

    const status = await child.status;
    return status.code;
  }
}

/** Drain stderr concurrently while retaining only a bounded diagnostic tail. */
async function drainDiagnostics(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let tail = '';
  for await (const chunk of stream) {
    tail = (tail + decoder.decode(chunk, { stream: true })).slice(-MAX_STREAM_DIAGNOSTIC_CHARS);
  }
  return (tail + decoder.decode()).slice(-MAX_STREAM_DIAGNOSTIC_CHARS).trim();
}
