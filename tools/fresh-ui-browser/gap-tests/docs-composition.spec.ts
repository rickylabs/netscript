import { expect, type Locator, type Page, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const errors: string[] = [];
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/docs-composition?scheme=' + info.project.use.colorScheme);
  await expect(page.getByRole('heading', { name: 'Docs composition examples' }))
    .toBeVisible();
});
test.afterEach(() => expect(errors).toEqual([]));

/** Independent native query reference, never inferred from a component's own display. */
async function nativeBand(
  block: Locator,
): Promise<'small' | 'middle' | 'wide'> {
  return await block.evaluate((element) => {
    const probe = document.createElement('div'),
      child = document.createElement('span');
    const style = document.createElement('style');
    probe.style.cssText = 'container: docs-contract-probe / inline-size; position: fixed;';
    probe.style.width = getComputedStyle(element).width;
    child.id = 'docs-native-query-reference';
    style.textContent = `
      @container docs-contract-probe (width <= 767px) { #docs-native-query-reference { --small: 1; } }
      @container docs-contract-probe (767px < width <= 1100px) { #docs-native-query-reference { --middle: 1; } }
      @container docs-contract-probe (width > 1100px) { #docs-native-query-reference { --wide: 1; } }
    `;
    probe.append(child);
    document.head.append(style);
    document.body.append(probe);
    try {
      const css = getComputedStyle(child);
      const matches = (['small', 'middle', 'wide'] as const).filter((band) =>
        css.getPropertyValue('--' + band).trim() === '1'
      );
      if (matches.length !== 1) {
        throw new Error('Exactly one independent native band must match.');
      }
      return matches[0];
    } finally {
      probe.remove();
      style.remove();
    }
  });
}

async function axeClean(page: Page) {
  const axe = await new AxeBuilder({ page }).include('main').analyze();
  expect(
    axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual(
    [],
  );
}

async function geometry(page: Page) {
  for (const variant of ['ruled', 'feature']) {
    for (const request of [2, 3, 4]) {
      const root = page.locator('#grid-' + variant + '-' + request);
      const band = await nativeBand(root);
      const columns = band === 'small' ? 1 : band === 'middle' ? 2 : request;
      const result = await root.evaluate((element) => {
        const grid = element.querySelector<HTMLElement>(
          ':scope > [data-part="grid"]',
        )!;
        const css = getComputedStyle(grid);
        return {
          tracks: css.gridTemplateColumns.split(' ').map(Number.parseFloat),
          gap: parseFloat(css.columnGap) || 0,
          top: parseFloat(css.borderBlockStartWidth),
          overflow: element.scrollWidth - element.clientWidth,
          cells: [...grid.children].map((cell) => {
            const box = cell.getBoundingClientRect(),
              style = getComputedStyle(cell);
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              end: parseFloat(style.borderInlineEndWidth),
              bottom: parseFloat(style.borderBlockEndWidth),
              overflow: cell.scrollWidth - cell.clientWidth,
              cardTop: parseFloat(
                getComputedStyle(cell.firstElementChild!).borderBlockStartWidth,
              ),
            };
          }),
        };
      });
      expect(result.tracks).toHaveLength(columns);
      expect(result.gap).toBe(variant === 'feature' ? 32 : 0);
      expect(result.top).toBe(variant === 'ruled' ? 1 : 0);
      expect(result.overflow).toBeLessThanOrEqual(1);
      for (const [i, cell] of result.cells.entries()) {
        expect(cell.end).toBe(
          variant === 'ruled' && (i + 1) % columns !== 0 ? 1 : 0,
        );
        expect(cell.bottom).toBe(variant === 'ruled' ? 1 : 0);
        expect(cell.cardTop).toBe(variant === 'feature' ? 1 : 0);
        expect(cell.overflow).toBeLessThanOrEqual(1);
        expect(cell.width).toBeGreaterThan(0);
        if (i > 0 && i % columns !== 0) {
          expect(Math.abs(cell.y - result.cells[i - 1].y)).toBeLessThan(
            1 / 64 + 0.001,
          );
          expect(Math.abs(cell.x - result.cells[i - 1].x))
            .toBeCloseTo(result.cells[i - 1].width + result.gap, 1);
        }
      }
    }
  }
  for (const layout of ['split', 'centered']) {
    const root = page.locator('#hero-' + layout), band = await nativeBand(root);
    const expectedColumns = band === 'small' || layout === 'centered' ? 1 : 2;
    const result = await root.evaluate((element) => {
      const inner = element.querySelector<HTMLElement>(
        ':scope > [data-part="layout"]',
      )!;
      const style = getComputedStyle(inner);
      const title = element.querySelector<HTMLElement>(
        '[data-scope="hero"][data-part="title"]',
      )!;
      const font = getComputedStyle(title);
      const display = element.querySelector('[data-part="display"]')!
        .getBoundingClientRect();
      const aside = element.querySelector('[data-part="aside"]')!
        .getBoundingClientRect();
      return {
        columns: style.gridTemplateColumns.split(' ').map(Number.parseFloat),
        gap: parseFloat(style.columnGap),
        padding: parseFloat(style.paddingInlineStart),
        width: inner.getBoundingClientRect().width,
        fontSize: font.fontSize,
        lineHeight: font.lineHeight,
        overflow: element.scrollWidth - element.clientWidth,
        display: { x: display.x, y: display.y, width: display.width },
        aside: { x: aside.x, y: aside.y, width: aside.width },
      };
    });
    expect(result.columns).toHaveLength(expectedColumns);
    expect(result.gap).toBe(
      band === 'small' ? 32 : band === 'middle' ? 40 : 80,
    );
    expect(result.padding).toBe(band === 'small' ? 20 : 0);
    expect(result.fontSize).toBe(band === 'small' ? '48px' : '64px');
    expect(result.lineHeight).toBe(band === 'small' ? '52px' : '68px');
    expect(result.width).toBeLessThanOrEqual(1120);
    expect(result.overflow).toBeLessThanOrEqual(1);
    if (expectedColumns === 2) {
      expect(result.columns[0] / result.columns[1]).toBeCloseTo(
        band === 'middle' ? 1.5 : 17 / 9,
        2,
      );
    } else expect(result.aside.y).toBeGreaterThan(result.display.y);
    await expect(root).not.toHaveAttribute('data-breakpoint');
    await expect(root.locator('[data-scope="hero"][data-part="path-stack"]'))
      .toHaveCount(1);
    await expect(
      root.locator(
        '[data-scope="hero"][data-part="aside"] [data-part="path-stack"]',
      ),
    )
      .toHaveCount(1);
  }
}

