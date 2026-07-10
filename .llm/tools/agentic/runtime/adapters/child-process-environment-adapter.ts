/** Child-process execution with late-bound, non-observable credential injection. */

import type {
  AgentProcessRequest,
  ChildEnvironmentPolicy,
  ChildProcessOutcome,
  ChildProcessPort,
} from '../ports.ts';

export interface EnvironmentReader {
  get(key: string): string | undefined;
  toObject(): Readonly<Record<string, string>>;
}

interface SpawnedChild {
  readonly status: Promise<Deno.CommandStatus>;
  readonly stdout: ReadableStream<Uint8Array>;
  readonly stderr: ReadableStream<Uint8Array>;
  kill(signal?: Deno.Signal): void;
}

export interface ChildCommandOptions {
  readonly cwd: string;
  readonly args: string[];
  readonly env: Readonly<Record<string, string>>;
  readonly clearEnv: true;
  readonly stdin: 'null';
  readonly stdout: 'piped';
  readonly stderr: 'piped';
}

export type ChildCommandFactory = (
  executable: string,
  options: ChildCommandOptions,
) => SpawnedChild;

function diagnostic(
  code: 'auth_required' | 'process_failed' | 'timeout',
  category: 'authentication' | 'execution',
  message: string,
): import('../contract.ts').RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}

function childEnvironment(
  policy: ChildEnvironmentPolicy | undefined,
  reader: EnvironmentReader,
): Record<string, string> | null {
  const environment: Record<string, string> = { ...reader.toObject() };
  if (!policy) return environment;
  const cleared = new Set(policy.clearKeys);
  for (const key of cleared) delete environment[key];
  for (const key of policy.emptyKeys ?? []) environment[key] = '';
  for (const fixed of policy.fixedValues ?? []) environment[fixed.targetKey] = fixed.value;
  for (const binding of policy.bindings) {
    if (cleared.has(binding.targetKey) || policy.emptyKeys?.includes(binding.targetKey)) {
      return null;
    }
    const value = reader.get(binding.sourceKey);
    if (!value) return null;
    environment[binding.targetKey] = value;
  }
  return environment;
}

async function drain(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<void> {
  const reader = stream.getReader();
  let consumed = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      consumed += value.byteLength;
      if (consumed > maxBytes) {
        await reader.cancel('capture limit reached');
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function defaultCommandFactory(executable: string, options: ChildCommandOptions): SpawnedChild {
  return new Deno.Command(executable, options).spawn();
}

/** Executes a child with an isolated environment and returns no output or credential data. */
export class ChildProcessEnvironmentAdapter implements ChildProcessPort {
  readonly #environment: EnvironmentReader;
  readonly #commandFactory: ChildCommandFactory;

  constructor(
    environment: EnvironmentReader = {
      get: (key) => Deno.env.get(key),
      toObject: () => Deno.env.toObject(),
    },
    commandFactory: ChildCommandFactory = defaultCommandFactory,
  ) {
    this.#environment = environment;
    this.#commandFactory = commandFactory;
  }

  async run(request: AgentProcessRequest): Promise<ChildProcessOutcome> {
    const environment = childEnvironment(request.environment, this.#environment);
    if (!environment) {
      return {
        exitCode: 1,
        timedOut: false,
        diagnostic: diagnostic(
          'auth_required',
          'authentication',
          'selected child credential is unavailable or conflicts with explicit clearing',
        ),
      };
    }
    let child: SpawnedChild;
    try {
      child = this.#commandFactory(request.executable, {
        cwd: request.cwd,
        args: [...request.arguments],
        env: environment,
        clearEnv: true,
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
      });
    } catch {
      return {
        exitCode: 1,
        timedOut: false,
        diagnostic: diagnostic('process_failed', 'execution', 'child process could not start'),
      };
    }
    const drains = Promise.all([
      drain(child.stdout, request.maxCaptureBytes),
      drain(child.stderr, request.maxCaptureBytes),
    ]);
    let timeoutId: number | undefined;
    const timeout = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), request.timeoutMs);
    });
    const status = await Promise.race([child.status, timeout]);
    if (status === null) {
      try {
        child.kill('SIGTERM');
      } catch {
        // The child may have exited at the timeout boundary.
      }
      await drains.catch(() => undefined);
      return {
        exitCode: 1,
        timedOut: true,
        diagnostic: diagnostic('timeout', 'execution', 'child process timed out'),
      };
    }
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    await drains.catch(() => undefined);
    return status.success ? { exitCode: status.code, timedOut: false } : {
      exitCode: status.code,
      timedOut: false,
      diagnostic: diagnostic('process_failed', 'execution', 'child process failed'),
    };
  }
}
