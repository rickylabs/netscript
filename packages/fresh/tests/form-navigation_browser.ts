import { assert, assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
const PLAYWRIGHT_SESSION = 'netscript-fresh-form-navigation';
const ROUTE_BINDING_SESSION = 'netscript-fresh-route-binding';
const PARTIAL_NAVIGATION_SESSION = 'netscript-fresh-partial-navigation';
const FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/form-navigation-browser/', import.meta.url),
);
const ROUTE_BINDING_FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/route-binding-browser/', import.meta.url),
);
const PARTIAL_NAVIGATION_FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/partial-navigation-browser/', import.meta.url),
);
interface BarrierState {
  readonly arrived: number;
  readonly released: boolean;
  readonly completed: number;
  readonly cancelled: number;
}
Deno.test({
  name: 'browser: document form redirect beats inherited body client nav without runtime errors',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-form-browser-' });
    const vite = spawnVite(FIXTURE_ROOT, port, 'null');
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
          page.on('pageerror', error => runtimeErrors.push(String(error)));
          page.on('console', message => {
            if (message.type() === 'error') runtimeErrors.push(message.text());
          });
          await page.goto(${JSON.stringify(url)});
          await page.waitForFunction(() => history.state?.fClientNav === true);
          const documentForm = page.locator('#document-form');
          const clientForm = page.locator('#client-form');
          const documentAttr = await documentForm.getAttribute('f-client-nav');
          const clientAttr = await clientForm.getAttribute('f-client-nav');
          await page.evaluate(() => globalThis.__formNavigationSentinel = 'preserved');
          await page.getByRole('button', { name: 'Validate client' }).click();
          await page.getByRole('alert').waitFor();
          const sentinel = await page.evaluate(() => globalThis.__formNavigationSentinel);
          await page.getByRole('button', { name: 'Create redirect' }).click();
          await page.waitForURL('**/success');
          await page.getByRole('heading', { name: 'Redirect completed' }).waitFor();
          return {
            documentAttr,
            clientAttr,
            sentinel,
            runtimeErrors,
            finalUrl: page.url(),
          };
        }`,
      ], playwrightOutput);
      const evidence = JSON.parse(result.trim()) as {
        readonly documentAttr: string | null;
        readonly clientAttr: string | null;
        readonly sentinel: string | null;
        readonly runtimeErrors: readonly string[];
        readonly finalUrl: string;
      };
      assertEquals(evidence.documentAttr, 'false');
      assertEquals(evidence.clientAttr, null);
      assertEquals(evidence.sentinel, 'preserved');
      assertEquals(evidence.runtimeErrors, []);
      assertEquals(evidence.finalUrl, `http://127.0.0.1:${port}/success`);
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
Deno.test({
  name: 'browser: ordered partial navigation drains stale A/B bodies and keeps final A',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/a`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-partial-browser-' });
    const vite = spawnVite(PARTIAL_NAVIGATION_FIXTURE_ROOT, port, 'piped');
    const viteStatus = vite.status;
    const viteStdoutPromise = new Response(vite.stdout).text();
    const viteStderrPromise = new Response(vite.stderr).text();
    let result = '';
    let executionError: unknown;
    try {
      await waitForServer(new URL('/control/health', url).href, vite);
      await runPlaywright(['-s', PARTIAL_NAVIGATION_SESSION, 'open', url], playwrightOutput);
      result = await runPlaywright([
        '--raw',
        '-s',
        PARTIAL_NAVIGATION_SESSION,
        'run-code',
        `async page => {
          const pageErrors = [];
          const consoleErrors = [];
          const consoleWarnings = [];
          const requestFailures = [];
          const partialResponses = [];
          const markerResponseBodies = [];
          const staleNetwork = [];
          let traceStaleNetwork = false;
          let documentRequests = 0;
          page.on('pageerror', error => pageErrors.push(String(error)));
          page.on('console', message => {
            if (message.type() === 'error') consoleErrors.push(message.text());
            if (message.type() === 'warning') consoleWarnings.push(message.text());
          });
          page.on('request', request => {
            if (traceStaleNetwork) staleNetwork.push({ kind: 'request', url: request.url() });
            if (request.resourceType() === 'document') documentRequests++;
          });
          page.on('requestfailed', request => requestFailures.push({
            url: request.url(),
            error: request.failure()?.errorText ?? 'unknown',
          }));
          page.on('response', response => {
            if (traceStaleNetwork) staleNetwork.push({ kind: 'response', url: response.url() });
            const responseUrl = response.url();
            if (response.request().resourceType() === 'document' || responseUrl.includes('phase=mount')) markerResponseBodies.push(response.text());
            if (response.url().includes('fresh-partial=true')) {
              partialResponses.push({ url: response.url(), status: response.status() });
            }
          });
          const barrierArrived = name => page.waitForFunction(async barrier => {
            const state = await (await fetch('/control/state')).json();
            return state[barrier].arrived === 1;
          }, name);
          const markRegionMount = name => page.evaluate(marker => {
            const region = document.querySelector('#region-content');
            const remounted = region.__keyedPartialProbe === undefined;
            region.__keyedPartialProbe = marker;
            return remounted;
          }, name);
          await page.goto(${JSON.stringify(url)});
          await page.waitForFunction(() => globalThis.__partialNavigation != null);
          await page.evaluate(() => globalThis.__sameDocumentSentinel = 'preserved');
          const colonHtml = await page.evaluate(async () => await (await fetch('/colon-marker')).text());
          const colonMarker = colonHtml.match(/<!--(frsh:partial:colon:probe:0:colon_probe)-->/)?.[1] ?? null;
          await markRegionMount('region-a');
          await page.getByRole('link', { name: 'Navigate to B' }).click();
          await page.getByRole('heading', { name: 'Page B mount' }).waitFor();
          const remountB = await markRegionMount('region-b');
          await page.getByRole('button', { name: 'Update current region' }).click();
          await page.waitForFunction(() => document.querySelector('#region-content')?.textContent === 'b-mount-updated');
          const bRegion = await page.locator('#region-content').textContent();
          await markRegionMount('region-b-updated');
          await page.getByRole('link', { name: 'Navigate to A' }).click();
          await page.getByRole('heading', { name: 'Page A mount' }).waitFor();
          const remountA2 = await markRegionMount('region-a');
          const dynamicMarkers = (await Promise.all(markerResponseBodies)).map(html =>
            html.match(/<!--(frsh:partial:region-[ab]:0:region-[ab])-->/)?.[1] ?? null
          );
          await page.getByRole('button', { name: 'Update current region' }).click();
          await page.waitForFunction(() => document.querySelector('#region-content')?.textContent === 'a-mount-updated');
          const aRegion = await page.locator('#region-content').textContent();
          traceStaleNetwork = true;
          const oldRegionResponsePromise = page.waitForResponse(response =>
            response.url().includes('hold=old-region')
          );
          await page.getByRole('button', { name: 'Start stale A region' }).click();
          await barrierArrived('old-region');
          const staleBResponsePromise = page.waitForResponse(response =>
            response.url().includes('hold=stale-b')
          );
          await page.getByRole('link', { name: 'Start stale B' }).click();
          await barrierArrived('stale-b');
          await page.evaluate(() => globalThis.__partialNavigation.navigate('/a?phase=final'));
          await page.getByRole('heading', { name: 'Page A final' }).waitFor();
          await page.getByRole('button', { name: 'Update current region' }).click();
          await page.waitForFunction(() => document.querySelector('#region-content')?.textContent === 'a-final-updated');
          const eventsAtFinal = await page.evaluate(() => [...globalThis.__partialNavigationEvents]);
          await page.evaluate(() => {
            globalThis.__postFinalHeadings = [];
            globalThis.__postFinalHeadingObserver = new MutationObserver(() => {
              const heading = document.querySelector('h1')?.textContent;
              if (heading != null) globalThis.__postFinalHeadings.push(heading);
            });
            globalThis.__postFinalHeadingObserver.observe(document.documentElement, {
              childList: true, subtree: true, characterData: true,
            });
          });
          await page.evaluate(async () => {
            await Promise.all([
              fetch('/control/release/old-region', { method: 'POST' }),
              fetch('/control/release/stale-b', { method: 'POST' }),
            ]);
          });
          const staleResponses = await Promise.all([oldRegionResponsePromise, staleBResponsePromise]);
          const [oldRegionResponse, staleBResponse] = staleResponses;
          await Promise.all([oldRegionResponse.finished(), staleBResponse.finished()]);
          await page.waitForFunction(async () => {
            const state = await (await fetch('/control/state')).json();
            return state['old-region'].completed === 1 && state['stale-b'].completed === 1;
          });
          await page.evaluate(() => new Promise(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          ));
          traceStaleNetwork = false;
          const postFinalHeadings = await page.evaluate(() => {
            globalThis.__postFinalHeadingObserver.disconnect();
            return [...globalThis.__postFinalHeadings];
          });
          return {
            finalUrl: page.url(),
            title: await page.title(),
            heading: await page.locator('h1').textContent(),
            regionContent: await page.locator('#region-content').textContent(),
            dynamicMarkers,
            dynamicRemounts: [remountB, remountA2],
            colonMarker,
            bRegion,
            aRegion,
            routeEvents: await page.evaluate(() => [...globalThis.__partialNavigationEvents]),
            eventsAtFinal,
            postFinalHeadings,
            sentinel: await page.evaluate(() => globalThis.__sameDocumentSentinel),
            documentRequests,
            partialResponses,
            staleNetwork,
            staleStatuses: [oldRegionResponse.status(), staleBResponse.status()],
            barrierState: await page.evaluate(async () => await (await fetch('/control/state')).json()),
            requestFailures,
            pageErrors,
            consoleErrors,
            consoleWarnings,
            overlayCount: await page.locator('vite-error-overlay').count(),
          };
        }`,
      ], playwrightOutput);
    } catch (error) {
      executionError = error;
    } finally {
      try {
        await releaseAndDrainPartialBarriers(playwrightOutput);
      } catch (error) {
        executionError ??= error;
      }
      await runPlaywright(['-s', PARTIAL_NAVIGATION_SESSION, 'close'], playwrightOutput, false);
      try {
        vite.kill('SIGTERM');
      } catch {
        // The fixture process already stopped; cleanup can continue.
      }
    }
    const status = await viteStatus;
    const viteStdout = await viteStdoutPromise;
    const viteStderr = await viteStderrPromise;
    await Deno.remove(playwrightOutput, { recursive: true });
    if (executionError !== undefined) {
      throw new Error(
        `Partial-navigation fixture failed; Vite status ${status.code}\n${viteStdout}\n${viteStderr}`,
        { cause: executionError },
      );
    }
    const evidence = JSON.parse(result.trim()) as {
      readonly [key: string]: unknown;
      readonly routeEvents: readonly string[];
      readonly postFinalHeadings: readonly string[];
      readonly partialResponses: readonly { readonly url: string; readonly status: number }[];
      readonly staleNetwork: readonly { readonly kind: string; readonly url: string }[];
      readonly barrierState: Readonly<Record<string, BarrierState>>;
    };
    console.log(JSON.stringify({ ...evidence, viteStdout, viteStderr }));
    assertEquals(evidence.finalUrl, `http://127.0.0.1:${port}/a?phase=final`);
    assertEquals(evidence.title, 'A final');
    assertEquals(evidence.heading, 'Page A final');
    assertEquals(evidence.regionContent, 'a-final-updated');
    assertEquals(evidence.dynamicMarkers, [
      'frsh:partial:region-a:0:region-a',
      'frsh:partial:region-b:0:region-b',
      'frsh:partial:region-a:0:region-a',
    ]);
    assertEquals(evidence.dynamicRemounts, [true, true]);
    assertEquals(evidence.colonMarker, 'frsh:partial:colon:probe:0:colon_probe');
    assertEquals(evidence.bRegion, 'b-mount-updated');
    assertEquals(evidence.aRegion, 'a-mount-updated');
    assertEquals(evidence.routeEvents, evidence.eventsAtFinal);
    assertEquals(evidence.routeEvents.at(-1), 'push:/a?phase=final');
    assertEquals(evidence.postFinalHeadings.some((heading) => heading.includes('Page B')), false);
    assertEquals(evidence.sentinel, 'preserved');
    assertEquals(evidence.documentRequests, 1);
    assert(evidence.partialResponses.length >= 7);
    assertEquals(evidence.partialResponses.every(({ status }) => status === 200), true);
    const heldNetwork = evidence.staleNetwork.filter(({ url }) => url.includes('hold='));
    assertEquals(heldNetwork.filter(({ kind }) => kind === 'request').length, 2);
    assertEquals(heldNetwork.filter(({ kind }) => kind === 'response').length, 2);
    assertEquals(
      heldNetwork.every(({ url }) => new URL(url).searchParams.get('fresh-partial') === 'true'),
      true,
    );
    assertEquals(evidence.staleStatuses, [200, 200]);
    assertEquals(evidence.barrierState['old-region'], {
      arrived: 1,
      released: true,
      completed: 1,
      cancelled: 0,
    });
    assertEquals(evidence.barrierState['stale-b'], {
      arrived: 1,
      released: true,
      completed: 1,
      cancelled: 0,
    });
    assertEquals(evidence.requestFailures, []);
    assertEquals(evidence.pageErrors, []);
    assertEquals(evidence.consoleErrors, []);
    assertEquals(evidence.consoleWarnings, []);
    assertEquals(evidence.overlayCount, 0);
    assertEquals(/AbortSignal|signal has been aborted|vite-error-overlay/i.test(viteStdout), false);
    assertEquals(/AbortSignal|signal has been aborted|vite-error-overlay/i.test(viteStderr), false);
  },
});
Deno.test({
  name: 'browser: generated Form-C dynamic route resolves path during fresh partial navigation',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-route-browser-' });
    const vite = spawnVite(ROUTE_BINDING_FIXTURE_ROOT, port, 'null');
    try {
      await waitForServer(url, vite);
      await runPlaywright(['-s', ROUTE_BINDING_SESSION, 'open', url], playwrightOutput);
      const result = await runPlaywright([
        '--raw',
        '-s',
        ROUTE_BINDING_SESSION,
        'run-code',
        `async page => {
          const runtimeErrors = [];
          page.on('pageerror', error => runtimeErrors.push(String(error)));
          page.on('console', message => {
            if (message.type() === 'error') runtimeErrors.push(message.text());
          });
          await page.goto(${JSON.stringify(url)});
          await page.waitForFunction(() => history.state?.fClientNav === true);
          const partialResponsePromise = page.waitForResponse(response => {
            const responseUrl = response.url();
            return responseUrl.includes('/orders/order-42?') &&
              responseUrl.includes('fresh-partial=true');
          });
          await page.getByRole('link', { name: 'Load order 42' }).click();
          const partialResponse = await partialResponsePromise;
          const partialStatus = partialResponse.status();
          let orderId = null;
          let selfHref = null;
          if (partialStatus === 200) {
            await page.locator('#order-id').waitFor();
            orderId = await page.locator('#order-id').textContent();
            selfHref = await page.locator('#order-self-link').getAttribute('href');
          }
          return {
            partialStatus,
            partialUrl: partialResponse.url(),
            orderId,
            selfHref,
            runtimeErrors,
            finalUrl: page.url(),
          };
        }`,
      ], playwrightOutput);
      const evidence = JSON.parse(result.trim()) as {
        readonly partialStatus: number;
        readonly partialUrl: string;
        readonly orderId: string | null;
        readonly selfHref: string | null;
        readonly runtimeErrors: readonly string[];
        readonly finalUrl: string;
      };
      assertEquals(evidence.partialStatus, 200);
      assertEquals(
        new URL(evidence.partialUrl).searchParams.get('fresh-partial'),
        'true',
      );
      assertEquals(evidence.orderId, 'order-42');
      assertEquals(evidence.selfHref, '/orders/order-42');
      assertEquals(evidence.runtimeErrors, []);
      assertEquals(evidence.finalUrl, `http://127.0.0.1:${port}/orders/order-42`);
    } finally {
      await runPlaywright(['-s', ROUTE_BINDING_SESSION, 'close'], playwrightOutput, false);
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
async function releaseAndDrainPartialBarriers(cwd: string): Promise<void> {
  await runPlaywright([
    '--raw',
    '-s',
    PARTIAL_NAVIGATION_SESSION,
    'run-code',
    `async page => {
      await page.evaluate(async () => await Promise.all([
        fetch('/control/release/old-region', { method: 'POST' }),
        fetch('/control/release/stale-b', { method: 'POST' }),
      ]));
      await page.waitForFunction(async () => {
        const state = await (await fetch('/control/state')).json();
        return ['old-region', 'stale-b'].every(name =>
          state[name].released && state[name].completed === state[name].arrived &&
          state[name].cancelled === 0
        );
      });
    }`,
  ], cwd);
}
function spawnVite(
  cwd: string,
  port: number,
  output: 'null' | 'piped',
): Deno.ChildProcess {
  return new Deno.Command(Deno.execPath(), {
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
    cwd,
    stdout: output,
    stderr: output,
  }).spawn();
}
async function waitForServer(url: string, child: Deno.ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const status = await Promise.race([
      child.status,
      new Promise<undefined>((resolve) => setTimeout(resolve, 50)),
    ]);
    if (status) {
      throw new Error(`Vite browser fixture exited before startup (${status.code})`);
    }
    try {
      const response = await fetch(url);
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // The server has not bound its port yet.
    }
  }
  throw new Error('Timed out waiting for the Vite browser fixture');
}
