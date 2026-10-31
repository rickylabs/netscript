import process from 'node:process';
import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

for (const mode of ['no-js', 'isolated-toggle'] as const) {
  test(
    `server shell ${mode}: native navigation and nested disclosure`,
    async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        javaScriptEnabled: mode !== 'no-js',
        viewport: testInfo.project.use.viewport,
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${
          testInfo.project.use.baseURL ??
            'http://127.0.0.1:' + String(process.env.FRESH_UI_GAP_PORT ?? '4187')
        }/shell-static`,
      );
      const shell = page.locator('#static-shell');
      await expect(shell).toHaveAttribute('data-sidebar-mode', 'static');
      const disclosure = shell.locator('details.ns-dashboard__disclosure');
      await expect(disclosure).toHaveAttribute('open', '');
      await expect(shell.getByRole('link', { name: 'Overview' })).toBeVisible();
      if ((testInfo.project.use.viewport?.width ?? 1280) <= 1024) {
        const control = mode === 'no-js'
          ? shell.locator('.ns-dashboard__summary')
          : shell.getByRole('button', { name: 'Close sidebar' });
        await control.focus();
        await page.keyboard.press('Enter');
        await expect(disclosure).not.toHaveAttribute('open');
        await expect(shell.getByRole('link', { name: 'Overview' })).toBeHidden();
        await (mode === 'no-js' ? control : shell.getByRole('button', { name: 'Open sidebar' }))
          .press('Space');
        await expect(disclosure).toHaveAttribute('open', '');
      }
      const section = shell.locator('summary.ns-dashboard__nav-group-label');
      await section.press('Enter');
      await expect(shell.getByRole('link', { name: 'Quick start' })).toBeVisible();
      await section.press('Space');
      await expect(shell.getByRole('link', { name: 'Quick start' })).toBeHidden();
      await expect(shell.locator('a[aria-disabled="true"]')).not.toHaveAttribute('href');
      expect(errors).toEqual([]);
      await context.close();
    },
  );
}

test(
  'hydrated shell: one native modal, owned toggle, refusal and focus return',
  async ({ page }, testInfo) => {
    const scheme = testInfo.project.name.startsWith('dark') ? 'dark' : 'light';
    await page.goto(`/shell?scheme=${scheme}`);
    const shell = page.locator('#shell-example');
    await expect(shell).toHaveAttribute('data-sidebar-mode', 'hydrated');
    const nav = shell.locator('aside[data-sidebar]');
    await expect(nav).toHaveCount(1);
    if ((testInfo.project.use.viewport?.width ?? 1280) > 1024) {
      await expect(nav).toBeVisible();
      await expect(shell.locator('[data-scope="sidebar-toggle"]')).toBeHidden();
      await expect(shell.locator('.ns-dashboard__drawer')).toHaveCount(0);
      await shell.screenshot({ path: testInfo.outputPath('shell-dashboard.png') });
      return;
    }
    const toggle = shell.locator('[data-scope="sidebar-toggle"]');
    const dialog = shell.locator('dialog');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute(
      'aria-controls',
      await dialog.getAttribute('id') ?? 'missing',
    );
    await expect(shell.locator('.ns-dashboard__builtin-trigger')).toBeHidden();
    await toggle.press('Space');
    await expect(dialog).toBeVisible();
    const modalAxe = await new AxeBuilder({ page }).include('#shell-example dialog[open]')
      .analyze();
    expect(
      modalAxe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical'),
    ).toEqual([]);
    await dialog.screenshot({ path: testInfo.outputPath('shell-sidebar.png') });
    expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      // Native Tab can enter browser chrome, represented by BODY; it must never focus an inert outside control.
      expect(
        await dialog.evaluate((node) =>
          node.contains(document.activeElement) || document.activeElement === document.body
        ),
      ).toBe(true);
    }
    await shell.getByRole('button', { name: 'Account' }).evaluate((node) => node.focus());
    expect(
      await dialog.evaluate((node) =>
        node.contains(document.activeElement) || document.activeElement === document.body
      ),
    ).toBe(true);
    await shell.locator('summary.ns-dashboard__nav-group-label').press('Enter');
    await expect(shell.getByRole('link', { name: 'Quick start' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
    await page.getByRole('button', { name: 'Refuse dismissal' }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close sidebar', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  },
);

test('responsive branch replacement preserves focused destination and releases modal', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/shell');
  const shell = page.locator('#shell-example');
  const overview = shell.getByRole('link', { name: 'Overview' });
  await expect(overview).toBeVisible();
  await overview.focus();
  await page.setViewportSize({ width: 1024, height: 900 });
  const toggle = shell.locator('[data-scope="sidebar-toggle"]');
  await expect(toggle).toBeFocused();
  await expect(shell).toHaveAttribute('data-breakpoint', 'tablet');
  await toggle.click();
  await expect(shell.locator('dialog')).toBeVisible();
  await shell.getByRole('link', { name: 'Orders', exact: true }).focus();
  await page.setViewportSize({ width: 1025, height: 900 });
  await expect(shell.getByRole('link', { name: 'Orders', exact: true })).toBeFocused();
  await expect(shell.locator('dialog')).toHaveCount(0);
  await expect(shell.locator('aside[data-sidebar]')).toHaveCount(1);
  await expect(page.getByLabel('Shell proposals')).not.toContainText('native-close');
  await page.setViewportSize({ width: 640, height: 900 });
  await expect(shell).toHaveAttribute('data-breakpoint', 'mobile');
  await page.setViewportSize({ width: 641, height: 900 });
  await expect(shell).toHaveAttribute('data-breakpoint', 'tablet');
});

test(
  'docs/chat geometry, collapsed/none, native controls and strict accessibility',
  async ({ page }, testInfo) => {
    await page.goto(
      `/shell?layout=docs&scheme=${testInfo.project.name.startsWith('dark') ? 'dark' : 'light'}`,
    );
    const shell = page.locator('#shell-example');
    await expect(shell).toHaveAttribute('data-sidebar-mode', 'hydrated');
    const initialAxe = await new AxeBuilder({ page }).include('#shell-example').analyze();
    expect(
      initialAxe.violations.filter((item) =>
        item.impact === 'serious' || item.impact === 'critical'
      ),
    ).toEqual([]);
    const desktop = (testInfo.project.use.viewport?.width ?? 1280) > 1024;
    const header = shell.locator('.ns-dashboard__topbar');
    const boxes = await Promise.all([shell.boundingBox(), header.boundingBox()]);
    expect(Math.abs(boxes[0]!.width - boxes[1]!.width)).toBeLessThan(1);
    if (desktop) {
      expect((await shell.locator('.ns-dashboard__rail').boundingBox())!.width).toBe(280);
      await page.getByRole('button', { name: 'Collapse desktop sidebar' }).click();
      expect((await shell.locator('aside[data-sidebar]').boundingBox())!.width).toBe(56);
      await expect(shell.getByRole('link', { name: 'Overview' })).toBeVisible();
      const summary = shell.locator('summary.ns-dashboard__nav-group-label');
      await expect(summary).toHaveAccessibleName('Reference');
      await summary.press('Enter');
      await expect(shell.getByRole('link', { name: 'Quick start' })).toBeVisible();
    } else {
      await expect(shell.locator('.ns-dashboard__rail')).toBeHidden();
      await expect(shell.locator('.ns-dashboard__mobile-rail')).toBeVisible();
    }
    await shell.screenshot({ path: testInfo.outputPath('shell-docs.png') });
    await page.getByRole('button', { name: 'Remove sidebar' }).click();
    await expect(shell.locator('aside[data-sidebar]')).toHaveCount(0);
    await expect(shell.locator('[data-scope="sidebar-toggle"]')).toBeHidden();
    await page.getByRole('button', { name: 'Chat layout' }).click();
    const thread = shell.locator(
      '.ns-dashboard__thread [data-scope="message-scroller"][data-part="viewport"]',
    );
    expect(await thread.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    const composer = await shell.locator('.ns-dashboard__composer').boundingBox();
    const frame = await shell.boundingBox();
    expect(composer!.y + composer!.height).toBeLessThanOrEqual(frame!.y + frame!.height + 1);
    const axe = await new AxeBuilder({ page }).include('#shell-example').analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
      [],
    );
    await shell.screenshot({ path: testInfo.outputPath('shell.png') });
  },
);

declare global {
  var __shellMqlListeners: number;
}

test('owned listener cleanup and explicit legacy overflow restoration', async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__shellMqlListeners = 0;
    const add = MediaQueryList.prototype.addEventListener;
    const remove = MediaQueryList.prototype.removeEventListener;
    MediaQueryList.prototype.addEventListener = function (...args: Parameters<typeof add>) {
      if (this.media === '(max-width: 1024px)' || this.media === '(max-width: 640px)') {
        globalThis.__shellMqlListeners++;
      }
      return add.apply(this, args);
    };
    MediaQueryList.prototype.removeEventListener = function (...args: Parameters<typeof remove>) {
      if (this.media === '(max-width: 1024px)' || this.media === '(max-width: 640px)') {
        globalThis.__shellMqlListeners--;
      }
      return remove.apply(this, args);
    };
  });
  await page.goto('/shell?legacy=true');
  await expect.poll(() => page.evaluate(() => globalThis.__shellMqlListeners)).toBe(2);
  const ownedToggle = page.locator('#shell-example [data-scope="sidebar-toggle"]');
  await expect(ownedToggle).toHaveAttribute('aria-controls', /ns-sidebar-/);
  await page.getByRole('button', { name: 'Use legacy selectors' }).click();
  await expect(ownedToggle).not.toHaveAttribute('aria-controls');
  await page.getByRole('button', { name: 'Use legacy selectors' }).click();
  await expect(ownedToggle).toHaveAttribute('aria-controls', /ns-sidebar-/);
  await page.evaluate(() => {
    document.body.style.overflow = 'clip';
  });
  await page.getByRole('button', { name: 'Mount shell' }).click();
  await expect.poll(() => page.evaluate(() => globalThis.__shellMqlListeners)).toBe(0);
  const legacy = page.locator('#legacy-example');
  await legacy.getByRole('button', { name: 'Open sidebar' }).click();
  await expect(page.locator('#legacy-sidebar')).toHaveAttribute('data-state', 'open');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await legacy.getByRole('button', { name: 'Close sidebar' }).click();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('clip');
});

test('custom control availability, malformed requests and two-shell isolation', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/shell?two=true');
  const first = page.locator('#shell-example'), second = page.locator('#second-shell');
  await expect(first).toHaveAttribute('data-sidebar-mode', 'hydrated');
  await expect(second).toHaveAttribute('data-sidebar-mode', 'hydrated');
  const firstToggle = first.locator('[data-scope="sidebar-toggle"]');
  const secondToggle = second.locator('[data-scope="sidebar-toggle"]');
  const firstId = await first.locator('dialog').getAttribute('id');
  const secondId = await second.locator('dialog').getAttribute('id');
  expect(firstId).not.toBe(secondId);
  await expect(firstToggle).toHaveAttribute('aria-controls', firstId!);
  await expect(secondToggle).toHaveAttribute('aria-controls', secondId!);
  await first.evaluate((root) => {
    root.dispatchEvent(
      new CustomEvent('netscript:sidebar-request', { detail: { open: 'invalid' } }),
    );
    root.querySelector('header')!.dispatchEvent(
      new CustomEvent('netscript:sidebar-request', { detail: { open: true }, bubbles: true }),
    );
  });
  await expect(first.locator('dialog')).toBeHidden();
  await firstToggle.click();
  await expect(first.locator('dialog')).toBeVisible();
  await expect(second.locator('dialog')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(first.locator('dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Disable custom control' }).click();
  await expect(first.locator('.ns-dashboard__builtin-trigger')).toBeVisible();
  await first.locator('.ns-dashboard__builtin-trigger').click();
  await expect(first.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Toggle custom control' }).click();
  await expect(firstToggle).toHaveCount(0);
  await expect(first.locator('.ns-dashboard__builtin-trigger')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle custom control' }).click();
  await expect(firstToggle).toHaveCount(1);
  await page.getByRole('button', { name: 'Disable custom control' }).click();
  await expect(first.locator('.ns-dashboard__builtin-trigger')).toBeHidden();
  await secondToggle.click();
  await expect(second.locator('dialog')).toBeVisible();
  await expect(first.locator('dialog')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(secondToggle).toBeFocused();
});

test('forced native close stands and later accepted parent render reopens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/shell');
  const shell = page.locator('#shell-example');
  await expect(shell).toHaveAttribute('data-sidebar-mode', 'hydrated');
  await page.getByRole('button', { name: 'Refuse dismissal' }).click();
  await expect(shell.locator('dialog')).toBeVisible();
  // No evaluations/assertions between these Escapes: CDP evaluation grants activation.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(shell.locator('dialog')).toBeHidden();
  await expect(shell.locator('[data-scope="sidebar-toggle"]')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect.poll(async () => {
    const proposals = JSON.parse(
      await page.getByLabel('Shell proposals').textContent() ?? '[]',
    ) as string[];
    return proposals.filter((value) => value === 'false:native-close').length;
  }).toBe(1);
  await page.getByRole('button', { name: 'Parent refresh' }).click();
  await expect(shell.locator('dialog')).toBeVisible();
  await expect(shell.locator('[data-scope="sidebar-toggle"]')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
});

test('RTL native backdrop, host overflow ownership and accepted controlled dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/shell?dir=rtl');
  const shell = page.locator('#shell-example');
  await expect(shell).toHaveAttribute('data-sidebar-mode', 'hydrated');
  await page.evaluate(() => {
    document.body.style.overflow = 'clip';
  });
  const toggle = shell.locator('[data-scope="sidebar-toggle"]');
  await toggle.click();
  await expect(shell.locator('dialog')).toBeVisible();
  const box = await shell.locator('dialog').boundingBox();
  expect(box!.x + box!.width).toBe(390);
  await page.mouse.click(2, 500);
  await expect(shell.locator('dialog')).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  await page.getByRole('button', { name: 'Refuse dismissal' }).click();
  await expect(shell.locator('dialog')).toBeVisible();
  // Simulate external host state changing while its outside controls are correctly inert.
  await page.getByRole('button', { name: 'Accept dismissal' }).evaluate((node) =>
    (node as HTMLElement).click()
  );
  await shell.locator('dialog').getByRole('button', { name: 'Close sidebar', exact: true }).click();
  await expect(shell.locator('dialog')).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
});

test('floating and inset use actual desktop and mobile geometry', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/shell?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  const shell = page.locator('#shell-example');
  await expect(shell).toHaveAttribute('data-sidebar-mode', 'hydrated');
  await page.getByRole('button', { name: 'Floating sidebar' }).click();
  const sidebar = shell.locator('aside[data-sidebar]');
  await expect(sidebar).toHaveAttribute('data-variant', 'floating');
  const frame = await shell.boundingBox(), floating = await sidebar.boundingBox();
  expect(floating!.x - frame!.x).toBe(8);
  expect(floating!.y - frame!.y).toBe(8);
  expect(await sidebar.evaluate((node) => getComputedStyle(node).borderRadius)).toBe(
    await sidebar.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--ns-radius-card').trim()
    ),
  );
  await shell.screenshot({ path: info.outputPath('shell-floating.png') });
  await page.getByRole('button', { name: 'Inset sidebar' }).click();
  await expect(sidebar).toHaveAttribute('data-variant', 'inset');
  expect(
    await shell.locator('.ns-dashboard__main').evaluate((node) => getComputedStyle(node).margin),
  ).toBe('8px');
  await page.setViewportSize({ width: 390, height: 900 });
  await shell.locator('[data-scope="sidebar-toggle"]').click();
  const dialog = shell.locator('dialog');
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Floating sidebar' }).evaluate((node) =>
    (node as HTMLElement).click()
  );
  const panel = await sidebar.boundingBox(), drawer = await dialog.boundingBox();
  expect(panel!.height).toBeLessThanOrEqual(drawer!.height - 16);
  expect(panel!.y - drawer!.y).toBe(8);
  await dialog.screenshot({ path: info.outputPath('shell-mobile-floating.png') });
});
