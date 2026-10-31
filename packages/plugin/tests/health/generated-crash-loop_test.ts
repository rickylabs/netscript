import { assertEquals, assertFalse, assertLess } from '@std/assert';
import { delay } from 'jsr:@std/async@^1/delay';
import { fromFileUrl, toFileUrl } from '@std/path';
import { CHILD_CRASH_LOOP_THRESHOLD, type ChildHealthSnapshot } from '../../src/health/mod.ts';
import { runtimeGlueStub as sagas } from '../../../../plugins/sagas/src/adapter/resources/glue/runtime.stub.ts';
import { runtimeGlueStub as triggers } from '../../../../plugins/triggers/src/adapter/resources/glue/runtime.stub.ts';

const PLUGINS = { sagas, triggers } as const;
const CONFIG = fromFileUrl(new URL('../../../../deno.json', import.meta.url));
const DEADLINE_MS = 15_000;
const SECRET = 'secret-token=registry-password';

class GeneratedChild {
  readonly process: Deno.ChildProcess;
  readonly #reader: ReadableStreamDefaultReader<Uint8Array>;
  readonly #drained: Promise<void>;
  #diagnostic = '';
  #exited = false;

  constructor(root: string, watch = false) {
    this.process = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--frozen',
        '--no-check',
        '--allow-all',
        '--unstable-kv',
        ...(watch ? ['--watch'] : []),
        '--config',
        CONFIG,
        `${root}/runtime.ts`,
      ],
      cwd: root,
      env: {
        PORT: '0',
        NO_COLOR: '1',
        CACHE_PROVIDER: 'denokv',
        KV_URL: `${root}/runtime.kv`,
        DENO_KV_URL: `${root}/runtime.kv`,
        NETSCRIPT_SAGA_KV_PATH: `${root}/runtime.kv`,
        NETSCRIPT_TRIGGER_KV_PATH: `${root}/runtime.kv`,
        NETSCRIPT_PROJECT_ROOT: root,
        SAGAS_REGISTRY_MODULE: toFileUrl(`${root}/registry.ts`).href,
        NETSCRIPT_TRIGGER_REGISTRY_MODULE: toFileUrl(`${root}/registry.ts`).href,
        NETSCRIPT_SAGA_PROJECTION: 'kv',
      },
      stdin: 'null',
      stdout: 'null',
      stderr: 'piped',
    }).spawn();
    this.#reader = this.process.stderr.getReader();
    this.#drained = this.drain();
  }

  private async drain(): Promise<void> {
    try {
      while (true) {
        const chunk = await this.#reader.read();
        if (chunk.done) break;
        this.#diagnostic = (this.#diagnostic + new TextDecoder().decode(chunk.value)).slice(
          -32_768,
        );
      }
    } finally {
      this.#exited = true;
    }
  }

  async diagnostic(pattern: RegExp): Promise<string> {
    const started = Date.now();
    while (!pattern.test(this.#diagnostic)) {
      if (this.#exited || Date.now() - started >= DEADLINE_MS) {
        throw new Error(`Generated child diagnostic deadline: ${this.#diagnostic}`);
      }
      await delay(10);
    }
    return this.#diagnostic;
  }

  async health(state: ChildHealthSnapshot['state']): Promise<ChildHealthSnapshot> {
    await this.diagnostic(/Listening on http:\/\/[^:]+:(\d+)/);
    const started = Date.now();
    let payload: ChildHealthSnapshot | undefined;
    while (Date.now() - started < DEADLINE_MS) {
      const port = [...this.#diagnostic.matchAll(/Listening on http:\/\/[^:]+:(\d+)/g)].at(-1)?.[1];
      let response: Response | undefined;
      try {
        response = await fetch(`http://127.0.0.1:${port}/health`, {
          signal: AbortSignal.timeout(1_000),
        });
      } catch {
        // A watch reload can replace the listener while its startup log is being consumed.
      }
      if (response) {
        payload = await response.json();
        if (payload?.state === state) {
          assertEquals(response.status, state === 'ready' ? 200 : 503);
          assertFalse(JSON.stringify(payload).includes(SECRET));
          return payload;
        }
      }
      if (this.#exited) break;
      await delay(10);
    }
    throw new Error(`Expected ${state}, got ${JSON.stringify(payload)}: ${this.#diagnostic}`);
  }

  resetDiagnostics(): void {
    this.#diagnostic = '';
  }

  async close(): Promise<void> {
    try {
      this.process.kill('SIGKILL');
    } catch (cause) {
      if (!(cause instanceof Deno.errors.NotFound) && !(cause instanceof TypeError)) throw cause;
    }
    await this.#drained;
    this.#reader.releaseLock();
    await this.process.output();
  }
}

async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Generated child exceeded deadline.')),
          DEADLINE_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function registry(root: string, failed: boolean, revision = 0): Promise<void> {
  await Deno.writeTextFile(
    `${root}/registry.ts`,
    `// revision ${revision}\n` +
      (failed
        ? `throw new Error('${SECRET}');\nexport const definitions = [];\n`
        : 'export const definitions = [];\n'),
  );
}

async function setup(plugin: keyof typeof PLUGINS, failed = true): Promise<string> {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(`${root}/runtime.ts`, PLUGINS[plugin].source);
  await registry(root, failed);
  return root;
}

for (const plugin of Object.keys(PLUGINS) as (keyof typeof PLUGINS)[]) {
  Deno.test(`generated ${plugin} process crash loop reaches the documented threshold`, async () => {
    const root = await setup(plugin);
    const started = Date.now();
    try {
      for (let restart = 0; restart <= CHILD_CRASH_LOOP_THRESHOLD.restarts; restart++) {
        const child = new GeneratedChild(root);
        try {
          const state = restart === CHILD_CRASH_LOOP_THRESHOLD.restarts
            ? 'crash-looping'
            : 'failed';
          const payload = await child.health(state);
          assertEquals(payload.restartCount, restart);
          assertEquals(payload.dependencyReady, false);
          assertEquals(
            payload.lastFatalError?.message,
            'Background child failed (details redacted).',
          );
          assertEquals(typeof payload.lastFatalError?.timestamp, 'number');
          assertEquals((await bounded(child.process.status)).code, 1);
        } finally {
          await child.close();
        }
      }
      assertLess(Date.now() - started, CHILD_CRASH_LOOP_THRESHOLD.windowMs);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  Deno.test(`generated ${plugin} one failed process then a stable restart stays ready`, async () => {
    const root = await setup(plugin);
    try {
      const failed = new GeneratedChild(root);
      try {
        await failed.health('failed');
        assertEquals((await bounded(failed.process.status)).code, 1);
      } finally {
        await failed.close();
      }
      await registry(root, false);
      const stable = new GeneratedChild(root);
      try {
        const payload = await stable.health('ready');
        assertEquals(payload.restartCount, 1);
        assertEquals(payload.registryReady, true);
        assertEquals(payload.dependencyReady, true);
        stable.process.kill('SIGTERM');
        assertEquals((await bounded(stable.process.status)).code, 0);
      } finally {
        await stable.close();
      }
      const clean = new GeneratedChild(root);
      try {
        assertEquals((await clean.health('ready')).restartCount, 1);
      } finally {
        await clean.close();
      }
      const replaced = new GeneratedChild(root);
      try {
        // SIGKILL above bypassed graceful shutdown; the new OS process counts it once.
        assertEquals((await replaced.health('ready')).restartCount, 2);
      } finally {
        await replaced.close();
      }
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  Deno.test(`generated ${plugin} failed watch reloads latch while healthy reloads stay ready`, async () => {
    for (const failing of [false, true]) {
      const root = await setup(plugin, failing);
      const child = new GeneratedChild(root, true);
      const started = Date.now();
      try {
        const processId = child.process.pid;
        for (let reload = 0; reload <= CHILD_CRASH_LOOP_THRESHOLD.restarts; reload++) {
          const state = failing
            ? reload === CHILD_CRASH_LOOP_THRESHOLD.restarts ? 'crash-looping' : 'failed'
            : 'ready';
          const payload = await child.health(state);
          assertEquals(payload.restartCount, failing ? reload : 0);
          const history = JSON.parse(
            await Deno.readTextFile(`${root}/.data/child-health/${plugin}.json`),
          );
          assertEquals(history.processId, processId);
          if (reload === CHILD_CRASH_LOOP_THRESHOLD.restarts) break;
          if (failing) await child.diagnostic(/Process failed/);
          child.resetDiagnostics();
          await registry(root, failing, reload + 1);
        }
        assertLess(Date.now() - started, CHILD_CRASH_LOOP_THRESHOLD.windowMs);
      } finally {
        await child.close();
        await Deno.remove(root, { recursive: true });
      }
    }
  });
}
