/** Own the companion child, its stdio protocol, and Linux resource sampling. */
import { abortable } from 'jsr:@std/async@1/abortable';
import { TextLineStream } from 'jsr:@std/streams@1/text-line-stream';
import { join } from '@std/path';

/** Delimits bench messages from service logging on stdout. */
export const MESSAGE_PREFIX = 'streams-capacity ';
const CLEANUP_MS = 10_000;

/** Counts from the upstream server and its file-backed store. */
export interface Lifecycle {
  readonly openSseResponses: number;
  readonly pendingWaiters: number;
  readonly upstreamStopped: boolean;
}

/** Child replies emitted on the private stdio channel. */
export type CompanionMessage =
  | { readonly kind: 'ready'; readonly port: number }
  | { readonly kind: 'snapshot' | 'stopped'; readonly lifecycle: Lifecycle };

/** Wall time and Linux procfs counters for the companion child alone. */
export interface ProcessSample {
  readonly atMs: number;
  readonly rssBytes: number;
  readonly cpuTicks: number;
  readonly openFileDescriptors: number;
}

/** Own one isolated companion process. */
export class Companion {
  readonly #child: Deno.ChildProcess;
  readonly #commands: WritableStreamDefaultWriter<Uint8Array>;
  readonly #replies: ReadableStreamDefaultReader<string>;
  #exited = false;

  constructor(dataDir: string) {
    const env: Record<string, string> = { STREAMS_DATA_DIR: dataDir, NO_COLOR: '1' };
    // Keep runtime cache discovery and exclude ambient Streams, auth and telemetry settings.
    for (const name of ['HOME', 'XDG_CACHE_HOME', 'DENO_DIR']) {
      const value = Deno.env.get(name);
      if (value !== undefined) env[name] = value;
    }
    this.#child = new Deno.Command(Deno.execPath(), {
      args: ['run', '-A', '--frozen', import.meta.resolve('./companion.ts')],
      clearEnv: true,
      env,
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'inherit',
    }).spawn();
    void this.#child.status.then(() => this.#exited = true);
    this.#commands = this.#child.stdin.getWriter();
    this.#replies = this.#child.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      // Drain ordinary service logs even while no checkpoint is awaiting a reply.
      .pipeThrough(
        new TransformStream<string, string>(
          {
            transform(line, controller) {
              if (line.startsWith(MESSAGE_PREFIX)) {
                controller.enqueue(
                  line.slice(MESSAGE_PREFIX.length),
                );
              }
            },
          },
          undefined,
          { highWaterMark: 8 },
        ),
      )
      .getReader();
  }

  async ready(signal: AbortSignal): Promise<number> {
    const reply = await this.#receive(signal);
    if (reply.kind !== 'ready' || !Number.isInteger(reply.port) || reply.port < 1) {
      throw new Error('Expected the companion listener address');
    }
    return reply.port;
  }

  async snapshot(signal: AbortSignal): Promise<Lifecycle> {
    await abortable(this.#commands.write(new TextEncoder().encode('snapshot\n')), signal);
    const reply = await this.#receive(signal);
    if (reply.kind !== 'snapshot') throw new Error('Expected an upstream lifecycle snapshot');
    return reply.lifecycle;
  }

  async #receive(signal: AbortSignal): Promise<CompanionMessage> {
    const line = await abortable(this.#replies.read(), signal);
    if (line.done) throw new Error('Companion exited before acknowledging the command');
    return JSON.parse(line.value);
  }

  async sample(): Promise<ProcessSample> {
    const proc = `/proc/${this.#child.pid}`;
    const [stat, status] = await Promise.all([
      Deno.readTextFile(`${proc}/stat`),
      Deno.readTextFile(`${proc}/status`),
    ]);
    // stat fields 14 and 15 follow a parenthesized comm that may itself contain spaces.
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    const cpuTicks = Number(fields[11]) + Number(fields[12]);
    const rssKiB = Number(/^VmRSS:\s+(\d+)\s+kB$/m.exec(status)?.[1]);
    if (!Number.isFinite(cpuTicks) || !Number.isFinite(rssKiB)) {
      throw new Error('Missing companion procfs counters');
    }
    let openFileDescriptors = 0;
    for await (const _entry of Deno.readDir(`${proc}/fd`)) openFileDescriptors++;
    return { atMs: performance.now(), rssBytes: rssKiB * 1024, cpuTicks, openFileDescriptors };
  }

  async stop(): Promise<Lifecycle> {
    const signal = AbortSignal.timeout(CLEANUP_MS);
    try {
      await abortable(this.#commands.close(), signal);
      // A cancelled phase may have sent a snapshot request before aborting.
      let reply = await this.#receive(signal);
      while (reply.kind !== 'stopped') reply = await this.#receive(signal);
      const status = await abortable(this.#child.status, signal);
      if (!status.success || !reply.lifecycle.upstreamStopped) {
        throw new Error('Companion did not stop cleanly');
      }
      return reply.lifecycle;
    } finally {
      if (!this.#exited) this.#child.kill('SIGKILL');
      await abortable(this.#child.status, AbortSignal.timeout(CLEANUP_MS));
      await this.#replies.cancel();
    }
  }
}

/** Resolve Linux clock ticks per second to convert procfs CPU counts. */
export async function cpuTicksPerSecond(signal: AbortSignal): Promise<number> {
  const result = await new Deno.Command('getconf', {
    args: ['CLK_TCK'],
    signal,
  }).output();
  const ticks = Number(new TextDecoder().decode(result.stdout));
  if (!result.success || !Number.isFinite(ticks) || ticks <= 0) {
    throw new Error('Could not resolve Linux CPU clock rate');
  }
  return ticks;
}

/** Sum logical file sizes in the owned data directory, including LMDB and segment files. */
export async function storageBytes(directory: string): Promise<number> {
  let bytes = 0;
  for await (const entry of Deno.readDir(directory)) {
    const path = join(directory, entry.name);
    if (entry.isFile) bytes += (await Deno.stat(path)).size;
    if (entry.isDirectory) bytes += await storageBytes(path);
  }
  return bytes;
}
