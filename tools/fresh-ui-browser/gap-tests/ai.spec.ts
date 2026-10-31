import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const errors: string[] = [];
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (e) => {
    if (e.type() === 'error') errors.push(e.text());
  });
  await page.goto(
    '/ai?scheme=' +
      (info.project.use.colorScheme === 'dark' ? 'dark' : 'light'),
  );
  await expect(page.getByRole('heading', { name: 'AI component examples' }))
    .toBeVisible();
});
test.afterEach(() => {
  expect(errors).toEqual([]);
});

test('marker/native-child-focus', async ({ page }) => {
  const s = page.locator('#marker-native');
  await s.locator('[data-before-marker]').focus();
  await page.keyboard.press('Tab');
  await expect(s.getByRole('button', { name: 'Inspect event' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(s.getByLabel('Marker actions')).toHaveText('2');
  await page.keyboard.press('Tab');
  await expect(s.getByRole('link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#event$/);
  await s.getByRole('link').focus();
  await page.keyboard.press('Tab');
  await expect(s.locator('[data-after-marker]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(s.getByRole('link')).toBeFocused();
  expect(await s.locator('.ns-marker').getAttribute('tabindex')).toBeNull();
});

test('trace/native-disclosure', async ({ page }) => {
  const s = page.locator('#trace-native');
  const summaries = s.locator('summary');
  await s.locator('[data-before-trace]').focus();
  await page.keyboard.press('Tab');
  await expect(s.getByRole('button', { name: 'Inspect static step' }))
    .toBeFocused();
  await page.keyboard.press('Tab');
  await expect(summaries.nth(0)).toBeFocused();
  await expect(summaries.nth(0)).toHaveAccessibleName(
    /Search docs Running 312ms Two sources found/,
  );
  await expect(s.locator('details').nth(0)).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(s.locator('details').nth(0)).not.toHaveAttribute('open');
  await expect(s.getByText('Two sources found')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(summaries.nth(1)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(s.locator('details').nth(0)).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(s.getByRole('button', { name: 'Inspect sources' }))
    .toBeFocused();
  await page.keyboard.press('Tab');
  await expect(s.getByRole('link', { name: 'Read sources' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#sources$/);
});

test('trace/controlled-refusal-and-acceptance', async ({ page }) => {
  const s = page.locator('#trace-native');
  const summary = s.locator('summary').nth(1);
  const details = s.locator('details').nth(1);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('1');
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('2');
  await s.getByRole('checkbox').check();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('3');
  await page.keyboard.press('Tab');
  await expect(s.getByRole('button', { name: 'Controlled action' }))
    .toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('4');
});

test('trace/native-programmatic-toggle-and-unchanged-prop-reconciliation', async ({ page }) => {
  const s = page.locator('#trace-native');
  const details = s.locator('details').nth(1);
  await details.evaluate((e: HTMLDetailsElement) => {
    e.open = true;
  });
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('1');
  await expect(details).not.toHaveAttribute('open');
  await page.waitForTimeout(100);
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('1');
  await s.getByRole('checkbox').check();
  await details.evaluate((e: HTMLDetailsElement) => {
    e.open = true;
  });
  await expect(details).toHaveAttribute('open', '');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('2');
  // Simulate an outside mutation whose toggle event is intercepted by another host listener.
  await details.evaluate((e: HTMLDetailsElement) => {
    e.addEventListener('toggle', (event) => event.stopImmediatePropagation(), {
      capture: true,
      once: true,
    });
    e.open = false;
  });
  await expect(details).not.toHaveAttribute('open');
  await page.waitForTimeout(50);
  await s.getByRole('button', { name: 'Rerender unchanged disclosure' })
    .click();
  await expect(details).toHaveAttribute('open', '');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('2');
});

test('attachment/native-actions', async ({ page }) => {
  const s = page.locator('#attachment-native');
  const action = s.getByRole('button', { name: 'Retry report' });
  await s.locator('[data-before-attachment]').focus();
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(s.getByLabel('Attachment actions')).toHaveText('2');
  await page.keyboard.press('Tab');
  await expect(s.getByRole('link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#report$/);
  await s.getByRole('link').focus();
  await page.keyboard.press('Tab');
  await expect(s.locator('[data-after-attachment]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(s.getByRole('link')).toBeFocused();
  for (const state of ['uploading', 'processing', 'error', 'done', 'idle']) {
    // DOM click avoids moving focus away from the existing native action.
    await action.focus();
    await s.getByRole('button', { name: 'Advance attachment state' }).evaluate((
      e: HTMLButtonElement,
    ) => e.click());
    await expect(s.locator('.ns-attachment')).toHaveAttribute(
      'data-state',
      state,
    );
    await expect(action).toBeFocused();
  }
});

test('ai/ledger-states-accessible-text-and-native-semantics', async ({ page }) => {
  const attachments = page.locator('#attachment-variants .ns-attachment');
  await expect(attachments).toHaveCount(30);
  for (const state of ['idle', 'uploading', 'processing', 'error', 'done']) {
    const group = attachments.filter({ has: page.locator('nothing') });
    void group;
    for (const size of ['default', 'sm', 'xs']) {
      for (const orientation of ['horizontal', 'vertical']) {
        const item = page.locator(
          '#attachment-variants .ns-attachment[data-state="' + state +
            '"][data-size="' + size + '"][data-orientation="' + orientation +
            '"]',
        );
        if (state !== 'idle') {
          const label = state[0].toUpperCase() + state.slice(1);
          await expect(item.locator('[data-part="state-label"]')).toHaveText(
            label,
          );
          expect(await item.ariaSnapshot()).toContain(label);
          await expect(item.locator('[data-part="state-icon"]'))
            .toHaveAttribute('aria-hidden', 'true');
        }
        const description = item.locator('[data-part="description"]');
        expect(await item.ariaSnapshot()).toContain(
          state === 'error' ? 'Upload failed' : 'PDF',
        );
        await expect(description).not.toHaveAttribute('aria-hidden');
        expect(await item.evaluate((e) => e.scrollWidth <= e.clientWidth + 1))
          .toBe(true);
      }
    }
  }
  expect(await page.locator('#attachment-media').ariaSnapshot()).toContain(
    'Échec du transfert',
  );
  await expect(page.getByRole('img', { name: 'Report preview' })).toBeVisible();
  await expect(page.locator('#trace-variants ol')).toHaveCount(3);
  await expect(page.locator('#trace-variants li')).toHaveCount(24);
  await expect(page.locator('#trace-variants summary')).toHaveCount(24);
  await expect(page.locator('[aria-live]')).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).include('main').analyze();
  expect(
    axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
});

test('ai/utility-geometry-reduced-motion-and-rtl', async ({ page }, info) => {
  for (const dir of ['ltr', 'rtl']) {
    await page.locator('html').evaluate(
      (e, d) => e.setAttribute('dir', d),
      dir,
    );
    const rules = await page.locator(
      '#marker-variants .ns-marker[data-variant="separator"]',
    ).evaluate((e) => {
      const s = getComputedStyle(e, '::before');
      return [s.height, s.borderTopWidth];
    });
    expect(rules).toEqual(['2px', '1px']);
    for (
      const [size, px] of [['default', 40], ['sm', 32], ['xs', 24]] as const
    ) {
      const media = page.locator(
        '#attachment-variants [data-state="idle"][data-size="' + size +
          '"][data-orientation="horizontal"] > [data-part="media"]',
      );
      const box = await media.boundingBox();
      expect(box!.width).toBe(px);
      expect(box!.height).toBe(px);
    }
    const spinner = page.locator(
      '#trace-variants [data-status="running"] .ns-trace__status > span',
    ).first();
    await expect(spinner).toHaveCSS('animation-duration', '2s');
    const upload = page.locator(
      '#attachment-variants [data-state="uploading"] .ns-attachment__state > span',
    ).first();
    await expect(upload).toHaveCSS('animation-duration', '2s');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    for (
      const id of [
        'marker-variants',
        'trace-native',
        'attachment-variants',
        'attachment-media',
      ]
    ) {
      await page.locator('#' + id).screenshot({
        path: info.outputPath(id + '-' + dir + '.png'),
      });
    }
    const axe = await new AxeBuilder({ page }).include('main').analyze();
    expect(
      axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([]);
  }
});

test('trace/native-disclosure-before-hydration', async ({ browser }, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
    colorScheme: info.project.use.colorScheme,
  });
  try {
    const page = await context.newPage();
    await page.goto(String(info.project.use.baseURL) + '/ai-static');
    await expect(page.getByRole('heading', { name: 'AI component examples' })).toBeVisible();
    const s = page.locator('#trace-native');
    await s.locator('summary').nth(0).focus();
    await page.keyboard.press('Enter');
    await expect(s.locator('details').nth(0)).not.toHaveAttribute('open');
    await expect(s.getByText('Two sources found')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(s.locator('details').nth(0)).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(s.getByRole('button', { name: 'Inspect sources' })).toBeFocused();
  } finally {
    await context.close();
  }
});
test('trace/real-SSR-hydration-retains-controlled-refusal', async ({ page }) => {
  await page.goto('/ai-static');
  const s = page.locator('#trace-native');
  await s.locator('summary').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(s.locator('details').nth(1)).not.toHaveAttribute('open');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('1');
  await s.getByRole('checkbox').check();
  await s.locator('summary').nth(1).focus();
  await page.keyboard.press('Space');
  await expect(s.locator('details').nth(1)).toHaveAttribute('open', '');
  await expect(s.getByLabel('Disclosure proposals')).toHaveText('2');
});
