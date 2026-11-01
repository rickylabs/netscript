import { expect, type Page, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const errors: string[] = [];
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(
    '/docs-navigation?scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light'),
  );
  await expect(page.getByRole('heading', { name: 'Docs navigation examples' })).toBeVisible();
});
test.afterEach(() => expect(errors).toEqual([]));

async function axeClean(page: Page) {
  const result = await new AxeBuilder({ page }).include('main').analyze();
  expect(result.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
    [],
  );
}

test('toc/native-links-and-disclosure', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Controlled outline', exact: true });
  const summary = nav.locator('summary');
  const details = nav.locator('details');
  await expect(details).not.toHaveAttribute('open');
  await page.locator('#before-outline').focus();
  await page.keyboard.press('Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-outline')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Details', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#doc-details$/);
  await expect(page.getByLabel('Current proposals')).toHaveText('["doc-details:hash"]');
  await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(nav.getByRole('link', { name: 'Details', exact: true })).not.toHaveAttribute(
    'aria-current',
  );
  // Repeated observer/host updates cannot repeat the refused proposal or close native details.
  await page.getByRole('button', { name: 'Refresh host' }).click();
  await expect(details).toHaveAttribute('open', '');
  await expect(page.getByLabel('Current proposals')).toHaveText('["doc-details:hash"]');
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await axeClean(page);
});

