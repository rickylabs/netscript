import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { createLockedViteCommand } from './_fixtures/vite-runtime.ts';
import {
  reservePort,
  runPlaywright,
  stopVite,
  waitForServer,
} from './_fixtures/browser-runtime.ts';

const fixture = fromFileUrl(new URL('./fixtures/route-purity-browser/', import.meta.url));
const session = 'netscript-route-purity';
Deno.test({
  name:
    'production browser: pure memo and variable route links preserve native chat hooks and Fresh navigation',
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
      if (listener.addr.transport !== 'tcp') {
        throw new Error('Browser fixture requires a network listener');
      }
      const address = listener.addr;
      listener.close();
      const url = new URL(`http://${address.hostname}:${port}/channel/A`).href;
      const output = await Deno.makeTempDir({ prefix: 'netscript-route-browser-' });
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
        assertStringIncludes(html, 'transcript-A');
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
            const epoch = await page.evaluate(() => performance.timeOrigin);
            const hydrated = async channel => {
              await page.locator('#chat[data-channel="' + channel + '"][data-hydrated="true"]').waitFor();
              await page.waitForFunction(expected => document.querySelector('#transcript')?.textContent.includes('transcript-' + expected), channel);
              const other = channel === 'A' ? 'B' : 'A';
              if ((await page.locator('#transcript').textContent()).includes('transcript-' + other)) throw new Error('Previous transcript survived navigation');
            };
            await hydrated('A');
            const hooks = await page.locator('#chat').getAttribute('data-hooks');
            if (Number(hooks) < 10) throw new Error('Native hook observer did not run');
            for (let count = 1; count <= 3; count++) {
              await page.getByRole('button', { name: 'Rerender links', exact: true }).click();
              await page.locator('#chat[data-count="' + count + '"]').waitFor();
              if (await page.locator('#chat').getAttribute('data-hooks') !== hooks) throw new Error('Hook count changed');
              if (await page.locator('#chat').getAttribute('data-state') !== 'typed-state') throw new Error('State type changed');
            }
            await page.getByRole('button', { name: 'Resume chat', exact: true }).click();
            await page.waitForFunction(() => document.querySelector('#transcript')?.textContent.includes('live-A-resumed'));
            await page.locator('#chat[data-resumes="1"]').waitFor();
            await page.locator('#to-b').click();
            await hydrated('B');
            for (let pass = 0; pass < 3; pass++) {
              await page.goBack(); await hydrated('A');
              await page.goForward(); await hydrated('B');
            }
            await page.getByRole('button', { name: 'Rerender links', exact: true }).click();
            await page.locator('#chat[data-count="1"]').waitFor();
            await page.getByRole('button', { name: 'Resume chat', exact: true }).click();
            await page.waitForFunction(() => document.querySelector('#transcript')?.textContent.includes('live-B-resumed'));
            await page.locator('#chat[data-resumes="1"]').waitFor();
            const stats = await page.evaluate(async () => await (await fetch('/stats')).json());
            const resumed = ['A', 'B'].map(channel => stats.some(request => request.channel === channel && request.resumed));
            const overflow = [];
            for (const width of [390, 1280]) {
              await page.setViewportSize({ width, height: 800 });
              overflow.push(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
            }
            const chatError = await page.locator('#chat-error').textContent();
            const sameDocument = epoch === await page.evaluate(() => performance.timeOrigin);
            await page.getByRole('button', { name: 'Unmount chat', exact: true }).click();
            await page.locator('main[data-unmounted="true"]').waitFor();
            return { stableHooks: true, resumed, sameDocument, chatError, overflow, remainingChats: await page.locator('#chat').count(), errors };
          } catch (error) { return { failure: error.message, errors, html: await page.content() }; }
        }`,
        ], output);
        assertEquals(JSON.parse(result.trim()), {
          stableHooks: true,
          resumed: [true, true],
          sameDocument: true,
          chatError: '',
          overflow: [false, false],
          remainingChats: 0,
          errors: [],
        });
      } finally {
        await runPlaywright(['-s', session, 'close'], output, false);
        await stopVite(server);
        await Deno.remove(output, { recursive: true });
      }
    } finally {
      await Deno.remove(new URL('./fixtures/route-purity-browser/_fresh/', import.meta.url), {
        recursive: true,
      }).catch((error: unknown) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
  },
});