test('ruled-grid/native-child-controls', async ({ page }) => {
  const grid = page.locator('#grid-ruled-2');
  await page.locator('#before-composition').focus();
  await page.keyboard.press('Tab');
  const link = grid.getByRole('link', {
    name: 'The contract is the spine 1',
    exact: true,
  });
  await expect(link).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(grid.getByRole('button', { name: 'Inspect 1', exact: true }))
    .toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Composition actions')).toHaveText('1');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Composition actions')).toHaveText('2');
  await page.keyboard.press('Shift+Tab');
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#cell-0$/);
  await expect(grid.locator('[tabindex]')).toHaveCount(0);
});

test('hero/native-actions-and-paths', async ({ page }) => {
  const hero = page.locator('#hero-split');
  const start = hero.getByRole('button', {
    name: 'Start a workspace',
    exact: true,
  });
  await start.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Composition actions')).toHaveText('2');
  await page.keyboard.press('Tab');
  await expect(hero.getByRole('link', { name: 'Why NetScript' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(hero.getByRole('button', { name: 'Copy code' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(hero.getByRole('region', { name: 'bash content', exact: true }))
    .toBeFocused();
  await page.keyboard.press('Tab');
  await expect(hero.getByRole('button', { name: 'Copy path' }).first())
    .toBeFocused();
  await page.keyboard.press('Tab');
  await expect(hero.getByRole('button', { name: 'Copy path' }).last())
    .toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(hero.getByRole('button', { name: 'Copy path' }).first())
    .toBeFocused();
  await expect(hero.locator('[data-scope="hero"][tabindex]')).toHaveCount(0);
});

test('docs-composition/complementary-container-bands-and-logical-rules', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const dir of ['ltr', 'rtl']) {
    await page.locator('html').evaluate(
      (e, value) => e.setAttribute('dir', value),
      dir,
    );
    for (const width of [767, 767.5, 768, 1100, 1100.5, 1101, 1120]) {
      await page.locator('#geometry-host').evaluate(
        (e, value) => e.style.width = value + 'px',
        width,
      );
      await geometry(page);
    }
  }
  await page.locator('#geometry-host').evaluate((e) => e.style.width = '100%');
  await axeClean(page);
});

test(
  'docs-composition/real-shell-content-width-drives-layout',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const dir of ['ltr', 'rtl']) {
      await page.goto(
        '/docs-composition-shell?scheme=' + info.project.use.colorScheme +
          '&dir=' + dir,
      );
      await expect(
        page.getByRole('heading', { name: 'Real Shell composition' }),
      ).toBeVisible();
      expect(
        await page.locator('#hero-split').evaluate((e) => e.getBoundingClientRect().width),
      )
        .toBeLessThan(768);
      await geometry(page);
      expect(
        await page.locator('body').evaluate((e) => e.scrollWidth - e.clientWidth),
      )
        .toBeLessThanOrEqual(1);
      await axeClean(page);
    }
  },
);

test(
  'docs-composition/forced-breakpoints-empty-slots-and-native-ssr',
  async ({ page }, info) => {
    for (const layout of ['split', 'centered']) {
      for (const breakpoint of ['desktop', 'mobile']) {
        const hero = page.locator('#hero-' + breakpoint + '-' + layout);
        const inner = hero.locator(':scope > [data-part="layout"]');
        const columns = await inner.evaluate((e) =>
          getComputedStyle(e).gridTemplateColumns.split(' ')
        );
        expect(columns).toHaveLength(
          breakpoint === 'desktop' && layout === 'split' ? 2 : 1,
        );
        await expect(hero.locator('[data-scope="hero"][data-part="title"]'))
          .toHaveCSS('font-size', breakpoint === 'mobile' ? '48px' : '64px');
        await expect(hero).toHaveAttribute('data-breakpoint', breakpoint);
      }
    }
    await expect(page.locator('#hero-minimal [data-part="aside"]')).toHaveCount(
      0,
    );
    await expect(
      page.locator(
        '#hero-paths-only [data-part="aside"] [data-part="path-stack"]',
      ),
    )
      .toHaveCount(1);
    const context = await page.context().browser()!.newContext({
      javaScriptEnabled: false,
      viewport: info.project.use.viewport,
      colorScheme: info.project.use.colorScheme,
    });
    try {
      const native = await context.newPage();
      await native.goto(new URL('/docs-composition-static', page.url()).href);
      await expect(native.locator('#hero-split h2')).toBeVisible();
      await native.locator('#grid-ruled-2 a').first().focus();
      await native.keyboard.press('Enter');
      await expect(native).toHaveURL(/#cell-0$/);
      await expect(native.locator('#hero-split')).not.toHaveAttribute(
        'data-breakpoint',
      );
    } finally {
      await context.close();
    }
  },
);

test(
  'docs-composition/utility-roles-hover-and-captures',
  async ({ page }, info) => {
    for (
      const id of [
        'reference-grid-ruled-3',
        'reference-grid-feature-3',
        'hero-split',
        'hero-centered',
      ]
    ) {
      const root = page.locator('#' + id);
      const roles = await root.evaluate((e) => {
        const css = getComputedStyle(e);
        return [
          'fg',
          'muted-fg',
          'bg',
          'surface',
          'border',
          'border-subtle',
          'topbar-rule',
          'topbar-rule-width',
          'ring',
          'font-sans',
          'font-heading',
          'font-mono',
          'text-caption',
          'leading-caption',
          'weight-label',
          'text-display',
          'leading-display',
          'tracking-display',
          'weight-display',
          'text-title',
          'leading-title',
          'tracking-title',
          'weight-title',
          'hero-pad',
          'hero-bg',
          'text-body',
          'leading-body',
          'studio-prose-lede-size',
          'studio-prose-lede-line',
        ].map((name) => [name, css.getPropertyValue('--ns-' + name).trim()]);
      });
      for (const [name, value] of roles) expect(value, name).not.toBe('');
      if (id.startsWith('reference-grid-ruled')) {
        const card = root.locator('[data-part="card"]').first();
        await card.hover();
        const same = await card.evaluate((e) =>
          getComputedStyle(e).backgroundColor ===
            getComputedStyle(document.documentElement).getPropertyValue(
              '--ns-surface',
            ).trim()
        );
        // Compare resolved paints, since the theme can serialize the same colour differently.
        const paint = await card.evaluate((e) => {
          const probe = document.createElement('span');
          probe.style.backgroundColor = 'var(--ns-surface)';
          e.append(probe);
          try {
            return [
              getComputedStyle(e).backgroundColor,
              getComputedStyle(probe).backgroundColor,
            ];
          } finally {
            probe.remove();
          }
        });
        expect(same || paint[0] === paint[1]).toBe(true);
      }
      await root.screenshot({ path: info.outputPath(id + '.png') });
    }
    await axeClean(page);
  },
);

test('docs-composition/nested-source-style-containment', async ({ page }) => {
  await expect(page.locator('#contained-grid [data-part="title"]')).toHaveCSS(
    'font-size',
    '16px',
  );
  await expect(page.locator('#contained-desktop-hero [data-part="title"]'))
    .toHaveCSS('font-size', '64px');
  await expect(
    page.locator(
      '#hero-containment > [data-part="layout"] > [data-part="display"] > [data-part="title"]',
    ),
  ).toHaveCSS('font-size', '48px');
});
