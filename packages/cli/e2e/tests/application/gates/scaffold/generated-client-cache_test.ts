import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { delay } from '@std/async';
import { fromFileUrl, join } from '@std/path';
import {
  captureBoundedText,
  type CdpClient,
  terminateBrowserProcess,
} from '../../../../src/application/gates/scaffold/service-client-browser-probe.ts';
import { browserValue, navigate, withBrowser } from './browser-session.ts';

const REPO = fromFileUrl(new URL('../../../../../../../', import.meta.url));
const HOST = '127.0.0.1';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const CLIENT_MODULES = {
  entry: 'fresh:client-entry',
  island: 'islands/CacheButton.tsx',
  lazy: 'lib/cache-result.ts',
} as const;

interface ManifestChunk {
  readonly file: string;
  readonly isEntry?: boolean;
  readonly dynamicImports?: readonly string[];
}

interface ModuleEvidence {
  readonly url: string;
  readonly cacheControl: string | null;
  readonly bytes: number;
  readonly sha256: string;
}

interface BrowserEvidence {
  readonly build: string;
  readonly origin: string;
  readonly entryMarker: string;
  readonly clickResult: string;
  readonly resources: readonly string[];
}

Deno.test('generated production Fresh gives changed immutable client modules new URLs', async () => {
  const scratchRoot = join(REPO, '.llm/tmp');
  await Deno.mkdir(scratchRoot, { recursive: true });
  const scratch = await Deno.makeTempDir({ dir: scratchRoot, prefix: 'fresh-client-cache-' });
  const app = join(scratch, 'cache-app/apps/web');
  try {
    await runDeno(REPO, [
      'run',
      '--no-lock',
      '-A',
      'packages/cli/bin/netscript-dev.ts',
      'init',
      'cache-app',
      '--path',
      scratch,
      '--app-name',
      'web',
      '--db',
      'none',
      '--no-aspire',
      '--no-git',
      '--editor',
      'none',
      '--ci',
      '--yes',
      '--force',
    ]);
    const client = await Deno.readTextFile(join(app, 'client.ts'));
    await Deno.writeTextFile(
      join(app, CLIENT_MODULES.island),
      `import { useEffect, useState } from 'preact/hooks';
export default function CacheButton() {
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState('');
  useEffect(() => setReady(true), []);
  return <button id="cache-probe" disabled={!ready} onClick={async () => {
    const { result } = await import('../lib/cache-result.ts');
    setResult(result);
  }}>{result || 'Show result'}</button>;
}
`,
    );

    await withBrowser(async (browser) => {
      await browser.send('Network.setCacheDisabled', { cacheDisabled: false });
      const cold = await buildAndRead('A', 0);
      const warm = await buildAndRead('B', Number(new URL(cold.browser.origin).port));
      for (const { browser: observed, modules, serverEntry } of [cold, warm]) {
        console.info(JSON.stringify({
          build: observed.build,
          entryMarker: observed.entryMarker,
          clickResult: observed.clickResult,
          modules,
          serverEntry,
        }));
      }

      assertEquals(cold.browser.build, 'A');
      assertEquals(cold.browser.entryMarker, 'A');
      assertEquals(cold.browser.clickResult, 'A');
      assertEquals(warm.browser.build, 'B', 'reload must receive the second production document');
      assertEquals(warm.browser.origin, cold.browser.origin);
      assertEquals(cold.serverEntry, 'server-entry.mjs');
      assertEquals(warm.serverEntry, cold.serverEntry);
      assertNotEquals(cold.modules.entry.sha256, warm.modules.entry.sha256);
      assertNotEquals(cold.modules.lazy.sha256, warm.modules.lazy.sha256);
      for (const key of Object.keys(CLIENT_MODULES) as (keyof typeof CLIENT_MODULES)[]) {
        const first = cold.modules[key];
        const second = warm.modules[key];
        assertEquals(first.cacheControl, CACHE_CONTROL, first.url);
        assertEquals(second.cacheControl, CACHE_CONTROL, second.url);
        if (first.sha256 !== second.sha256) {
          assertNotEquals(first.url, second.url, `changed immutable ${key} reused its URL`);
        }
        assert(
          cold.browser.resources.includes(first.url),
          `cold browser did not load ${first.url}`,
        );
        assert(
          warm.browser.resources.includes(second.url),
          `warm browser did not load ${second.url}`,
        );
      }
      assertEquals(warm.browser.entryMarker, 'B', 'warm browser must run the new client entry');
      assertEquals(warm.browser.clickResult, 'B', 'warm browser must hydrate the new island code');

      async function buildAndRead(version: 'A' | 'B', port: number) {
        await Promise.all([
          Deno.writeTextFile(
            join(app, 'client.ts'),
            `${client}\ndocument.documentElement.dataset.cacheEntry = '${version}';\n`,
          ),
          Deno.writeTextFile(
            join(app, CLIENT_MODULES.lazy),
            `export const result = '${version}';\n`,
          ),
          Deno.writeTextFile(
            join(app, 'routes/index.tsx'),
            `import CacheButton from '../islands/CacheButton.tsx';
export default function Home() {
  return <main data-build="${version}"><CacheButton /></main>;
}
`,
          ),
        ]);
        await runDeno(app, ['task', 'build']);
        const clientManifest = await readManifest(app, 'client');
        const island = clientManifest[CLIENT_MODULES.island];
        assert(island?.dynamicImports?.includes(CLIENT_MODULES.lazy), 'expected a lazy chunk');
        const serverManifest = await readManifest(app, 'server');
        const serverEntry = Object.values(serverManifest).find(({ isEntry }) => isEntry)?.file;
        assert(serverEntry, 'missing production server entry');
        return await withProductionServer(app, port, async (origin) => {
          const modules = {
            entry: await readModule(origin, clientManifest[CLIENT_MODULES.entry]?.file),
            island: await readModule(origin, island.file),
            lazy: await readModule(origin, clientManifest[CLIENT_MODULES.lazy]?.file),
          };
          if (version === 'A') await navigate(browser, origin);
          else {
            await browser.send('Page.reload', { ignoreCache: false });
            await browser.waitFor('Page.loadEventFired');
          }
          return { modules, serverEntry, browser: await clickProbe(browser) };
        });
      }
    });
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
});

async function runDeno(cwd: string, args: string[]): Promise<void> {
  const { code, stderr } = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    stdout: 'null',
    stderr: 'piped',
  }).output();
  assertEquals(code, 0, `deno ${args[0]} failed\n${new TextDecoder().decode(stderr)}`);
}

