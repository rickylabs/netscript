import { assertEquals, assertThrows } from '@std/assert';
import { fromFileUrl } from '@std/path';
import {
  reservePort,
  runPlaywright,
  startLockedVite,
  stopVite,
  waitForServer,
} from './_fixtures/browser-runtime.ts';
import { DEFER_BOUNDARY_NAME } from './fixtures/defer-client-navigation-browser/app.tsx';

const PLAYWRIGHT_SESSION = 'netscript-fresh-defer-navigation';
const FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/defer-client-navigation-browser/', import.meta.url),
);

function assertExactlyOneBoundarySwap(count: number): void {
  assertEquals(count, 1, 'Expected the named deferred boundary to swap exactly once');
}

Deno.test({
  name: 'browser: cache-miss defer requests its partial and swaps its named boundary exactly once',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/`;
    const partialUrl = `http://127.0.0.1:${port}/partials/deferred/panel`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-defer-browser-' });
    const vite = startLockedVite(FIXTURE_ROOT, port);

    try {
      await waitForServer(url, vite);
      await runPlaywright(['-s', PLAYWRIGHT_SESSION, 'open', url], playwrightOutput);
      const result = await runPlaywright([
        '--raw',
        '-s',
        PLAYWRIGHT_SESSION,
        'run-code',
        `async page => {
          const runtimeErrors = [];
          const partialRequests = [];
          let releasePartial;
          const partialHeld = new Promise(resolve => releasePartial = resolve);

          page.on('pageerror', error => runtimeErrors.push(String(error)));
          page.on('console', message => {
            if (message.type() === 'error') runtimeErrors.push(message.text());
          });
          await page.route(${JSON.stringify(`${partialUrl}*`)}, async route => {
            partialRequests.push(route.request().url());
            await partialHeld;
            await route.continue();
          });

          await page.goto(${JSON.stringify(url)});
          await page.waitForFunction(() => history.state?.fClientNav === true);
          const clickPromise = page.getByRole('link', { name: 'Open deferred panel' }).click();
          await page.locator(
            ${
          JSON.stringify(
            `[data-defer-boundary="${DEFER_BOUNDARY_NAME}"][data-defer-state="fallback"]`,
          )
        }
          ).waitFor();

          await page.evaluate(boundaryName => {
            const states = [];
            const record = () => {
              const current = document.querySelector(
                '[data-defer-boundary="' + boundaryName + '"]',
              )?.getAttribute('data-defer-state');
              if (current && states.at(-1) !== current) states.push(current);
            };
            record();
            const observer = new MutationObserver(record);
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });
            globalThis.__deferBoundaryProbe = { states, observer };
          }, ${JSON.stringify(DEFER_BOUNDARY_NAME)});

          const partialResponsePromise = page.waitForResponse(response =>
            response.url().startsWith(${JSON.stringify(partialUrl)})
          );
          releasePartial();
          const partialResponse = await partialResponsePromise;
          await clickPromise;
          await page.getByRole('heading', { name: 'Deferred panel loaded' }).waitFor();
          await page.waitForTimeout(50);

          const statesBeforePlant = await page.evaluate(() => [
            ...globalThis.__deferBoundaryProbe.states,
          ]);
          await page.evaluate(boundaryName => {
            const current = document.querySelector(
              '[data-defer-boundary="' + boundaryName + '"]',
            );
            const planted = document.createElement('section');
            planted.dataset.deferBoundary = boundaryName;
            planted.dataset.deferState = 'planted-double-swap';
            current?.replaceWith(planted);
          }, ${JSON.stringify(DEFER_BOUNDARY_NAME)});
          await page.waitForFunction(() =>
            globalThis.__deferBoundaryProbe.states.includes('planted-double-swap')
          );
          const statesAfterPlant = await page.evaluate(() => {
            globalThis.__deferBoundaryProbe.observer.disconnect();
            return [...globalThis.__deferBoundaryProbe.states];
          });

          return {
            partialRequests,
            partialStatus: partialResponse.status(),
            statesBeforePlant,
            statesAfterPlant,
            runtimeErrors,
          };
        }`,
      ], playwrightOutput);
      const evidence = JSON.parse(result.trim()) as {
        readonly partialRequests: readonly string[];
        readonly partialStatus: number;
        readonly statesBeforePlant: readonly string[];
        readonly statesAfterPlant: readonly string[];
        readonly runtimeErrors: readonly string[];
      };

      assertEquals(evidence.partialRequests.length, 1);
      assertEquals(
        new URL(evidence.partialRequests[0]).pathname,
        '/partials/deferred/panel',
      );
      assertEquals(evidence.partialStatus, 200);
      assertEquals(evidence.statesBeforePlant, ['fallback', 'loaded']);
      assertExactlyOneBoundarySwap(evidence.statesBeforePlant.length - 1);
      assertEquals(evidence.statesAfterPlant, ['fallback', 'loaded', 'planted-double-swap']);
      assertThrows(
        () => assertExactlyOneBoundarySwap(evidence.statesAfterPlant.length - 1),
        Error,
        'Expected the named deferred boundary to swap exactly once',
      );
      assertEquals(evidence.runtimeErrors, []);
    } finally {
      await runPlaywright(['-s', PLAYWRIGHT_SESSION, 'close'], playwrightOutput, false);
      await stopVite(vite);
      await Deno.remove(playwrightOutput, { recursive: true });
    }
  },
});
