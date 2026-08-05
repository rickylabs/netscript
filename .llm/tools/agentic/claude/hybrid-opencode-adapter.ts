/** Credential-isolated OpenCode adapter for bounded Claude hybrid delegation. */

import { type Environment, resolveOpenRouterApiKey } from '../lib/openrouter-credential.ts';
import { opencodeRunArguments, resolveOpenCodeBinary } from '../opencode/opencode-run.ts';
import {
  HYBRID_DELEGATION_LIMITS,
  HybridDelegationError,
  hybridDelegationPrompt,
  type HybridDelegationRequest,
  type HybridDelegationResult,
  validateHybridDelegationRequest,
} from './hybrid-delegation.ts';

export interface HybridWorkerInvocation {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
}

export interface HybridWorkerProcess {
  readonly stdout: ReadableStream<Uint8Array>;
  readonly stderr: ReadableStream<Uint8Array>;
  readonly status: Promise<{ readonly code: number; readonly success: boolean }>;
  killProcessGroup(signal: Deno.Signal): void;
}

export interface HybridWorkerPort {
  spawn(invocation: HybridWorkerInvocation): HybridWorkerProcess;
}

export const HYBRID_WORKER_ENVIRONMENT_NAMES = [
  'HOME',
  'PATH',
  'TMPDIR',
  'TEMP',
  'TMP',
  'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME',
  'XDG_DATA_HOME',
  'OPENCODE_BIN',
  'OPENCODE_CONFIG',
] as const;

export const HYBRID_MCP_ENVIRONMENT_NAMES: readonly string[] = [
  ...HYBRID_WORKER_ENVIRONMENT_NAMES,
  'OPENROUTER_API_KEY',
] as const;

class DenoHybridWorkerPort implements HybridWorkerPort {
  spawn(invocation: HybridWorkerInvocation): HybridWorkerProcess {
    const child = new Deno.Command('setsid', {
      args: ['--', invocation.command, ...invocation.args],
      cwd: invocation.cwd,
      env: { ...invocation.env },
      clearEnv: true,
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    return {
      stdout: child.stdout,
      stderr: child.stderr,
      status: child.status,
      killProcessGroup(signal: Deno.Signal): void {
        Deno.kill(-child.pid, signal);
      },
    };
  }
}

class ConcurrencyGate {
  #active = 0;
  readonly #waiters: Array<() => void> = [];

  constructor(readonly maximum: number) {}

  async acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) throw cancelled();
    if (this.#active < this.maximum) {
      this.#active++;
      return () => this.#release();
    }
    await new Promise<void>((resolve, reject) => {
      const ready = () => {
        signal?.removeEventListener('abort', abort);
        this.#active++;
        resolve();
      };
      const abort = () => {
        const index = this.#waiters.indexOf(ready);
        if (index >= 0) this.#waiters.splice(index, 1);
        reject(cancelled());
      };
      signal?.addEventListener('abort', abort, { once: true });
      this.#waiters.push(ready);
    });
    return () => this.#release();
  }

  #release(): void {
    this.#active--;
    this.#waiters.shift()?.();
  }
}

function cancelled(): HybridDelegationError {
  return new HybridDelegationError('cancelled', 'delegation was cancelled');
}

/** Builds the worker's minimal environment; only this child receives OpenRouter auth. */
export async function hybridWorkerEnvironment(
  env: Environment,
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
): Promise<Record<string, string>> {
  const child: Record<string, string> = {};
  for (const name of HYBRID_WORKER_ENVIRONMENT_NAMES) {
    const value = env[name]?.trim();
    if (value) child[name] = value;
  }
  child.OPENROUTER_API_KEY = await resolveOpenRouterApiKey(env, readTextFile);
  return child;
}

function scrubDiagnostic(value: string, secret: string): string {
  return value
    .split(secret).join('[REDACTED]')
    .replace(/\b(?:sk-or-v1-|or-)[A-Za-z0-9_-]{8,}\b/g, '[REDACTED]');
}

async function readBounded(
  stream: ReadableStream<Uint8Array>,
  maximumBytes: number,
  onOverflow: () => void,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        onOverflow();
        throw new HybridDelegationError(
          'result_too_large',
          `worker output exceeds ${maximumBytes} bytes`,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function textFromOpenCodeJsonLines(source: string): string {
  const text: string[] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line) as {
        type?: unknown;
        part?: { text?: unknown };
        text?: unknown;
      };
      if (event.type === 'text' && typeof event.part?.text === 'string') text.push(event.part.text);
      else if (event.type === 'text' && typeof event.text === 'string') text.push(event.text);
    } catch {
      throw new HybridDelegationError('worker_failed', 'OpenCode returned malformed JSON output');
    }
  }
  if (text.length === 0) {
    throw new HybridDelegationError('worker_failed', 'OpenCode returned no text result');
  }
  return text.join('');
}

