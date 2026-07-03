/**
 * Live {@link ServiceHarness} that boots the committed golden NetScript
 * reference as a subprocess and drives it over HTTP for the conformance gate.
 *
 * Boot picks a free TCP port, spawns `deno run` on the reference entrypoint with
 * `PORT` and a stable `NETSCRIPT_BENCH_KV_PATH`, then polls `/health` until the
 * listener answers. `restart()` stops the current process and launches a fresh
 * one against the *same* KV file, so persisted data survives — exactly the
 * `persistence-across-restart` probe's contract. Every collaborator (command
 * executor, HTTP client) is injected, so the harness carries no hidden I/O.
 *
 * @module
 */

import { dirname } from '@std/path';
import type { BootedService, ServiceHarness } from './deno-http.ts';
import type { CommandExecutor, CommandHandle } from '../../ports/command-executor.ts';
import type { HttpClient } from '../../ports/http-client.ts';

/** Configuration for {@link ReferenceServiceHarness}. */
export interface ReferenceServiceHarnessConfig {
  /** Absolute path to the reference `main.ts` entrypoint. */
  readonly entrypoint: string;
  /** Absolute path to the KV file, held stable across restarts for persistence. */
  readonly kvPath: string;
  /** `deno` invocation prefix (default: `run --allow-all --unstable-kv`). */
  readonly denoArgs?: readonly string[];
  /** Readiness budget in ms (default: the boot `timeoutMs`, else 20s). */
  readonly readinessTimeoutMs?: number;
  /** Health path polled for readiness (default: `/health`). */
  readonly healthPath?: string;
}

/** Dependencies for {@link ReferenceServiceHarness}. */
export interface ReferenceServiceHarnessDeps {
  readonly executor: CommandExecutor;
  readonly http: HttpClient;
  readonly config: ReferenceServiceHarnessConfig;
}

interface RunningProcess {
  readonly handle: CommandHandle;
  readonly baseUrl: string;
}

const DEFAULT_DENO_ARGS = ['run', '--allow-all', '--unstable-kv'] as const;
const DEFAULT_READINESS_MS = 20_000;
const DEFAULT_HEALTH_PATH = '/health';

/** Reserve, then release, an ephemeral TCP port and return it. */
function pickFreePort(): number {
  const listener = Deno.listen({ port: 0 });
  const addr = listener.addr;
  listener.close();
  if (addr.transport !== 'tcp') {
    throw new Error(`expected a tcp listener, got '${addr.transport}'`);
  }
  return addr.port;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** {@link ServiceHarness} backed by the golden reference subprocess. */
export class ReferenceServiceHarness implements ServiceHarness {
  readonly #executor: CommandExecutor;
  readonly #http: HttpClient;
  readonly #config: ReferenceServiceHarnessConfig;

  constructor(deps: ReferenceServiceHarnessDeps) {
    this.#executor = deps.executor;
    this.#http = deps.http;
    this.#config = deps.config;
  }

  async boot(_workdir: string, timeoutMs: number): Promise<BootedService> {
    const budget = this.#config.readinessTimeoutMs ?? timeoutMs ?? DEFAULT_READINESS_MS;
    let current = await this.#launch(budget);

    // A stable handle that always stops the *current* process, even after a
    // restart swaps it out — the runner captures this handle once.
    const handle: CommandHandle = {
      stop: (): Promise<void> => current.handle.stop(),
    };

    return {
      baseUrl: current.baseUrl,
      handle,
      restart: async (): Promise<string> => {
        await current.handle.stop();
        current = await this.#launch(budget);
        return current.baseUrl;
      },
    };
  }

  async #launch(timeoutMs: number): Promise<RunningProcess> {
    const port = pickFreePort();
    const args = [...(this.#config.denoArgs ?? DEFAULT_DENO_ARGS), this.#config.entrypoint];
    const handle = await this.#executor.spawn({
      command: 'deno',
      args,
      cwd: dirname(this.#config.entrypoint),
      env: {
        PORT: String(port),
        NETSCRIPT_BENCH_KV_PATH: this.#config.kvPath,
      },
      timeoutMs,
      stdout: 'null',
      stderr: 'null',
    });
    const baseUrl = `http://127.0.0.1:${port}`;
    await this.#waitHealthy(baseUrl, timeoutMs, handle);
    return { handle, baseUrl };
  }

  async #waitHealthy(baseUrl: string, timeoutMs: number, handle: CommandHandle): Promise<void> {
    const healthPath = this.#config.healthPath ?? DEFAULT_HEALTH_PATH;
    const url = `${baseUrl}${healthPath}`;
    const deadline = Date.now() + Math.max(timeoutMs, DEFAULT_READINESS_MS);
    while (Date.now() < deadline) {
      try {
        const res = await this.#http.request({ method: 'GET', url, timeoutMs: 1_000 });
        if (res.status === 200) return;
      } catch {
        // Listener not accepting connections yet — keep polling.
      }
      await delay(100);
    }
    await handle.stop();
    throw new Error(`reference service was not healthy within ${timeoutMs}ms at ${url}`);
  }
}
