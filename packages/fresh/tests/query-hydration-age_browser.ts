import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

const PLAYWRIGHT_SESSION = 'netscript-fresh-query-hydration-age';
const FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/query-hydration-age-browser/', import.meta.url),
);
const HYDRATION_NOW = 1_775_000_000_000;

Deno.test({
  name: 'browser: public query wrapper preserves old and fresh server snapshot ages',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const baseUrl = `http://127.0.0.1:${port}/`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-query-age-browser-' });
    const vite = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '-A',
        'npm:vite@7.2.2',
        '--config',
        'vite.config.ts',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort',
      ],
      cwd: FIXTURE_ROOT,
      stdout: 'null',
      stderr: 'null',
    }).spawn();

    try {
      await waitForServer(baseUrl, vite);
      await runPlaywright([
        '-s',
        PLAYWRIGHT_SESSION,
        'open',
        `${baseUrl}?hydrationNow=${HYDRATION_NOW}`,
      ], playwrightOutput);
      const result = await runPlaywright([
        '--raw',
        '-s',
        PLAYWRIGHT_SESSION,
        'run-code',
        `async page => {
          await page.addInitScript(now => {
            Date.now = () => now;
          }, ${HYDRATION_NOW});

          async function observe(mode) {
            await page.goto(
              ${JSON.stringify(baseUrl)} +
                '?mode=' + mode + '&hydrationNow=' + ${HYDRATION_NOW},
            );
            const root = page.locator('main[data-hydrated="true"]');
            await root.waitFor();
            if (mode === 'old') {
              await page.waitForFunction(() =>
                document.querySelector('main')?.getAttribute('data-query-count') === '1'
              );
            } else {
              await page.waitForTimeout(250);
            }
            return {
              snapshot: await page.locator('#snapshot').textContent(),
              count: Number(await root.getAttribute('data-query-count')),
              fetching: await root.getAttribute('data-fetching'),
              refetching: await root.getAttribute('data-refetching'),
              updatedAt: Number(await root.getAttribute('data-updated-at')),
              expectedUpdatedAt: Number(await root.getAttribute('data-expected-updated-at')),
            };
          }

          return {
            old: await observe('old'),
            fresh: await observe('fresh'),
          };
        }`,
      ], playwrightOutput);
      const evidence = JSON.parse(result.trim()) as {
        readonly old: Observation;
        readonly fresh: Observation;
      };

      assertEquals(evidence.old, {
        snapshot: 'server snapshot',
        count: 1,
        fetching: 'true',
        refetching: 'true',
        updatedAt: HYDRATION_NOW - 60_000,
        expectedUpdatedAt: HYDRATION_NOW - 60_000,
      });
      assertEquals(evidence.fresh, {
        snapshot: 'server snapshot',
        count: 0,
        fetching: 'false',
        refetching: 'false',
        updatedAt: HYDRATION_NOW,
        expectedUpdatedAt: HYDRATION_NOW,
      });
    } finally {
      await runPlaywright(['-s', PLAYWRIGHT_SESSION, 'close'], playwrightOutput, false);
      try {
        vite.kill('SIGTERM');
      } catch {
        // The fixture process already stopped; cleanup can continue.
      }
      await vite.status;
      await Deno.remove(playwrightOutput, { recursive: true });
    }
  },
});

interface Observation {
  readonly snapshot: string | null;
  readonly count: number;
  readonly fetching: string | null;
  readonly refetching: string | null;
  readonly updatedAt: number;
  readonly expectedUpdatedAt: number;
}

async function runPlaywright(
  args: readonly string[],
  cwd: string,
  check = true,
): Promise<string> {
  const output = await new Deno.Command('playwright-cli', {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);

  if (check && (!output.success || stdout.startsWith('### Error'))) {
    throw new Error(
      `playwright-cli ${args.join(' ')} failed (${output.code})\n${stdout}\n${stderr}`,
    );
  }

  return stdout;
}

function reservePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
}

async function waitForServer(url: string, child: Deno.ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const status = await Promise.race([
      child.status,
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 50)),
    ]);
    if (status) throw new Error(`Vite fixture exited before startup (${status.code})`);

    try {
      const response = await fetch(`${url}?hydrationNow=${HYDRATION_NOW}`);
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The fixture is still starting.
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}
