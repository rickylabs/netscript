import { assertEquals, assertMatch, assertNotMatch } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { createLockedViteCommand } from './_fixtures/vite-runtime.ts';
import {
  reservePort,
  runPlaywright,
  stopVite,
  waitForServer,
} from './_fixtures/browser-runtime.ts';

const fixture = fromFileUrl(new URL('./fixtures/fresh-ui-modal-browser/', import.meta.url));
const session = 'netscript-fresh-ui-modal';

function dialogStartTag(html: string, id: string): string {
  const tag = html.match(new RegExp(`<dialog[^>]*\\bid="${id}"[^>]*>`))?.[0];
  if (!tag) throw new Error(`Server HTML has no <dialog id="${id}">`);
  return tag;
}

const OPEN_ATTRIBUTE = /\sopen(?=[\s>=])/;

// Shared page-side helpers. `probe` samples a 6x8 grid inside the panel the way rickylabs/netscript#1688
// measured it, and hits a corner that only a top-layer `::backdrop` can cover.
const helpers = `
  const probe = (id) => page.evaluate((id) => {
    const dialog = document.getElementById(id);
    const rect = dialog.getBoundingClientRect();
    let misses = 0;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const hit = document.elementFromPoint(
          rect.left + (rect.width * (col + 0.5)) / 8,
          rect.top + (rect.height * (row + 0.5)) / 6,
        );
        if (!hit || !dialog.contains(hit)) misses++;
      }
    }
    return {
      open: dialog.open,
      modal: dialog.matches(':modal'),
      backdrop: document.elementFromPoint(2, innerHeight - 2) === dialog &&
        getComputedStyle(dialog, '::backdrop').backgroundColor === 'rgb(10, 20, 30)',
      misses,
      focusInside: dialog.contains(document.activeElement),
    };
  }, id);
  const waitOpen = (id, open) =>
    page.waitForFunction(([id, open]) => document.getElementById(id)?.open === open, [id, open], {
      timeout: 5000,
    });
  const domClick = (selector) => page.locator(selector).evaluate((element) => element.click());
`;

const MODAL = { open: true, modal: true, backdrop: true, misses: 0, focusInside: true };

Deno.test({
  name:
    'production browser: fresh-ui Dialog, Sheet and Drawer open modally above a sticky translucent ancestor',
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
      const origin = `http://127.0.0.1:${port}`;
      const output = await Deno.makeTempDir({ prefix: 'netscript-fresh-ui-modal-browser-' });
      const server = new Deno.Command(Deno.execPath(), {
        args: [
          'serve',
          '--frozen',
          '--cached-only',
          '-A',
          '--host',
          '127.0.0.1',
          '--port',
          String(port),
          '_fresh/server.js',
        ],
        cwd: fixture,
        stdout: 'null',
        stderr: 'inherit',
      }).spawn();
      try {
        await waitForServer(`${origin}/`, server);
        const initialHtml = await (await fetch(`${origin}/initial`)).text();

        await runPlaywright(['-s', session, 'open', `${origin}/`], output);
        const result = await runPlaywright([
          '--raw',
          '-s',
          session,
          'run-code',
          `async page => {
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          ${helpers}
          const observed = { overlays: {} };
          try {
            await page.setViewportSize({ width: 1280, height: 800 });
            await page.reload();
            await page.locator('header[data-hydrated="true"]').waitFor();
            for (const kind of ['dialog', 'sheet', 'drawer']) {
              await page.locator('#' + kind + '-trigger').click();
              await waitOpen(kind, true);
              const opened = await probe(kind);
              observed.overlays[kind] = opened;
              await page.keyboard.press('Escape');
              await waitOpen(kind, false);
              const afterEscape = await page.locator('#' + kind + '-trigger').getAttribute('data-state');
              await page.locator('#' + kind + '-trigger').click();
              await waitOpen(kind, true);
              await page.mouse.click(2, 798);
              await waitOpen(kind, false);
              const afterBackdrop = await page.locator('#' + kind + '-trigger').getAttribute('data-state');
              observed.overlays[kind] = { ...opened, afterEscape, afterBackdrop };
            }

            await page.locator('#controlled-trigger').click();
            await waitOpen('controlled', true);
            observed.controlled = await probe('controlled');
            await page.locator('#controlled-force-close').click();
            await waitOpen('controlled', false);
            observed.controlled.closed = true;

            await domClick('#nonmodal-trigger');
            await waitOpen('nonmodal', true);
            observed.nonModal = await page.evaluate(() => {
              const dialog = document.getElementById('nonmodal');
              return { open: dialog.open, modal: dialog.matches(':modal') };
            });
            await domClick('#nonmodal-close');
            await waitOpen('nonmodal', false);
            await domClick('#nonmodal-trigger');
            await waitOpen('nonmodal', true);
            await domClick('#nonmodal-close');
            await waitOpen('nonmodal', false);
            observed.nonModal.reopened = true;

            await page.goto('${origin}/initial');
            await page.locator('header[data-hydrated="true"]').waitFor();
            await waitOpen('initial-modal', true);
            observed.initial = await probe('initial-modal');
            observed.initialNonModal = await page.evaluate(() => {
              const dialog = document.getElementById('initial-nonmodal');
              return { open: dialog.open, modal: dialog.matches(':modal') };
            });
            await page.keyboard.press('Escape');
            await waitOpen('initial-modal', false);

            return { ...observed, errors };
          } catch (error) {
            return { ...observed, failure: error.message.split('\\n')[0], errors };
          }
        }`,
        ], output);
        assertEquals(JSON.parse(result.trim()), {
          overlays: {
            dialog: { ...MODAL, afterEscape: 'closed', afterBackdrop: 'closed' },
            sheet: { ...MODAL, afterEscape: 'closed', afterBackdrop: 'closed' },
            drawer: { ...MODAL, afterEscape: 'closed', afterBackdrop: 'closed' },
          },
          controlled: { ...MODAL, closed: true },
          nonModal: { open: true, modal: false, reopened: true },
          initial: MODAL,
          initialNonModal: { open: true, modal: false },
          errors: [],
        });
        // SSR: a modal dialog waits for showModal(); a non-modal one is visible before hydration.
        assertNotMatch(dialogStartTag(initialHtml, 'initial-modal'), OPEN_ATTRIBUTE);
        assertMatch(dialogStartTag(initialHtml, 'initial-nonmodal'), OPEN_ATTRIBUTE);
      } finally {
        await runPlaywright(['-s', session, 'close'], output, false);
        await stopVite(server);
        await Deno.remove(output, { recursive: true });
      }
    } finally {
      await Deno.remove(new URL('./fixtures/fresh-ui-modal-browser/_fresh/', import.meta.url), {
        recursive: true,
      }).catch((error: unknown) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
  },
});