async function withProductionServer<T>(
  app: string,
  port: number,
  probe: (origin: string) => Promise<T>,
): Promise<T> {
  // Use the same launcher as the scaffold's start task, with a fixture-owned loopback port.
  const child = new Deno.Command(Deno.execPath(), {
    args: ['serve', '--host', HOST, '--port', String(port), '-A', '_fresh/server.js'],
    cwd: app,
    env: { MODE: 'production' },
    stdout: 'null',
    stderr: 'piped',
  }).spawn();
  const stderr = captureBoundedText(child.stderr);
  try {
    const deadline = performance.now() + 20_000;
    while (performance.now() < deadline) {
      const status = await Promise.race([child.status, delay(50)]);
      if (status) break;
      const address = stderr.text().match(/Listening on (http:\/\/\S+)/)?.[1];
      if (address) return await probe(new URL(address).origin);
    }
    throw new Error(`generated production launcher did not start\n${stderr.text()}`);
  } finally {
    await terminateBrowserProcess(child, stderr.drain);
  }
}

async function readManifest(
  app: string,
  environment: 'client' | 'server',
): Promise<Record<string, ManifestChunk>> {
  return JSON.parse(
    await Deno.readTextFile(join(app, '_fresh', environment, '.vite/manifest.json')),
  );
}

async function readModule(origin: string, file: string | undefined): Promise<ModuleEvidence> {
  assert(file, 'missing client module in the Vite manifest');
  const url = new URL(`/${file}`, origin);
  const response = await fetch(url);
  const body = await response.arrayBuffer();
  assertEquals(response.status, 200, url.pathname);
  return {
    url: url.pathname,
    cacheControl: response.headers.get('cache-control'),
    bytes: body.byteLength,
    sha256: new Uint8Array(await crypto.subtle.digest('SHA-256', body)).toHex(),
  };
}

async function clickProbe(browser: CdpClient): Promise<BrowserEvidence> {
  return await browserValue(
    browser,
    `(async () => {
    const button = document.querySelector('#cache-probe');
    if (!button) throw new Error('missing server-rendered test island');
    const deadline = performance.now() + 5000;
    const waitFor = async (pending) => {
      while (pending() && performance.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    };
    await waitFor(() => button.disabled);
    button.click();
    await waitFor(() => button.textContent === 'Show result');
    return {
      build: document.querySelector('[data-build]').dataset.build,
      origin: location.origin,
      entryMarker: document.documentElement.dataset.cacheEntry,
      clickResult: button.textContent,
      resources: performance.getEntriesByType('resource')
        .map(entry => new URL(entry.name))
        .filter(url => url.origin === location.origin && url.pathname.endsWith('.mjs'))
        .map(url => url.pathname),
    };
  })()`,
  );
}