export interface HybridOpenCodeAdapterOptions {
  readonly cwd: string;
  readonly env?: Environment;
  readonly readTextFile?: (path: string) => Promise<string>;
  readonly worker?: HybridWorkerPort;
  readonly now?: () => number;
}

/** Executes validated delegation requests through a bounded isolated worker pool. */
export class HybridOpenCodeAdapter {
  readonly #gate: ConcurrencyGate;
  readonly #worker: HybridWorkerPort;
  readonly #env: Environment;
  readonly #readTextFile: (path: string) => Promise<string>;
  readonly #now: () => number;

  constructor(readonly options: HybridOpenCodeAdapterOptions) {
    this.#gate = new ConcurrencyGate(HYBRID_DELEGATION_LIMITS.concurrency);
    this.#worker = options.worker ?? new DenoHybridWorkerPort();
    this.#env = options.env ?? Deno.env.toObject();
    this.#readTextFile = options.readTextFile ?? Deno.readTextFile;
    this.#now = options.now ?? Date.now;
  }

  async delegate(
    untrustedRequest: HybridDelegationRequest,
    signal?: AbortSignal,
  ): Promise<HybridDelegationResult> {
    const request = validateHybridDelegationRequest(untrustedRequest);
    const release = await this.#gate.acquire(signal);
    const startedAt = this.#now();
    let process: HybridWorkerProcess | undefined;
    let timedOut = false;
    let abortListener: (() => void) | undefined;
    try {
      const env = await hybridWorkerEnvironment(this.#env, this.#readTextFile);
      if (signal?.aborted) throw cancelled();
      const cliModel = `openrouter/${request.model}`;
      const args = opencodeRunArguments({
        message: hybridDelegationPrompt(request),
        model: cliModel,
        variant: request.effort,
        format: 'json',
      });
      process = this.#worker.spawn({
        command: resolveOpenCodeBinary(this.#env),
        args,
        cwd: this.options.cwd,
        env,
      });
      const stop = () => {
        try {
          process?.killProcessGroup('SIGTERM');
        } catch {
          // The worker may already have exited.
        }
        setTimeout(() => {
          try {
            process?.killProcessGroup('SIGKILL');
          } catch {
            // The isolated process group may already have exited.
          }
        }, HYBRID_DELEGATION_LIMITS.terminationGraceMs);
      };
      abortListener = stop;
      signal?.addEventListener('abort', abortListener, { once: true });
      const timeout = setTimeout(() => {
        timedOut = true;
        stop();
      }, request.timeoutMs);
      try {
        const stdoutPromise = readBounded(
          process.stdout,
          HYBRID_DELEGATION_LIMITS.resultBytes,
          stop,
        );
        const stderrPromise = readBounded(
          process.stderr,
          HYBRID_DELEGATION_LIMITS.stderrBytes,
          stop,
        ).catch((error) => {
          if (error instanceof HybridDelegationError && error.code === 'result_too_large') {
            return new TextEncoder().encode('diagnostic output exceeded its limit');
          }
          throw error;
        });
        const [status, stdout, stderr] = await Promise.all([
          process.status,
          stdoutPromise,
          stderrPromise,
        ]);
        if (signal?.aborted) throw cancelled();
        if (timedOut) throw new HybridDelegationError('timed_out', 'delegation timed out');
        if (!status.success) {
          const detail = scrubDiagnostic(
            new TextDecoder().decode(stderr).trim(),
            env.OPENROUTER_API_KEY,
          );
          throw new HybridDelegationError(
            'worker_failed',
            detail
              ? `OpenCode worker exited ${status.code}: ${detail}`
              : `OpenCode worker exited ${status.code}`,
          );
        }
        const rawOutput = new TextDecoder().decode(stdout);
        if (rawOutput.includes(env.OPENROUTER_API_KEY)) {
          throw new HybridDelegationError(
            'worker_failed',
            'OpenCode worker output contained a protected credential',
          );
        }
        const output = textFromOpenCodeJsonLines(rawOutput);
        const identity = {
          provider: 'openrouter' as const,
          model: request.model,
          effort: request.effort,
        };
        return {
          output,
          requested: identity,
          observed: { ...identity, source: 'opencode_argv' },
          durationMs: Math.max(0, this.#now() - startedAt),
        };
      } finally {
        clearTimeout(timeout);
      }
    } finally {
      if (abortListener) signal?.removeEventListener('abort', abortListener);
      release();
    }
  }
}
