import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

const PLAYWRIGHT_SESSION = 'netscript-fresh-form-navigation';
const ROUTE_BINDING_SESSION = 'netscript-fresh-route-binding';
const SHOWCASE_ISLAND_SESSION = 'netscript-fresh-showcase-island';
const FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/form-navigation-browser/', import.meta.url),
);
const ROUTE_BINDING_FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/route-binding-browser/', import.meta.url),
);

Deno.test({
  name: 'browser: document form redirect beats inherited body client nav without runtime errors',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-form-browser-' });
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
  name: 'browser: generated Form-C dynamic route resolves path during fresh partial navigation',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-route-browser-' });
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
      cwd: ROUTE_BINDING_FIXTURE_ROOT,
      stdout: 'null',
      stderr: 'null',
    }).spawn();

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

Deno.test({
  name: 'browser: definePage hook layout preserves a route-local query island through hydration',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/examples/service`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-island-browser-' });
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
      cwd: ROUTE_BINDING_FIXTURE_ROOT,
      stdout: 'null',
      stderr: 'null',
    }).spawn();

    try {
      await waitForServer(url, vite);
      const servedHtml = await (await fetch(url)).text();
      const directServedHtml = await (
        await fetch(`http://127.0.0.1:${port}/examples/service-direct`)
      ).text();
      const servedEvidence = {
        directFreshIslandMarker: directServedHtml.includes(
          '<!--frsh:island:ServiceShowcaseLab:',
        ),
        directInitialRowReached: directServedHtml.includes(
          'id="service-showcase-row">Server row</p>',
        ),
        freshIslandMarker: servedHtml.includes('<!--frsh:island:ServiceShowcaseLab:'),
        clientBootImport: servedHtml.includes('fresh-island::ServiceShowcaseLab'),
        layerReached: servedHtml.includes('id="service-showcase-layer"'),
        layoutReached: servedHtml.includes('id="service-showcase-layout"'),
        initialRowReached: servedHtml.includes('id="service-showcase-row">Server row</p>'),
      };

      await runPlaywright(
        ['-s', SHOWCASE_ISLAND_SESSION, 'open', 'about:blank'],
        playwrightOutput,
      );
      const result = await runPlaywright([
        '--raw',
        '-s',
        SHOWCASE_ISLAND_SESSION,
        'run-code',
        `async page => {
          const runtimeErrors = [];
          const consoleErrors = [];
          const networkRequestFailures = [];
          const clientRequests = [];
          const clientResponses = [];
          const clientRequestFailures = [];
          const nonSuccessfulResponses = [];
          const isObservedClientAsset = url =>
            url.includes('fresh:client-entry') || url.includes('ServiceShowcaseLab');
          page.on('pageerror', error => runtimeErrors.push(String(error)));
          page.on('console', message => {
            if (message.type() === 'error') {
              const location = message.location();
              runtimeErrors.push(message.text());
              consoleErrors.push({
                text: message.text(),
                url: location.url,
                lineNumber: location.lineNumber,
                columnNumber: location.columnNumber,
              });
            }
          });
          page.on('request', request => {
            if (isObservedClientAsset(request.url())) clientRequests.push(request.url());
          });
          page.on('response', response => {
            const responseUrl = response.url();
            if (response.status() >= 400) {
              nonSuccessfulResponses.push({
                url: responseUrl,
                status: response.status(),
                resourceType: response.request().resourceType(),
              });
            }
            if (isObservedClientAsset(responseUrl)) {
              clientResponses.push({ url: responseUrl, status: response.status() });
            }
          });
          page.on('requestfailed', request => {
            const failure = {
              url: request.url(),
              resourceType: request.resourceType(),
              error: request.failure()?.errorText ?? 'unknown request failure',
            };
            networkRequestFailures.push(failure);
            if (isObservedClientAsset(request.url())) {
              clientRequestFailures.push(failure);
            }
          });
          await page.addInitScript(() => {
            globalThis.__serviceShowcaseIslandModuleLoaded = false;
            globalThis.__serviceShowcaseIslandRenderAttempts = 0;
            globalThis.__serviceShowcaseInnerRenderAttempts = 0;
            globalThis.__serviceShowcaseSingletonClientAttempts = 0;
            globalThis.__serviceShowcaseSingletonClientResolved = false;
            globalThis.__serviceShowcaseHydratedCache = false;
            globalThis.__serviceShowcaseQueryClientHookAttempts = 0;
            globalThis.__serviceShowcaseQueryClientHookResolved = false;
            globalThis.__serviceShowcaseQueryClientMatchesSingleton = false;
            globalThis.__serviceShowcaseQueryClientData = null;
            globalThis.__serviceShowcaseQueryHookAttempts = 0;
            globalThis.__serviceShowcaseQueryHookResolved = false;
            globalThis.__serviceShowcaseHydrationEffectRan = false;
          });
          await page.goto(${JSON.stringify(url)});
          await page.waitForTimeout(500);

          const freshIslandMarker = await page.evaluate(() => {
            const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
            let node = walker.nextNode();
            while (node) {
              if (node.textContent?.startsWith('frsh:island:ServiceShowcaseLab:')) {
                return node.textContent;
              }
              node = walker.nextNode();
            }
            return null;
          });
          const lab = page.locator('#service-showcase-lab');
          const labFound = await lab.count() > 0;
          const beforeClick = labFound
            ? {
              hydrated: await lab.getAttribute('data-hydrated'),
              hydratedCache: await lab.getAttribute('data-hydrated-cache'),
              queryClient: await lab.getAttribute('data-query-client'),
              row: await page.locator('#service-showcase-row').textContent(),
              queryClientData: await page.evaluate(
                () => globalThis.__serviceShowcaseQueryClientData ?? null
              ),
            }
            : null;

          if (labFound) {
            await page.getByRole('button', { name: 'Rename fixture row' }).click();
            await page.waitForTimeout(100);
          }

          const clientExecution = await page.evaluate(() => ({
            moduleLoaded: globalThis.__serviceShowcaseIslandModuleLoaded === true,
            islandRenderAttempts: Number(
              globalThis.__serviceShowcaseIslandRenderAttempts ?? 0
            ),
            innerRenderAttempts: Number(
              globalThis.__serviceShowcaseInnerRenderAttempts ?? 0
            ),
            singletonClientAttempts: Number(
              globalThis.__serviceShowcaseSingletonClientAttempts ?? 0
            ),
            singletonClientResolved:
              globalThis.__serviceShowcaseSingletonClientResolved === true,
            hydratedCache: globalThis.__serviceShowcaseHydratedCache === true,
            queryClientHookAttempts: Number(
              globalThis.__serviceShowcaseQueryClientHookAttempts ?? 0
            ),
            queryClientHookResolved:
              globalThis.__serviceShowcaseQueryClientHookResolved === true,
            queryClientMatchesSingleton:
              globalThis.__serviceShowcaseQueryClientMatchesSingleton === true,
            queryClientData: globalThis.__serviceShowcaseQueryClientData ?? null,
            queryHookAttempts: Number(
              globalThis.__serviceShowcaseQueryHookAttempts ?? 0
            ),
            queryHookResolved: globalThis.__serviceShowcaseQueryHookResolved === true,
            hydrationEffectRan:
              globalThis.__serviceShowcaseHydrationEffectRan === true,
          }));

          return {
            freshIslandMarker,
            labFound,
            beforeClick,
            rowAfterClick: labFound
              ? await page.locator('#service-showcase-row').textContent()
              : null,
            clientExecution,
            clientRequests,
            clientResponses,
            clientRequestFailures,
            nonSuccessfulResponses,
            networkRequestFailures,
            consoleErrors,
            runtimeErrors,
          };
        }`,
      ], playwrightOutput);
      const browserEvidence = JSON.parse(result.trim()) as {
        readonly freshIslandMarker: string | null;
        readonly labFound: boolean;
        readonly beforeClick: {
          readonly hydrated: string | null;
          readonly hydratedCache: string | null;
          readonly queryClient: string | null;
          readonly row: string | null;
          readonly queryClientData: string | null;
        } | null;
        readonly rowAfterClick: string | null;
        readonly clientExecution: {
          readonly moduleLoaded: boolean;
          readonly islandRenderAttempts: number;
          readonly innerRenderAttempts: number;
          readonly singletonClientAttempts: number;
          readonly singletonClientResolved: boolean;
          readonly hydratedCache: boolean;
          readonly queryClientHookAttempts: number;
          readonly queryClientHookResolved: boolean;
          readonly queryClientMatchesSingleton: boolean;
          readonly queryClientData: string | null;
          readonly queryHookAttempts: number;
          readonly queryHookResolved: boolean;
          readonly hydrationEffectRan: boolean;
        };
        readonly clientRequests: readonly string[];
        readonly clientResponses: readonly {
          readonly url: string;
          readonly status: number;
        }[];
        readonly clientRequestFailures: readonly {
          readonly url: string;
          readonly error: string;
        }[];
        readonly nonSuccessfulResponses: readonly {
          readonly url: string;
          readonly status: number;
          readonly resourceType: string;
        }[];
        readonly networkRequestFailures: readonly {
          readonly url: string;
          readonly resourceType: string;
          readonly error: string;
        }[];
        readonly consoleErrors: readonly {
          readonly text: string;
          readonly url: string;
          readonly lineNumber: number;
          readonly columnNumber: number;
        }[];
        readonly runtimeErrors: readonly string[];
      };

      const browserVerdict = {
        labFound: browserEvidence.labFound,
        hydrated: browserEvidence.beforeClick?.hydrated === 'true',
        hydratedCache: browserEvidence.beforeClick?.hydratedCache === 'true',
        queryClientDomMarker: browserEvidence.beforeClick?.queryClient === 'true',
        initialRow: browserEvidence.beforeClick?.row === 'Server row',
        interactiveClick: browserEvidence.rowAfterClick === 'Hydrated row',
        clientEntryRequested: browserEvidence.clientRequests.some((url) =>
          url.includes('fresh:client-entry')
        ),
        islandEntryRequested: browserEvidence.clientRequests.some((url) =>
          url.includes('ServiceShowcaseLab')
        ),
        clientEntryLoaded: browserEvidence.clientResponses.some((response) =>
          response.url.includes('fresh:client-entry') && response.status < 400
        ),
        islandEntryLoaded: browserEvidence.clientResponses.some((response) =>
          response.url.includes('ServiceShowcaseLab') && response.status < 400
        ),
        moduleLoaded: browserEvidence.clientExecution.moduleLoaded,
        islandRenderAttempted: browserEvidence.clientExecution.islandRenderAttempts > 0,
        providerChildRendered: browserEvidence.clientExecution.innerRenderAttempts > 0,
        singletonClientAttempted: browserEvidence.clientExecution.singletonClientAttempts > 0,
        singletonClientResolved: browserEvidence.clientExecution.singletonClientResolved,
        hydratedCacheInClient: browserEvidence.clientExecution.hydratedCache,
        queryClientHookAttempted: browserEvidence.clientExecution.queryClientHookAttempts > 0,
        queryClientHookResolved: browserEvidence.clientExecution.queryClientHookResolved,
        queryClientMatchesSingleton: browserEvidence.clientExecution.queryClientMatchesSingleton,
        queryClientDataBeforeClick: browserEvidence.beforeClick?.queryClientData,
        queryClientDataAfterClick: browserEvidence.clientExecution.queryClientData,
        queryHookAttempted: browserEvidence.clientExecution.queryHookAttempts > 0,
        queryHookResolved: browserEvidence.clientExecution.queryHookResolved,
        hydrationEffectRan: browserEvidence.clientExecution.hydrationEffectRan,
        clientRequestFailures: browserEvidence.clientRequestFailures,
        nonSuccessfulResponses: browserEvidence.nonSuccessfulResponses,
        networkRequestFailures: browserEvidence.networkRequestFailures,
        consoleErrors: browserEvidence.consoleErrors,
        runtimeErrors: browserEvidence.runtimeErrors,
      };

      assertEquals(
        { served: servedEvidence, browser: browserVerdict },
        {
          served: {
            directFreshIslandMarker: true,
            directInitialRowReached: true,
            freshIslandMarker: true,
            clientBootImport: true,
            layerReached: true,
            layoutReached: true,
            initialRowReached: true,
          },
          browser: {
            labFound: true,
            hydrated: true,
            hydratedCache: true,
            queryClientDomMarker: true,
            initialRow: true,
            interactiveClick: true,
            clientEntryRequested: true,
            islandEntryRequested: true,
            clientEntryLoaded: true,
            islandEntryLoaded: true,
            moduleLoaded: true,
            islandRenderAttempted: true,
            providerChildRendered: true,
            singletonClientAttempted: true,
            singletonClientResolved: true,
            hydratedCacheInClient: true,
            queryClientHookAttempted: true,
            queryClientHookResolved: true,
            queryClientMatchesSingleton: true,
            queryClientDataBeforeClick: 'Server row',
            queryClientDataAfterClick: 'Hydrated row',
            queryHookAttempted: true,
            queryHookResolved: true,
            hydrationEffectRan: true,
            clientRequestFailures: [],
            nonSuccessfulResponses: [],
            networkRequestFailures: [],
            consoleErrors: [],
            runtimeErrors: [],
          },
        },
        JSON.stringify({ servedEvidence, browserEvidence }, null, 2),
      );
    } finally {
      await runPlaywright(
        ['-s', SHOWCASE_ISLAND_SESSION, 'close'],
        playwrightOutput,
        false,
      );
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
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The server has not bound its port yet.
    }
  }

  throw new Error('Timed out waiting for the Vite browser fixture');
}
