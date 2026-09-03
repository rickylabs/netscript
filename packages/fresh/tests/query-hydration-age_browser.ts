import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

const PLAYWRIGHT_SESSION = 'netscript-fresh-query-hydration-age';
const FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/query-hydration-age-browser/', import.meta.url),
);
const HYDRATION_NOW = 1_775_000_000_000;
const VITE_STARTUP_TIMEOUT_MS = 60_000;
const VITE_STARTUP_POLL_INTERVAL_MS = 100;
const FIXTURE_OUTPUT_LIMIT = 16_384;
const HYDRATION_EVIDENCE_MARKER = 'query-hydration-evidence:';

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
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    const viteOutput = captureProcessOutput(vite);

    try {
      await waitForServer(baseUrl, vite, viteOutput);
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
            const freshIslandElement = await root.evaluate(element =>
              element.closest('fresh-island, [data-fresh-island]')?.tagName.toLowerCase() ?? null
            );
            const queryClientFound =
              await root.getAttribute('data-query-client-found') === 'true';
            const interactionCount = Number(
              await root.getAttribute('data-interaction-count'),
            );
            await page.getByRole('button', {
              name: 'Prove query island interactivity',
            }).click();
            await page.waitForFunction(expected =>
              document.querySelector('main')?.getAttribute('data-interaction-count') ===
                String(expected), interactionCount + 1
            );
            const islandInteractive = Number(
              await root.getAttribute('data-interaction-count'),
            ) === interactionCount + 1;
            if (mode === 'old') {
              await page.waitForFunction(() =>
                document.querySelector('main')?.getAttribute('data-query-count') === '1'
              );
            } else {
              await page.waitForTimeout(250);
            }
            return {
              hydration: {
                freshIslandElement,
                queryClientFound,
                islandHydrated: await root.getAttribute('data-hydrated') === 'true',
                islandInteractive,
              },
              age: {
                snapshot: await page.locator('#snapshot').textContent(),
                count: Number(await root.getAttribute('data-query-count')),
                fetching: await root.getAttribute('data-fetching'),
                refetching: await root.getAttribute('data-refetching'),
                updatedAt: Number(await root.getAttribute('data-updated-at')),
                expectedUpdatedAt: Number(await root.getAttribute('data-expected-updated-at')),
              },
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

      console.log(`${HYDRATION_EVIDENCE_MARKER}${
        JSON.stringify({
          old: evidence.old.hydration,
          fresh: evidence.fresh.hydration,
        })
      }`);
      assertHydrationEvidence(evidence.old.hydration, 'old');
      assertHydrationEvidence(evidence.fresh.hydration, 'fresh');
      assertEquals(evidence.old.age, {
        snapshot: 'server snapshot',
        count: 1,
        fetching: 'true',
        refetching: 'true',
        updatedAt: HYDRATION_NOW - 60_000,
        expectedUpdatedAt: HYDRATION_NOW - 60_000,
      });
      assertEquals(evidence.fresh.age, {
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
      await viteOutput.done;
      await Deno.remove(playwrightOutput, { recursive: true });
    }
  },
});

interface Observation {
  readonly hydration: HydrationEvidence;
  readonly age: SnapshotAgeEvidence;
}

interface HydrationEvidence {
  readonly freshIslandElement: string | null;
  readonly queryClientFound: boolean;
  readonly islandHydrated: boolean;
  readonly islandInteractive: boolean;
}

interface SnapshotAgeEvidence {
  readonly snapshot: string | null;
  readonly count: number;
  readonly fetching: string | null;
  readonly refetching: string | null;
  readonly updatedAt: number;
  readonly expectedUpdatedAt: number;
}

function assertHydrationEvidence(evidence: HydrationEvidence, mode: string): void {
  assertEquals(evidence.freshIslandElement, 'main', `${mode}: freshIslandElement`);
  assertEquals(evidence.queryClientFound, true, `${mode}: queryClientFound`);
  assertEquals(evidence.islandHydrated, true, `${mode}: islandHydrated`);
  assertEquals(evidence.islandInteractive, true, `${mode}: islandInteractive`);
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

interface ProcessOutputCapture {
  readonly stdout: StreamOutputCapture;
  readonly stderr: StreamOutputCapture;
  readonly done: Promise<void>;
}

interface StreamOutputCapture {
  readonly done: Promise<void>;
  snapshot(): string;
}

async function waitForServer(
  url: string,
  child: Deno.ChildProcess,
  output: ProcessOutputCapture,
): Promise<void> {
  const deadline = performance.now() + VITE_STARTUP_TIMEOUT_MS;

  while (performance.now() < deadline) {
    const remaining = deadline - performance.now();
    const status = await Promise.race([
      child.status,
      new Promise<undefined>((resolve) =>
        setTimeout(
          () => resolve(undefined),
          Math.min(VITE_STARTUP_POLL_INTERVAL_MS, remaining),
        )
      ),
    ]);
    if (status) {
      await output.done;
      throw new Error(
        `Vite fixture exited before startup (${status.code})\n${formatFixtureOutput(output)}`,
      );
    }

    const fetchBudget = deadline - performance.now();
    if (fetchBudget <= 0) break;

    try {
      const response = await fetch(`${url}?hydrationNow=${HYDRATION_NOW}`, {
        signal: AbortSignal.timeout(
          Math.max(1, Math.min(VITE_STARTUP_POLL_INTERVAL_MS, fetchBudget)),
        ),
      });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The fixture is still starting.
    }
  }

  throw new Error(
    `Timed out waiting ${VITE_STARTUP_TIMEOUT_MS} ms for ${url}\n${formatFixtureOutput(output)}`,
  );
}

function captureProcessOutput(child: Deno.ChildProcess): ProcessOutputCapture {
  const stdout = captureStreamOutput(child.stdout);
  const stderr = captureStreamOutput(child.stderr);

  return {
    stdout,
    stderr,
    done: Promise.all([stdout.done, stderr.done]).then(() => undefined),
  };
}

function captureStreamOutput(stream: ReadableStream<Uint8Array>): StreamOutputCapture {
  const decoder = new TextDecoder();
  let captured = '';
  let truncated = false;

  const append = (value: string) => {
    captured += value;
    if (captured.length > FIXTURE_OUTPUT_LIMIT) {
      captured = captured.slice(-FIXTURE_OUTPUT_LIMIT);
      truncated = true;
    }
  };

  const done = (async () => {
    try {
      for await (const chunk of stream) {
        append(decoder.decode(chunk, { stream: true }));
      }
      append(decoder.decode());
    } catch (error) {
      append(`\n[fixture output capture failed: ${String(error)}]`);
    }
  })();

  return {
    done,
    snapshot() {
      const prefix = truncated ? `[truncated to last ${FIXTURE_OUTPUT_LIMIT} characters]\n` : '';
      return `${prefix}${captured}`;
    },
  };
}

function formatFixtureOutput(output: ProcessOutputCapture): string {
  return [
    'Fixture stdout:',
    output.stdout.snapshot() || '<empty>',
    'Fixture stderr:',
    output.stderr.snapshot() || '<empty>',
  ].join('\n');
}
