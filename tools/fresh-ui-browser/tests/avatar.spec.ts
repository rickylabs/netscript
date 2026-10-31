/// <reference lib="dom" />
import { expect, test } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const rendered = spawnSync('deno', [
  'run',
  '-A',
  '--frozen',
  '--config',
  'deno.json',
  'tools/fresh-ui-browser/render-avatar-fixture.ts',
], { cwd: repository, encoding: 'utf8' });
if (rendered.status !== 0) throw new Error(`Cannot render shipped Avatar: ${rendered.stderr}`);
const avatarCss = readFileSync(
  new URL('../../../packages/fresh-ui/registry/components/ui/avatar.css', import.meta.url),
  'utf8',
);
const pixel =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>';

for (const theme of ['studio-utility', 'ns-one']) {
  test(
    `Avatar fetch count: ${theme} preserves the hidden or visible photo contract`,
    async ({ page }, testInfo) => {
      let photoRequests = 0;
      let controlRequests = 0;
      // Intercept before navigation: real SSR markup, styles and src reach Chromium together.
      await page.route('http://avatar.test/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/avatar-photo.svg') {
          photoRequests++;
          await route.fulfill({ contentType: 'image/svg+xml', body: pixel });
        } else if (path === '/network-control.svg') {
          controlRequests++;
          await route.fulfill({ contentType: 'image/svg+xml', body: pixel });
        } else if (path === '/') {
          await route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html data-theme="${theme}"><head><style>
            :root{--ns-avatar-md:32px;--ns-size-avatar-md:32px}
            ${avatarCss}
          </style></head><body>${rendered.stdout}
            <img id="network-control" src="/network-control.svg" alt="Network control">
          </body></html>`,
          });
        } else {
          await route.abort();
        }
      });
      await page.goto('http://avatar.test/');
      await expect(page.locator('#network-control')).toHaveJSProperty('naturalWidth', 1);
      const photo = page.locator('[data-scope="avatar"][data-part="image"]');
      const initials = page.locator('[data-scope="avatar"][data-part="initials"]');
      if (theme === 'studio-utility') {
        await expect(photo).toBeHidden();
        await expect(initials).toHaveText('AL');
        await expect(initials).toBeVisible();
      } else {
        await expect(photo).toBeVisible();
        await expect(photo).toHaveJSProperty('naturalWidth', 1);
        await expect(initials).toBeHidden();
      }
      // Let layout and lazy-image scheduling settle, then observe a complete quiet network window.
      await page.evaluate(() =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
      );
      await page.waitForLoadState('networkidle');
      const initialRequests = photoRequests;
      await testInfo.attach('avatar-initial-fetch-count', {
        body: JSON.stringify({ theme, photoRequests: initialRequests, controlRequests }),
        contentType: 'application/json',
      });
      expect(controlRequests).toBe(1);
      expect(initialRequests).toBe(theme === 'studio-utility' ? 0 : 1);
      if (theme === 'studio-utility') {
        // Prove the deferred URL works when this same image becomes visible in a legacy theme.
        await page.evaluate(() => document.documentElement.dataset.theme = 'ns-one');
        await expect(photo).toBeVisible();
        await expect(photo).toHaveJSProperty('naturalWidth', 1);
        expect(photoRequests).toBe(1);
      }
    },
  );
}
