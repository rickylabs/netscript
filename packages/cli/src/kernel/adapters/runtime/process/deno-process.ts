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
      readonly maxOutputBytes?: number;
      readonly stdin?: string;
    },
  ): Promise<ProcessResult> {
    const hasStdin = options?.stdin !== undefined;
    const child = new Deno.Command(command, {
      args: [...args],
      cwd: options?.cwd,
      env: options?.env,
      clearEnv: options?.clearEnv,
      stdin: hasStdin ? 'piped' : 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    let completed = false;
    let timedOut = false;
    const timeout = options?.timeoutMs === undefined ? undefined : setTimeout(() => {
      if (completed) return;
      timedOut = true;
      child.kill('SIGKILL');
    }, options.timeoutMs);
    if (hasStdin) {
      const writer = child.stdin.getWriter();
      try {
        await writer.write(new TextEncoder().encode(options.stdin));
      } catch {
        // The child may exit or be killed while the pipe is being written.
      } finally {
        try {
          await writer.close();
        } catch {
          // A killed or already-exited child closes the other end first.
        }
        writer.releaseLock();
      }
    }

    let capacityExceeded = false;
    const bounded = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
      const chunks: Uint8Array[] = [];
      let length = 0;
      for await (const chunk of stream) {
        if (length + chunk.length > options!.maxOutputBytes!) {
          if (!capacityExceeded && !completed) {
            capacityExceeded = true;
            try {
              child.kill('SIGKILL');
            } catch { /* Child may already have exited. */ }
          }
          break;
        }
        chunks.push(chunk);
        length += chunk.length;
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      return bytes;
    };
    const output = options?.maxOutputBytes === undefined
      ? await child.output()
      : await (async () => {
        const [stdout, stderr, status] = await Promise.all([
          bounded(child.stdout),
          bounded(child.stderr),
          child.status,
        ]);
        return { ...status, stdout, stderr };
      })();
    completed = true;
    if (timeout !== undefined) clearTimeout(timeout);

    const decoder = new TextDecoder();
    return {
      code: capacityExceeded ? 1 : output.code,
      stdout: decoder.decode(output.stdout),
      stderr: capacityExceeded
        ? 'Process output capacity exceeded.'
        : decoder.decode(output.stderr),
      timedOut,
    };
  }
}
