import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { createLockedViteCommand } from './_fixtures/vite-runtime.ts';
import {
  reservePort,
  runPlaywright,
  stopVite,
  waitForServer,
} from './_fixtures/browser-runtime.ts';

const fixture = fromFileUrl(new URL('./fixtures/db-collection-browser/', import.meta.url));
const session = 'netscript-db-collection';

Deno.test({
  name: 'production browser: real worker Collection SSR, hydration, updates and teardown',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    try {
      const build = await createLockedViteCommand({
        args: ['build', '--config', 'vite.config.ts'],
        cwd: fixture,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(build.success, true, new TextDecoder().decode(build.stderr));
      const port = reservePort();
      const listener = Deno.listen({ port: 0 });
      const address = listener.addr as Deno.NetAddr;
      listener.close();
      const url = new URL(`http://${address.hostname}:${port}/`).href;
      const output = await Deno.makeTempDir({ prefix: 'netscript-db-browser-' });
      const server = new Deno.Command(Deno.execPath(), {
        args: [
          'serve',
          '--frozen',
          '--cached-only',
          '-A',
          '--port',
          String(port),
          '_fresh/server.js',
        ],
        cwd: fixture,
        stdout: 'null',
        stderr: 'inherit',
      }).spawn();
      try {
        await waitForServer(url, server);
        const response = await fetch(url);
        assertEquals(response.status, 200);
        const html = await response.text();
        assertStringIncludes(html, 'data-state="loading"');
        assertEquals(html.includes('InvalidSourceError'), false);
        await runPlaywright(['-s', session, 'open', url], output);
        const result = await runPlaywright([
          '--raw',
          '-s',
          session,
          'run-code',
          `async page => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        try {
        await page.reload();
        await page.locator('main[data-hydrated="true"]').waitFor();
        await page.locator('section[data-state="empty"]').waitFor();
        const sdk = await page.locator('#sdk-data').textContent();
        await page.getByRole('button', { name: 'Update stream', exact: true }).click();
        await page.locator('section[data-state="data"]').waitFor();
        await page.waitForFunction(() => document.querySelector('#stream-data')?.textContent === 'revision-1');
        await page.getByRole('button', { name: 'Update stream', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('#stream-data')?.textContent === 'revision-2');
        const overflow = [];
        for (const width of [390, 1280]) {
          await page.setViewportSize({ width, height: 800 });
          overflow.push(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
        }
        await page.getByRole('button', { name: 'Unmount collections', exact: true }).click();
        await page.locator('main[data-subscriptions="0"]').waitFor();
        return { sdk, errors, overflow, subscriptions: await page.locator('main').getAttribute('data-subscriptions') };
        } catch (error) {
          return { failure: error.message, errors, html: await page.content() };
        }
      }`,
        ], output);
        assertEquals(JSON.parse(result.trim()), {
          sdk: 'sdk-item',
          errors: [],
          overflow: [false, false],
          subscriptions: '0',
        });
      } finally {
        await runPlaywright(['-s', session, 'close'], output, false);
        await stopVite(server);
        await Deno.remove(output, { recursive: true });
      }
    } finally {
      await Deno.remove(new URL('./fixtures/db-collection-browser/_fresh/', import.meta.url), {
        recursive: true,
      }).catch((error: unknown) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
  },
});
