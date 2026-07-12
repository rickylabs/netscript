import type {
  CommandExecutionRequest,
  CommandExecutionResult,
  CommandExecutorPort,
} from '../domain/command-executor-port.ts';

/** Public CLI invocation used when an outer composition does not inject one. */
export const DEFAULT_CLI_COMMAND: readonly string[] = Object.freeze([
  'deno',
  'run',
  '-A',
  'jsr:@netscript/cli',
]);
/** Default command deadline in milliseconds. */
export const DEFAULT_COMMAND_TIMEOUT_MS = 120_000;
/** Default maximum combined output tail in bytes. */
export const DEFAULT_OUTPUT_TAIL_BYTES = 4_096;

/** Configuration for subprocess-backed CLI execution. */
export interface SpawnCommandExecutorOptions {
  /** Executable and fixed arguments placed before the command path. */ readonly cliCommand?:
    readonly string[];
  /** Deadline before the child is terminated. */ readonly timeoutMs?: number;
  /** Maximum retained bytes across stdout and stderr. */ readonly outputTailBytes?: number;
}

class TailCollector {
  #bytes = new Uint8Array();
  #seen = 0;

  constructor(private readonly maximum: number) {}

  append(chunk: Uint8Array): void {
    this.#seen += chunk.length;
    const combined = new Uint8Array(this.#bytes.length + chunk.length);
    combined.set(this.#bytes);
    combined.set(chunk, this.#bytes.length);
    this.#bytes = combined.length <= this.maximum
      ? combined
      : combined.slice(combined.length - this.maximum);
  }

  result(): { outputTail: string; truncated: boolean } {
    return {
      outputTail: new TextDecoder().decode(this.#bytes),
      truncated: this.#seen > this.maximum,
    };
  }
}

async function collect(stream: ReadableStream<Uint8Array>, tail: TailCollector): Promise<void> {
  for await (const chunk of stream) tail.append(chunk);
}

/** Executes the public NetScript CLI in its own process with bounded captured output. */
export class SpawnCommandExecutor implements CommandExecutorPort {
  readonly #cliCommand: readonly string[];
  readonly #timeoutMs: number;
  readonly #outputTailBytes: number;

  /** Create an executor with injectable command prefix and resource bounds. */
  constructor(options: SpawnCommandExecutorOptions = {}) {
    this.#cliCommand = options.cliCommand ?? DEFAULT_CLI_COMMAND;
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    this.#outputTailBytes = options.outputTailBytes ?? DEFAULT_OUTPUT_TAIL_BYTES;
    if (!this.#cliCommand[0]) throw new TypeError('cliCommand must contain an executable');
  }

  /** Spawn one command and return its bounded combined output tail. */
  async execute(request: CommandExecutionRequest): Promise<CommandExecutionResult> {
    const started = performance.now();
    const child = new Deno.Command(this.#cliCommand[0]!, {
      args: [...this.#cliCommand.slice(1), ...request.path, ...request.args],
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    const tail = new TailCollector(Math.max(1, this.#outputTailBytes));
    const readers = Promise.all([collect(child.stdout, tail), collect(child.stderr, tail)]);
    let timedOut = false;
    let timer: number | undefined;
    const deadline = new Promise<undefined>((resolve) => {
      timer = setTimeout(() => resolve(undefined), Math.max(1, this.#timeoutMs));
    });
    let status = await Promise.race([child.status, deadline]);
    if (status === undefined) {
      timedOut = true;
      try {
        child.kill('SIGTERM');
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
      status = await child.status;
    }
    if (timer !== undefined) clearTimeout(timer);
    await readers;
    if (timedOut) {
      tail.append(new TextEncoder().encode(`${tail.result().outputTail ? '\n' : ''}timed_out`));
    }
    const output = tail.result();
    return {
      exitCode: timedOut ? 124 : status.code,
      durationMs: Math.max(0, Math.round(performance.now() - started)),
      outputTail: output.outputTail,
      truncated: output.truncated,
      timedOut,
    };
  }
}