test('toc/controlled-acceptance-null-and-missing-targets', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Controlled outline', exact: true });
  await page.getByRole('button', { name: 'Accept current', exact: true }).click();
  await nav.locator('summary').click();
  await nav.getByRole('link', { name: 'Details', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('link', { name: 'Details', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(nav.locator('[data-part="current"]')).toHaveText('Details');
  await nav.getByRole('link', { name: 'Missing target' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#missing-target$/);
  await expect(page.getByLabel('Current proposals')).toHaveText('["doc-details:hash"]');
  await expect(nav.getByRole('link', { name: 'Details', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await page.getByRole('button', { name: 'Clear current', exact: true }).click();
  await expect(nav.locator('[aria-current]')).toHaveCount(0);
  await expect(nav.locator('[data-part="marker"]')).toHaveCount(0);
  await expect(nav.locator('[data-part="current"]')).toHaveText('Controlled outline');
  await expect(nav.locator('details')).toHaveAttribute('open', '');
});

test('toc/initial-hash-precedence-dedup-and-unmount-cleanup', async ({ page }, info) => {
  await page.goto(
    '/docs-navigation?scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light') +
      '#doc-details',
  );
  const responsive = page.getByRole('navigation', { name: 'Responsive outline', exact: true });
  await expect(responsive.locator('a[href="#doc-details"]')).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(page.getByLabel('Responsive proposals')).toHaveText('["doc-details:hash"]');
  await page.getByRole('button', { name: 'Refresh host' }).click();
  await expect(page.getByLabel('Responsive proposals')).toHaveText('["doc-details:hash"]');
  await page.getByRole('button', { name: 'Toggle outline mount' }).click();
  await expect(responsive).toHaveCount(0);
  const before = await page.getByLabel('Responsive proposals').textContent();
  // A different real native link still navigates after the root and its owned listeners are gone.
  const native = page.locator('#external-native-link');
  await native.evaluate((e) => e.setAttribute('href', '#doc-overview'));
  await native.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#doc-overview$/);
  await expect(page.getByLabel('Responsive proposals')).toHaveText(before!);
  await page.getByRole('button', { name: 'Toggle outline mount' }).click();
  await expect(responsive.locator('a[href="#doc-overview"]')).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(page.getByLabel('Responsive proposals')).toHaveText(before!);
});

test('toc/responsive-own-focus-handoff-and-ordinary-other-focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const nav = page.getByRole('navigation', { name: 'Responsive outline', exact: true });
  await expect(nav).toHaveAttribute('data-breakpoint', 'desktop');
  await nav.getByRole('link', { name: 'Details', exact: true }).focus();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(nav).toHaveAttribute('data-breakpoint', 'mobile');
  await expect(nav.locator('summary')).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
  const outside = page.getByRole('button', { name: 'Refresh host' });
  await outside.focus();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(nav).toHaveAttribute('data-breakpoint', 'mobile');
  await expect(outside).toBeFocused();
});

test('toc/nested-navigation-roots-own-only-their-links', async ({ page }) => {
  const outer = page.getByRole('navigation', { name: 'Outer outline', exact: true });
  const inner = page.getByRole('navigation', { name: 'Inner outline', exact: true });
  await inner.getByRole('link', { name: 'Inner details' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#doc-details$/);
  await expect(page.getByLabel('Inner proposals')).toHaveText('["doc-details"]');
  await expect(page.getByLabel('Outer proposals')).toHaveText('[]');
  await expect(outer.getByRole('link', { name: 'Outer overview' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(inner.getByRole('link', { name: 'Inner details' })).toHaveAttribute(
    'aria-current',
    'location',
  );
});

test(
  'toc/decoded-initial-hash-and-malformed-hash-do-not-invent-current',
  async ({ page }, info) => {
    await page.goto(
      '/docs-navigation?scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light') +
        '#encoded%20%22%5B%5D',
    );
    const nav = page.getByRole('navigation', { name: 'Responsive outline', exact: true });
    const encoded = nav.locator('a[href="#encoded%20%22%5B%5D"]');
    await expect(encoded).toHaveAttribute('aria-current', 'location');
    await expect(page.getByLabel('Responsive proposals')).toHaveText(
      JSON.stringify(['encoded "[]:hash']),
    );
    const before = await page.getByLabel('Responsive proposals').textContent();
    const native = page.locator('#external-native-link');
    await native.evaluate((e) => e.setAttribute('href', '#%XX'));
    await native.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#%XX$/);
    await expect(encoded).toHaveAttribute('aria-current', 'location');
    await expect(page.getByLabel('Responsive proposals')).toHaveText(before!);
  },
);

test('anchor-nav/unmount-releases-passive-observation-without-late-proposals', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Document sections', exact: true });
  const details = nav.getByRole('link', { name: 'Details', exact: true });
  await details.focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('aria-current', 'location');
  await page.getByRole('button', { name: 'Toggle outline mount' }).click();
  await expect(nav).toHaveCount(0);
  const before = await page.getByLabel('Observed proposals').textContent();
  const native = page.locator('#external-native-link');
  await native.evaluate((e) => e.setAttribute('href', '#doc-final'));
  await native.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#doc-final$/);
  await page.evaluate(() => dispatchEvent(new Event('resize')));
  await expect(page.getByLabel('Observed proposals')).toHaveText(before!);
});

test('anchor-nav/native-links-and-current', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Document sections', exact: true });
  const overview = nav.getByRole('link', { name: 'Overview', exact: true });
  await overview.focus();
  await page.keyboard.press('Tab');
  const details = nav.getByRole('link', { name: 'Details', exact: true });
  await expect(details).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(overview).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#doc-details$/);
  await expect(details).toHaveAttribute('aria-current', 'location');
  await expect(nav).toHaveAttribute('data-state', 'scrolled');
  const geometry = await page.locator('#doc-details').evaluate((e) => ({
    top: e.getBoundingClientRect().top,
    margin: parseFloat(getComputedStyle(e).scrollMarginBlockStart),
    padding: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart),
  }));
  expect(Math.abs(geometry.top - geometry.margin - geometry.padding)).toBeLessThanOrEqual(1);
  await expect(nav.locator('[role="tab"], [role="tablist"], [tabindex]')).toHaveCount(0);
  await axeClean(page);
});

test('anchor-nav/percentage-scroll-padding-follows-native-window-and-nested-geometry', async ({ page }) => {
  await page.locator('html').evaluate((e) => e.style.scrollPaddingBlockStart = '10%');
  const nav = page.getByRole('navigation', { name: 'Document sections', exact: true });
  const details = nav.getByRole('link', { name: 'Details', exact: true });
  await details.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#doc-details$/);
  const windowGeometry = await page.locator('#doc-details').evaluate((e) => ({
    top: e.getBoundingClientRect().top,
    expected: innerHeight * 0.1 + parseFloat(getComputedStyle(e).scrollMarginBlockStart),
    padding: getComputedStyle(document.documentElement).scrollPaddingBlockStart,
  }));
  expect(windowGeometry.padding).toBe('10%');
  expect(Math.abs(windowGeometry.top - windowGeometry.expected)).toBeLessThanOrEqual(1);
  // Let both the native scroll event and the observer's coalesced frame settle after the hash proposal.
  await page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
  await expect(details).toHaveAttribute('aria-current', 'location');
  const nested = page.locator('#nested-scroll');
  await nested.evaluate((e) => e.style.scrollPaddingBlockStart = '10%');
  const nestedDetails = nested.getByRole('link', { name: 'Nested details', exact: true });
  await nestedDetails.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#nested-details$/);
  const nestedGeometry = await nested.evaluate((e) => {
    const target = document.getElementById('nested-details')!;
    return {
      top: target.getBoundingClientRect().top - e.getBoundingClientRect().top - e.clientTop,
      expected: e.clientHeight * 0.1 + parseFloat(getComputedStyle(target).scrollMarginBlockStart),
    };
  });
  expect(Math.abs(nestedGeometry.top - nestedGeometry.expected)).toBeLessThanOrEqual(1);
  await page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
  await expect(nestedDetails).toHaveAttribute('aria-current', 'location');
});

test('anchor-nav/passive-window-and-nested-end-tracking-without-hash-or-focus-writes', async ({ page }) => {
  const windowNav = page.getByRole('navigation', { name: 'Document sections', exact: true });
  const nestedNav = page.getByRole('navigation', { name: 'Nested sections', exact: true });
  const focus = page.getByRole('button', { name: 'Refresh host' });
  await focus.focus();
  const url = page.url();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(windowNav.getByRole('link', { name: 'Final', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(focus).toBeFocused();
  expect(page.url()).toBe(url);
  await page.locator('#nested-scroll').evaluate((e) => e.scrollTop = e.scrollHeight);
  await expect(nestedNav.getByRole('link', { name: 'Nested final', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(focus).toBeFocused();
  expect(page.url()).toBe(url);
});

test('anchor-nav/nested-native-offsets-and-late-heading-discovery', async ({ page }) => {
  const nested = page.locator('#nested-scroll');
  const nav = nested.getByRole('navigation');
  await nav.getByRole('link', { name: 'Nested details', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#nested-details$/);
  await expect(nav.getByRole('link', { name: 'Nested details', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
  const geometry = await nested.evaluate((e) => {
    const heading = document.getElementById('nested-details')!;
    return {
      delta: heading.getBoundingClientRect().top - e.getBoundingClientRect().top - e.clientTop,
      padding: parseFloat(getComputedStyle(e).scrollPaddingBlockStart),
      margin: parseFloat(getComputedStyle(heading).scrollMarginBlockStart),
    };
  });
  expect(Math.abs(geometry.delta - geometry.padding - geometry.margin)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Add late heading' }).click();
  const windowNav = page.getByRole('navigation', { name: 'Document sections', exact: true });
  await windowNav.getByRole('link', { name: 'Late heading', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#late-heading$/);
  await expect(windowNav.getByRole('link', { name: 'Late heading', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
});

test(
  'docs-navigation/server-only-narrow-native-links-and-disclosure',
  async ({ browser }, info) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 900 },
      colorScheme: info.project.use.colorScheme,
    });
    try {
      const page = await context.newPage();
      await page.goto('/docs-navigation-static');
      const desktop = page.getByRole('navigation', { name: 'Static outline', exact: true });
      await expect(desktop).toHaveAttribute('data-breakpoint', 'desktop');
      await expect(desktop.locator('[data-part="marker"]')).toHaveCount(0);
      await desktop.getByRole('link', { name: 'Configuration', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/#static-configuration$/);
      const mobile = page.getByRole('navigation', { name: 'Static mobile outline' });
      await mobile.locator('summary').focus();
      await page.keyboard.press('Space');
      await expect(mobile.locator('details')).toHaveAttribute('open', '');
      expect(await page.locator('html').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
    } finally {
      await context.close();
    }
  },
);

test('docs-navigation/utility-geometry-rtl-captures-and-axe', async ({ page }, info) => {
  for (const dir of ['ltr', 'rtl']) {
    await page.locator('html').evaluate((e, d) => e.setAttribute('dir', d), dir);
    const controlled = page.getByRole('navigation', { name: 'Controlled outline', exact: true });
    expect(Math.abs((await controlled.locator('summary').boundingBox())!.height - 48))
      .toBeLessThanOrEqual(1 / 64);
    const nav = page.getByRole('navigation', { name: 'Document sections', exact: true });
    const family = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.fontFamily = 'var(--ns-font-sans)';
      document.body.append(probe);
      const family = getComputedStyle(probe).fontFamily;
      probe.remove();
      return family;
    });
    await expect(nav).toHaveCSS('font-family', family);
    const missingRoles = await nav.evaluate((element) => {
      const roles = new Set<string>();
      for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
          if (
            rule instanceof CSSStyleRule && /\.ns-(toc|anchor-nav)(?:\b|__)/.test(rule.selectorText)
          ) {
            for (const match of rule.style.cssText.matchAll(/var\((--[\w-]+)/g)) {
              roles.add(match[1]);
            }
          }
        }
      }
      return {
        count: roles.size,
        missing: [...roles].filter((role) =>
          !getComputedStyle(element).getPropertyValue(role).trim()
        ),
      };
    });
    expect(missingRoles.count).toBeGreaterThan(0);
    expect(missingRoles.missing).toEqual([]);
    await expect(nav).toHaveCSS('height', '44px');
    expect(Math.abs((await nav.boundingBox())!.height - 44)).toBeLessThanOrEqual(1 / 64);
    await expect(nav).toHaveCSS('box-shadow', 'none');
    const responsive = page.getByRole('navigation', { name: 'Responsive outline', exact: true });
    await expect(responsive).toHaveCSS('font-family', family);
    if (info.project.use.viewport?.width === 1280) {
      expect((await responsive.boundingBox())!.width).toBe(240);
      await expect(responsive.locator('[data-part="item"]').first()).toHaveCSS('font-size', '13px');
      await expect(responsive.locator('[data-part="item"]').first()).toHaveCSS(
        'line-height',
        '20px',
      );
      await expect(responsive.locator('[data-level="3"]')).toHaveCSS(
        'padding-inline-start',
        '24px',
      );
    }
    expect(await page.locator('html').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
    await controlled.screenshot({ path: info.outputPath('toc-mobile-' + dir + '.png') });
    await responsive.screenshot({ path: info.outputPath('toc-responsive-' + dir + '.png') });
    await nav.screenshot({ path: info.outputPath('anchor-nav-' + dir + '.png') });
    await axeClean(page);
  }
});

test('docs-navigation/shell-composes-real-Toc-through-existing-slots', async ({ page }, info) => {
  await page.goto(
    '/shell?layout=docs&scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light'),
  );
  const shell = page.locator('#shell-example');
  const narrow = (info.project.use.viewport?.width ?? 390) < 1024;
  const nav = shell.locator(
    narrow ? '[data-part="mobile-rail"] .ns-toc' : '[data-part="rail"] .ns-toc',
  );
  await expect(nav).toBeVisible();
  if (narrow) {
    await nav.locator('summary').focus();
    await page.keyboard.press('Enter');
  }
  await nav.getByRole('link', { name: 'Installation', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#section$/);
  await expect(nav.getByRole('link', { name: 'Installation', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
});

async function settledFrames(page: Page) {
  await page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
}

async function windowCrossing(page: Page, id: string) {
  const expected = await page.locator('#' + id).evaluate((target) => {
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) +
      parseFloat(getComputedStyle(target).scrollMarginBlockStart);
    scrollTo(0, target.getBoundingClientRect().top + scrollY - offset);
    return offset;
  });
  await settledFrames(page);
  expect(
    Math.abs(
      await page.locator('#' + id).evaluate((target) => target.getBoundingClientRect().top) -
        expected,
    ),
  ).toBeLessThanOrEqual(1);
}

test(
  'docs-navigation/real-inset-Shell-observation-uses-the-window-in-both-directions',
  async ({ page }, info) => {
    for (const dir of ['ltr', 'rtl']) {
      await page.goto(
        '/docs-navigation-inset-static?scheme=' +
          (info.project.use.colorScheme === 'dark' ? 'dark' : 'light') + '&dir=' + dir,
      );
      await expect(page.getByRole('heading', { name: 'Inset document navigation' })).toBeVisible();
      const shell = page.locator('#observed-inset-shell');
      await expect(shell.locator('.ns-dashboard__disclosure')).toHaveCount(1);
      const main = shell.locator('.ns-dashboard__main');
      await expect(main).toHaveCSS('overflow-y', 'hidden');
      expect(await main.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
      const toc = shell.locator(
        (info.project.use.viewport?.width ?? 390) < 1024
          ? '#inset-mobile-island .ns-toc'
          : '#inset-desktop-island .ns-toc',
      );
      const nav = page.getByRole('navigation', { name: 'Inset sections', exact: true });
      await expect(toc).toBeVisible();
      await expect(toc.locator('a[href="#inset-overview"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(nav).toHaveAttribute('data-state', 'rest');
      const focus = page.locator('#inset-focus');
      await focus.focus();
      const url = page.url();
      await windowCrossing(page, 'inset-details');
      await expect(toc.locator('a[href="#inset-details"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(nav.getByRole('link', { name: 'Details', exact: true })).toHaveAttribute(
        'aria-current',
        'location',
      );
      expect((await nav.boundingBox())!.y + (await nav.boundingBox())!.height).toBeLessThan(0);
      await expect(nav).toHaveAttribute('data-state', 'rest');
      await expect(toc.locator('a[href="#inset-final"]')).not.toHaveAttribute('aria-current');
      await expect(focus).toBeFocused();
      expect(page.url()).toBe(url);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await settledFrames(page);
      await expect(toc.locator('a[href="#inset-final"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(nav.getByRole('link', { name: 'Final', exact: true })).toHaveAttribute(
        'aria-current',
        'location',
      );
      expect(
        await page.evaluate(() =>
          Math.abs(document.documentElement.scrollHeight - innerHeight - scrollY)
        ),
      ).toBeLessThanOrEqual(1);
      await expect(nav).toHaveAttribute('data-state', 'rest');
      await axeClean(page);
    }
  },
);

test(
  'docs-navigation/non-scrolling-clipping-and-live-ancestor-overflow-rediscovery',
  async ({ page }, info) => {
    for (const dir of ['ltr', 'rtl']) {
      const query = '?scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light') +
        '&dir=' + dir;
      await page.goto('/docs-navigation-composition' + query);
      const wrapper = page.locator('#clip-wrapper');
      const toc = page.getByRole('navigation', { name: 'Clipped outline', exact: true });
      const nav = page.getByRole('navigation', { name: 'Clipped sections', exact: true });
      await expect(wrapper).toHaveCSS('overflow-x', 'hidden');
      await expect(wrapper).toHaveCSS('overflow-y', 'auto');
      expect(await wrapper.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
      await expect(toc.locator('a[href="#clip-overview"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      const focus = page.locator('#clip-focus');
      await focus.focus();
      const url = page.url();
      await windowCrossing(page, 'clip-details');
      await expect(toc.locator('a[href="#clip-details"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(nav.getByRole('link', { name: 'Details', exact: true })).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(toc.locator('a[href="#clip-final"]')).not.toHaveAttribute('aria-current');
      expect((await nav.boundingBox())!.y + (await nav.boundingBox())!.height).toBeLessThan(0);
      await expect(nav).toHaveAttribute('data-state', 'rest');
      await expect(focus).toBeFocused();
      expect(page.url()).toBe(url);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await settledFrames(page);
      await expect(toc.locator('a[href="#clip-final"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(nav).toHaveAttribute('data-state', 'rest');
      // Compact content and a fixed outer frame keep document/heading/nav boxes stable during parent resize.
      await page.goto('/docs-navigation-composition' + query + '&compact=true');
      await expect(toc.locator('a[href="#clip-final"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      const original = await wrapper.evaluate((e) => e.getBoundingClientRect().height);
      const resize = async (height: number) => {
        const observed = await wrapper.evaluate(async (e, height) => {
          let mutations = 0;
          let scrolls = 0;
          const observer = new MutationObserver(() => mutations++);
          observer.observe(e, { attributes: true });
          const scroll = () => scrolls++;
          document.addEventListener('scroll', scroll, true);
          const animation = e.animate([{ height: getComputedStyle(e).height }, {
            height: height + 'px',
          }], { duration: 1, fill: 'forwards' });
          await animation.finished;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          );
          observer.disconnect();
          document.removeEventListener('scroll', scroll, true);
          return {
            mutations,
            scrolls,
            overflow: e.scrollHeight - e.clientHeight,
            height: e.getBoundingClientRect().height,
          };
        }, height);
        expect(observed.mutations).toBe(0);
        expect(observed.scrolls).toBe(0);
        expect(Math.abs(observed.height - height)).toBeLessThanOrEqual(1 / 64);
        return observed;
      };
      expect((await resize(220)).overflow).toBeGreaterThan(1);
      await expect(toc.locator('a[href="#clip-overview"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      expect((await resize(Math.ceil(original) + 2)).overflow).toBeLessThanOrEqual(1);
      await expect(toc.locator('a[href="#clip-final"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      // Caller content changes alter overflow without replacing any linked heading or navigation node.
      await page.locator('#clip-final').evaluate((target) => {
        const filler = document.createElement('div');
        filler.id = 'composition-filler';
        filler.style.blockSize = '1000px';
        filler.textContent = 'Additional caller content';
        target.before(filler);
      });
      expect(await wrapper.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeGreaterThan(1);
      await expect(toc.locator('a[href="#clip-overview"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await page.locator('#composition-filler').evaluate((e) => e.remove());
      await expect(toc.locator('a[href="#clip-final"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await axeClean(page);
    }
  },
);
