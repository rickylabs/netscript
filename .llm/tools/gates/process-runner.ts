import { createHash } from 'node:crypto';

import type { OutputEvidence, ReceiptOutcome } from './contract.ts';

const DEFAULT_TAIL_BYTES = 16 * 1024;

export interface ProcessResult {
  outcome: Extract<ReceiptOutcome, 'PASS' | 'FAIL' | 'TIMED_OUT' | 'SPAWN_FAILED' | 'INTERRUPTED'>;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode?: number;
  signal?: string;
  stdout: OutputEvidence;
  stderr: OutputEvidence;
  reason?: string;
}

interface CapturedStream {
  evidence: Promise<OutputEvidence>;
}

function capture(
  stream: ReadableStream<Uint8Array>,
  tailLimit = DEFAULT_TAIL_BYTES,
): CapturedStream {
  const evidence = (async (): Promise<OutputEvidence> => {
    const hash = createHash('sha256');
    const reader = stream.getReader();
    let bytes = 0;
    let tail = new Uint8Array();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        bytes += value.byteLength;
        hash.update(value);
        const combined = new Uint8Array(Math.min(tailLimit, tail.length + value.length));
        const retained = Math.max(0, combined.length - value.length);
        if (retained > 0) combined.set(tail.subarray(tail.length - retained));
        combined.set(value.subarray(Math.max(0, value.length - combined.length)), retained);
        tail = combined;
      }
    } finally {
      reader.releaseLock();
    }
    return {
      bytes,
      sha256: hash.digest('hex'),
      tail: new TextDecoder().decode(tail),
      truncated: bytes > tail.length,
    };
  })();
  return { evidence };
}

function emptyEvidence(): OutputEvidence {
  return {
    bytes: 0,
    sha256: createHash('sha256').update('').digest('hex'),
    tail: '',
    truncated: false,
  };
}

export async function runProcess(
  argv: string[],
  options: { cwd: string; timeoutMs: number; signal?: AbortSignal; tailBytes?: number },
): Promise<ProcessResult> {
  const started = performance.now();
  const startedAt = new Date().toISOString();
  let child: Deno.ChildProcess;
  try {
    const [command, ...args] = argv;
    if (!command) throw new Error('argv must contain a command');
    child = new Deno.Command(command, {
      args,
      cwd: options.cwd,
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
  } catch (error) {
    return {
      outcome: 'SPAWN_FAILED',
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      stdout: emptyEvidence(),
      stderr: emptyEvidence(),
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  const stdout = capture(child.stdout, options.tailBytes);
  const stderr = capture(child.stderr, options.tailBytes);
  let requested: 'TIMED_OUT' | 'INTERRUPTED' | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let forceKill: ReturnType<typeof setTimeout> | undefined;
  const terminate = (outcome: typeof requested): void => {
    if (requested) return;
    requested = outcome;
    try {
      child.kill('SIGTERM');
      forceKill = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          // The child exited during the grace interval.
        }
      }, 1_000);
    } catch {
      // The child already exited between the signal and this callback.
    }
  };
  const abort = () => terminate('INTERRUPTED');
  options.signal?.addEventListener('abort', abort, { once: true });
  timeout = setTimeout(() => terminate('TIMED_OUT'), options.timeoutMs);

  try {
    const status = await child.status;
    const [stdoutEvidence, stderrEvidence] = await Promise.all([stdout.evidence, stderr.evidence]);
    const outcome = requested ?? (status.success ? 'PASS' : 'FAIL');
    return {
      outcome,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      exitCode: status.code,
      signal: status.signal ?? undefined,
      stdout: stdoutEvidence,
      stderr: stderrEvidence,
      reason: requested === 'TIMED_OUT'
        ? `Process exceeded ${options.timeoutMs}ms`
        : requested === 'INTERRUPTED'
        ? 'Process interrupted by runner signal'
        : undefined,
    };
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    if (forceKill !== undefined) clearTimeout(forceKill);
    options.signal?.removeEventListener('abort', abort);
  }
}
