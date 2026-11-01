import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const browserErrors = new WeakMap<Page, string[]>();
const RAIL_CHANNEL_TOLERANCE = 1;

test.afterEach(({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test.beforeEach(async ({ page }, info) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(
    `/data-table?scheme=${info.project.use.colorScheme === 'dark' ? 'dark' : 'light'}`,
  );
  await expect(page.getByRole('heading', { name: 'Data table examples' })).toBeVisible();
});

// Subpixel query precision belongs to the native engine, not the component under test.
async function nativeTableMode(page: Page, root: Locator): Promise<'wide' | 'narrow'> {
  const inlineSize = await root.evaluate((element) => {
    const box = element.getBoundingClientRect(), style = getComputedStyle(element);
    return box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) -
      parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
  });
  const reference = await page.evaluate((size) => {
    const container = document.createElement('div');
    const probe = document.createElement('span');
    const style = document.createElement('style');
    const before = document.documentElement.scrollWidth;
    container.setAttribute('aria-hidden', 'true');
    Object.assign(container.style, {
      containerType: 'inline-size',
      containerName: 'native-table-query-reference',
      boxSizing: 'content-box',
      width: size + 'px',
      height: '1px',
      padding: '0',
      border: '0',
      position: 'fixed',
      inset: '0 auto auto 0',
      visibility: 'hidden',
      pointerEvents: 'none',
      overflow: 'clip',
    });
    probe.setAttribute('data-native-table-query-probe', '');
    style.textContent = [
      '[data-native-table-query-probe] { --native-wide: 0; --native-narrow: 0; }',
      '@container native-table-query-reference (width > 640px) { [data-native-table-query-probe] { --native-wide: 1; } }',
      '@container native-table-query-reference (max-width: 640px) { [data-native-table-query-probe] { --native-narrow: 1; } }',
    ].join('\n');
    try {
      container.append(probe);
      document.head.append(style);
      document.body.append(container);
      const measuredInlineSize = container.getBoundingClientRect().width;
      const native = getComputedStyle(probe);
      return {
        measuredInlineSize,
        wide: Number(native.getPropertyValue('--native-wide')),
        narrow: Number(native.getPropertyValue('--native-narrow')),
        before,
        after: document.documentElement.scrollWidth,
      };
    } finally {
      container.remove();
      style.remove();
    }
  }, inlineSize);
  expect(Math.abs(reference.measuredInlineSize - inlineSize)).toBeLessThanOrEqual(1 / 64);
  expect([reference.wide, reference.narrow].sort()).toEqual([0, 1]);
  expect(reference.after).toBeLessThanOrEqual(reference.before);
  if (inlineSize <= 640) expect(reference.narrow).toBe(1);
  if (inlineSize >= 641) expect(reference.wide).toBe(1);
  return reference.wide === 1 ? 'wide' : 'narrow';
}

// Read actual device pixels; a computed paint declaration alone cannot prove the logical rail.
async function expectSelectedRail(page: Page, row: Locator): Promise<void> {
  await page.mouse.move(0, 0);
  const roles = await row.evaluate((element) => {
    const probe = document.createElement('span');
    const style = getComputedStyle(element);
    Object.assign(probe.style, {
      position: 'fixed',
      visibility: 'hidden',
      width: style.getPropertyValue('--ns-space-0-5'),
      color: style.getPropertyValue('--ns-marker'),
    });
    document.body.append(probe);
    try {
      const width = parseFloat(getComputedStyle(probe).width);
      const marker = getComputedStyle(probe).color;
      probe.style.color = style.getPropertyValue('--ns-selected');
      return {
        width,
        marker,
        background: getComputedStyle(probe).color,
        direction: style.direction,
        pixelRatio: devicePixelRatio,
      };
    } finally {
      probe.remove();
    }
  });
  await expect(row).toHaveCSS('background-color', roles.background);
  const png = await row.screenshot({ scale: 'device' });
  const paint = await page.evaluate(async ({ bytes, roles }) => {
    const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('A 2D canvas is required to inspect the selected rail');
      context.drawImage(image, 0, 0);
      const railWidth = roles.width * roles.pixelRatio;
      const interior = Math.floor(railWidth / 2);
      const sample = (offset: number, opposite = false) => {
        const right = (roles.direction === 'rtl') !== opposite;
        return Array.from(
          context.getImageData(
            right ? canvas.width - 1 - offset : offset,
            Math.floor(canvas.height / 2),
            1,
            1,
          ).data,
        );
      };
      const rail = sample(interior);
      const adjacent = sample(Math.ceil(railWidth) + 1);
      const opposite = sample(interior, true);
      const color = (value: string) => {
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data);
      };
      return {
        railWidth,
        rail,
        adjacent,
        opposite,
        marker: color(roles.marker),
        background: color(roles.background),
      };
    } finally {
      image.close();
    }
  }, { bytes: Array.from(png), roles });
  expect(paint.railWidth).toBeGreaterThan(0);
  const difference = (actual: number[], expected: number[]) =>
    Math.max(...actual.map((value, index) => Math.abs(value - expected[index])));
  expect(difference(paint.rail, paint.marker)).toBeLessThanOrEqual(RAIL_CHANNEL_TOLERANCE);
  for (const background of [paint.adjacent, paint.opposite]) {
    expect(difference(background, paint.background)).toBeLessThanOrEqual(RAIL_CHANNEL_TOLERANCE);
    expect(difference(background, paint.marker)).toBeGreaterThan(RAIL_CHANNEL_TOLERANCE);
  }
}

test('data-table/child-checkbox-space-isolation', async ({ page }) => {
  const checkbox = page.getByRole('checkbox', { name: 'Select row one', exact: true });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
  await expect(checkbox).toBeChecked();
});

test('data-table/child-action-and-link-keys-remain-native', async ({ page }) => {
  const row = page.locator('#table-keyboard .ns-data-grid__body [data-type="button"]').first();
  const action = row.getByRole('button', { name: 'Row action', exact: true });
  await action.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.locator('output[aria-label="Row actions"]')).toHaveText('2');
  const link = row.getByRole('link', { name: 'Cell details', exact: true });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#cell-details$/);
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
});

test('data-table/text-selection-is-native', async ({ page }) => {
  const cell = page.locator('#table-keyboard .ns-data-grid__body [data-part="cell"]').first();
  const box = await cell.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent === 'First row') {
        const range = document.createRange();
        range.selectNode(node);
        const b = range.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      }
    }
    throw new Error('Real caller-owned cell text is required.');
  });
  await page.mouse.move(box.x + 1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  expect(await page.evaluate(() => getSelection()?.toString())).toContain('First row');
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
});

test('data-table/body-click-is-single-native-activation', async ({ page }) => {
  const row = page.locator('#table-keyboard .ns-data-grid__body [data-type="button"]').first();
  await row.locator('[data-part="cell"]').first().click();
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('1');
  await expect(page.getByLabel('Observed grid clicks')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Inspect first session' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('3');
});

for (const kind of ['modified', 'middle']) {
  test(`data-table/${kind === 'middle' ? 'middle-native-link' : 'modified-body-link'}-click-opens-native-tab`, async ({ page, context }) => {
    const body = page.locator(
      '#table-keyboard .ns-data-grid__body [data-type="link"] [data-part="cell"]',
    ).first();
    const original = page.url();
    const opened = context.waitForEvent('page', { timeout: 5000 });
    if (kind === 'modified') {
      const modifier = await page.evaluate(() =>
        /Mac/.test(navigator.platform) ? 'Meta' as const : 'Control' as const
      );
      await body.click({ modifiers: [modifier] });
    } else {await page.getByRole('link', { name: 'Open linked session', exact: true }).click({
        button: 'middle',
      });}
    const tab = await opened;
    await expect(tab).toHaveURL(/destination=linked/);
    await expect(tab.getByRole('heading', { name: 'Linked session destination', exact: true }))
      .toBeVisible();
    await tab.close();
    await expect(page).toHaveURL(original);
    await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
  });
}

test('data-table/native-table-roles-and-associations', async ({ page }) => {
  const table = page.getByRole('table', { name: 'Keyboard ownership', exact: true });
  await expect(table.getByRole('row')).toHaveCount(4);
  await expect(table.getByRole('columnheader')).toHaveCount(4);
  await expect(table.getByRole('cell')).toHaveCount(12);
  await expect(table.locator('thead th[scope="col"]')).toHaveCount(4);
  await expect(page.getByRole('grid')).toHaveCount(0);
  for (const row of await table.getByRole('row').all()) {
    await expect(row).not.toHaveAttribute('tabindex');
    await expect(row).not.toHaveAttribute('aria-selected');
  }
  await expect(page.getByRole('button', { name: 'Inspect first session' })).toHaveCount(1);
  const orders = page.locator('#orders-table').getByRole('table', { name: 'Orders', exact: true });
  await expect(orders.getByRole('columnheader', { name: 'Sort orders' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await expect(orders.getByRole('button', { name: 'Sort orders' })).toBeVisible();
  await expect(orders.getByRole('checkbox', { name: 'Select all rows', exact: true }))
    .toBeVisible();
});

test('data-table/controlled-selection-refusal-mixed-and-acceptance', async ({ page }) => {
  const section = page.locator('#orders-table');
  const table = section.getByRole('table', { name: 'Orders', exact: true });
  const refusal = section.getByRole('checkbox', { name: 'Refuse selection changes' });
  const row = table.getByRole('checkbox', { name: 'Select row SO-10482', exact: true });
  const header = table.locator('thead input[type="checkbox"]');
  await refusal.check();
  await row.focus();
  await page.keyboard.press('Space');
  await expect(row).not.toBeChecked();
  await header.focus();
  await page.keyboard.press('Space');
  await expect(header).not.toBeChecked();
  expect(await header.evaluate((e: HTMLInputElement) => e.indeterminate)).toBe(false);
  await refusal.uncheck();
  await row.focus();
  await page.keyboard.press('Space');
  await expect(row).toBeChecked();
  await expect(header).toHaveAttribute('aria-checked', 'mixed');
  expect(await header.evaluate((e: HTMLInputElement) => e.indeterminate)).toBe(true);
  await refusal.check();
  await header.focus();
  await page.keyboard.press('Space');
  await expect(header).not.toBeChecked();
  expect(await header.evaluate((e: HTMLInputElement) => e.indeterminate)).toBe(true);
  await row.focus();
  await page.keyboard.press('Space');
  await expect(row).toBeChecked();
  await refusal.uncheck();
  await header.focus();
  await page.keyboard.press('Space');
  await expect(header).toBeChecked();
  expect(await header.evaluate((e: HTMLInputElement) => e.indeterminate)).toBe(false);
  await expect(section.getByRole('group', { name: '2 selected', exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Clear selection', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(header).not.toBeChecked();
  await expect(section.getByRole('group', { name: '2 selected', exact: true })).toHaveCount(0);
  await expect(section.getByLabel('Orders opened', { exact: true })).toHaveText('0');
});

test('data-table/row-menu-and-bulk-actions-do-not-open-row', async ({ page }) => {
  const section = page.locator('#orders-table');
  const trigger = section.getByRole('button', { name: 'Actions for SO-10482', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Order SO-10482 actions', exact: true });
  await expect(menu.getByRole('menuitem', { name: 'Inspect action' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(section.getByLabel('Order action count', { exact: true })).toHaveText('1');
  await expect(section.getByLabel('Orders opened', { exact: true })).toHaveText('0');
  const checkbox = section.getByRole('checkbox', { name: 'Select row SO-10482', exact: true });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await section.getByRole('button', { name: 'Archive selected', exact: true }).click();
  await expect(section.getByLabel('Order action count', { exact: true })).toHaveText('2');
  await expect(section.getByLabel('Orders opened', { exact: true })).toHaveText('0');
});

test('data-table/host-sorting-filtering-columns-and-paging', async ({ page }) => {
  const section = page.locator('#orders-table');
  const table = section.getByRole('table', { name: 'Orders', exact: true });
  const sort = table.getByRole('button', { name: 'Sort orders', exact: true });
  await sort.focus();
  await page.keyboard.press('Space');
  await expect(table.getByRole('columnheader', { name: 'Sort orders' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  await expect(table.getByRole('button', { name: 'Inspect SO-10479', exact: true })).toBeVisible();
  await section.getByRole('link', { name: 'Next', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(table.getByRole('button', { name: 'Inspect SO-10482', exact: true })).toBeVisible();
  await expect(section.getByText('3–4 of 4 orders', { exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Columns', exact: true }).focus();
  await page.keyboard.press('Enter');
  const column = page.getByRole('menuitemcheckbox', { name: 'Status column', exact: true });
  await expect(column).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Space');
  await expect(column).toHaveAttribute('aria-checked', 'false');
  await expect(table.getByRole('columnheader', { name: 'Status', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await section.getByRole('searchbox', { name: 'Filter orders' }).fill('Maya');
  await expect(table.getByRole('button', { name: 'Inspect SO-10482', exact: true })).toBeVisible();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await section.getByRole('button', { name: 'Export orders', exact: true }).click();
  await expect(section.getByLabel('Order export count', { exact: true })).toHaveText('1');
  await expect(section.getByLabel('Orders opened', { exact: true })).toHaveText('0');
});

test('data-table/stale-page-selection-does-not-count-visible-rows', async ({ page }) => {
  const section = page.locator('#orders-table');
  await section.getByRole('checkbox', { name: 'Select row SO-10482', exact: true }).check();
  await expect(section.getByRole('group', { name: '1 selected', exact: true })).toBeVisible();
  await section.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(section.getByRole('group', { name: '1 selected', exact: true })).toHaveCount(0);
  const header = section.getByRole('table').locator('thead input[type="checkbox"]');
  await expect(header).not.toBeChecked();
  expect(await header.evaluate((e: HTMLInputElement) => e.indeterminate)).toBe(false);
  await section.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(section.getByRole('checkbox', { name: 'Select row SO-10482', exact: true }))
    .toBeChecked();
  await expect(section.getByRole('group', { name: '1 selected', exact: true })).toBeVisible();
});

test('data-table/all-states-strict-accessibility-and-utility-review', async ({ page }) => {
  const section = page.locator('#orders-table');
  const table = section.getByRole('table', { name: 'Orders', exact: true });
  const review = async (state: string) => {
    const results = await new AxeBuilder({ page }).include('#data-table-examples').analyze();
    expect(results.violations.filter((e) => e.impact === 'serious' || e.impact === 'critical'))
      .toEqual([]);
    await section.screenshot({ path: test.info().outputPath(`data-table-${state}.png`) });
    expect(await section.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  };
  await review('default');
  await table.getByRole('checkbox', { name: 'Select row SO-10482', exact: true }).check();
  await review('selection');
  await section.getByRole('button', { name: 'Load orders', exact: true }).click();
  await expect(table).toHaveAttribute('aria-busy', 'true');
  await expect(table.getByRole('button', { name: /^Inspect SO-/ })).toHaveCount(0);
  await expect(table.getByRole('checkbox', { name: 'Select all rows', exact: true }))
    .toBeDisabled();
  await expect(table.getByRole('status')).toHaveText('Loading orders…');
  await review('loading');
  await section.getByRole('button', { name: 'Resolve loading', exact: true }).click();
  await section.getByRole('searchbox', { name: 'Filter orders' }).fill('no-match');
  await expect(section.getByText('No matching orders', { exact: true })).toBeVisible();
  await expect(table).not.toHaveAttribute('aria-busy');
  await review('empty');
  await section.getByRole('button', { name: 'Clear filters', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(table.getByRole('button', { name: 'Inspect SO-10482', exact: true })).toBeVisible();
  await page.locator('html').evaluate((e) => e.setAttribute('dir', 'rtl'));
  await review('rtl');
});

test('data-table/native-table-tab-order', async ({ page }) => {
  const section = page.locator('#table-keyboard');
  const row = section.locator('tbody tr[data-type="button"]').first();
  await section.getByRole('checkbox', { name: 'Select all rows', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(section.getByRole('checkbox', { name: 'Select row one', exact: true }))
    .toBeFocused();
  await page.keyboard.press('Tab');
  await expect(section.getByRole('button', { name: 'Inspect first session', exact: true }))
    .toBeFocused();
  await page.keyboard.press('Tab');
  await expect(row.getByRole('link', { name: 'Cell details', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(row.getByRole('button', { name: 'Row action', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(row.getByRole('link', { name: 'Cell details', exact: true })).toBeFocused();
});

test('data-table/arbitrary-first-cell-controls-remain-independent', async ({ page }) => {
  const section = page.locator('#table-keyboard');
  const input = section.getByRole('textbox', { name: 'Cell memo', exact: true });
  await input.fill('Note');
  await page.keyboard.press('Space');
  await expect(input).toHaveValue('Note ');
  const action = section.getByRole('button', { name: 'Cell action', exact: true });
  await action.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(section.getByLabel('Cell actions', { exact: true })).toHaveText('2');
  await section.getByRole('link', { name: 'Custom cell link', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#custom-cell$/);
  await expect(section.getByLabel('Rows opened', { exact: true })).toHaveText('0');
  await expect(section.getByRole('button', { name: 'Inspect custom session', exact: true }))
    .toHaveCount(1);
  expect(
    await section.locator('td button button, td a button, td button input, td a input').count(),
  ).toBe(0);
});

test('data-table/narrow-container-stacks-cells-with-live-header-controls', async ({ page }) => {
  const section = page.locator('#orders-table');
  await section.evaluate((element) => {
    element.style.width = '300px';
    element.style.maxWidth = '100%';
  });
  const table = section.getByRole('table', { name: 'Orders', exact: true });
  await expect(table.getByRole('button', { name: 'Sort orders' })).toBeVisible();
  await expect(table.getByRole('checkbox', { name: 'Select all rows', exact: true })).toBeVisible();
  const row = table.locator('tbody tr').first();
  const cells = await row.locator('td[data-part="cell"]').evaluateAll((elements) =>
    elements.map((e) => {
      const b = e.getBoundingClientRect();
      return { x: b.x, y: b.y };
    })
  );
  expect(cells[1].y).toBeGreaterThan(cells[0].y);
  expect(cells[1].x).toBeCloseTo(cells[0].x, 1);
  expect(await table.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  await page.locator('html').evaluate((e) => e.setAttribute('dir', 'rtl'));
  await expect(table.getByRole('button', { name: 'Sort orders' })).toBeVisible();
  await section.screenshot({ path: test.info().outputPath('data-table-narrow-rtl.png') });
});

test('data-table/double-click-selects-word-without-second-row-activation', async ({ page }) => {
  const cell = page.locator('#table-keyboard tbody td[data-part="cell"]').first();
  const point = await cell.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent === 'First row') {
        const range = document.createRange();
        range.selectNode(node);
        const b = range.getBoundingClientRect();
        return { x: b.x + 10, y: b.y + b.height / 2 };
      }
    }
    throw new Error('Real first-cell text is required.');
  });
  await page.mouse.dblclick(point.x, point.y);
  expect(await page.evaluate(() => getSelection()?.toString())).toContain('First');
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('1');
  // WebKit exposes the old range during the next click; clear it outside the row first.
  const heading = page.getByRole('heading', { name: 'Data table examples' });
  const headingBox = (await heading.boundingBox())!;
  const gridBox = (await page.locator('#table-keyboard').boundingBox())!;
  expect(headingBox.y + headingBox.height / 2).toBeLessThan(gridBox.y);
  await heading.click();
  expect(await page.evaluate(() => getSelection()?.isCollapsed)).toBe(true);
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('1');
  await cell.click();
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('2');
});

test('data-table/zero-column-row-still-has-native-header-cell-and-action', async ({ page }) => {
  const section = page.locator('#table-zero-columns');
  const table = section.getByRole('table', { name: 'Action-only rows' });
  await expect(table.getByRole('columnheader')).toHaveCount(1);
  await expect(table.getByRole('cell')).toHaveCount(1);
  const button = table.getByRole('button', { name: 'Inspect empty-column row' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(section.getByLabel('Action-only rows opened')).toHaveText('1');
});

test('data-table/modified-native-target-restored-and-root-observes-once', async ({ page, context }) => {
  const body = page.locator('#table-keyboard tbody tr[data-type="link"] td[data-part="cell"]')
    .first();
  const link = page.getByRole('link', { name: 'Open linked session', exact: true });
  const modifier = await page.evaluate(() =>
    /Mac/.test(navigator.platform) ? 'Meta' as const : 'Control' as const
  );
  const original = page.url();
  for (const target of [null, '_self', 'retained-target']) {
    await link.evaluate((e, value) => {
      if (value === null) e.removeAttribute('target');
      else e.setAttribute('target', value);
    }, target);
    const newPage = context.waitForEvent('page');
    await body.click({ modifiers: [modifier] });
    const tab = await newPage;
    await expect(tab).toHaveURL(/destination=linked/);
    await expect(tab.getByRole('heading', { name: 'Linked session destination', exact: true }))
      .toBeVisible();
    await tab.close();
    expect(await link.getAttribute('target')).toBe(target);
    await expect(page).toHaveURL(original);
  }
  await expect(page.getByLabel('Observed grid clicks')).toHaveText('3');
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
});

test('data-table/shift-body-click-does-not-navigate-or-activate', async ({ page }) => {
  const original = page.url();
  const section = page.locator('#table-keyboard');
  await section.locator('tbody tr[data-type="link"] td[data-part="cell"]').first().click({
    modifiers: ['Shift'],
  });
  await section.locator('tbody tr[data-type="button"] td[data-part="cell"]').first().click({
    modifiers: ['Shift'],
  });
  await expect(page).toHaveURL(original);
  await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
});

test('data-table/selected-roles-retain-background-hover-and-native-checkbox', async ({ page }) => {
  for (const direction of ['ltr', 'rtl']) {
    await page.locator('html').evaluate(
      (element, value) => element.setAttribute('dir', value),
      direction,
    );
    for (
      const [section, label, opened] of [
        ['orders-table', 'Select row SO-10482', 'Orders opened'],
        ['table-keyboard', 'Select row one', 'Rows opened'],
      ]
    ) {
      const table = page.locator(`#${section} table`);
      const wide = await nativeTableMode(page, table.locator('..')) === 'wide';
      const measure = () =>
        table.evaluate((element) =>
          Array.from(
            element.querySelectorAll(':scope > thead > tr, :scope > tbody > tr'),
            (row) =>
              Array.from(row.children, (cell) => {
                const box = cell.getBoundingClientRect();
                return { x: box.x, width: box.width };
              }),
          )
        );
      const aligned = (rows: Awaited<ReturnType<typeof measure>>) => {
        if (!wide) return;
        for (const cells of rows.slice(1)) {
          expect(cells.length).toBe(rows[0].length);
          for (let index = 0; index < cells.length; index++) {
            for (const coordinate of ['x', 'width'] as const) {
              expect(
                Math.abs(cells[index][coordinate] - rows[0][index][coordinate]),
                [section, direction, index, coordinate].join('/'),
              ).toBeLessThan(0.75);
            }
          }
        }
      };
      const before = await measure();
      aligned(before);
      const checkbox = table.getByRole('checkbox', { name: label, exact: true });
      const selected = table.locator('tbody tr').first();
      await checkbox.press('Space');
      await expect(checkbox).toBeChecked();
      await expect(selected).toHaveAttribute('data-state', 'selected');
      await expect(selected).not.toHaveAttribute('aria-selected');
      await expectSelectedRail(page, selected);
      const after = await measure();
      aligned(after);
      await checkbox.press('Space');
      await expect(checkbox).not.toBeChecked();
      await expect(selected).not.toHaveAttribute('data-state');
      const reset = await measure();
      aligned(reset);
      for (const actual of [after, reset]) {
        expect(actual.length).toBe(before.length);
        for (let row = 0; row < before.length; row++) {
          expect(actual[row].length).toBe(before[row].length);
          for (let cell = 0; cell < before[row].length; cell++) {
            for (const coordinate of ['x', 'width'] as const) {
              expect(Math.abs(actual[row][cell][coordinate] - before[row][cell][coordinate]))
                .toBeLessThan(0.75);
            }
          }
        }
      }
      await expect(page.getByLabel(opened, { exact: true })).toHaveText('0');
    }
  }
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'ltr'));
  const table = page.locator('#table-keyboard table');
  const checkbox = page.getByRole('checkbox', { name: 'Select row one', exact: true });
  await checkbox.focus();
  await page.keyboard.press('Space');
  const selected = table.locator('tbody tr').first();
  await expect(selected).toHaveAttribute('data-state', 'selected');
  await expect(selected).not.toHaveAttribute('aria-selected');
  await page.mouse.move(0, 0);
  const roles = await selected.evaluate((element) => {
    const probe = document.createElement('span');
    element.ownerDocument.body.append(probe);
    probe.style.color = 'var(--ns-selected)';
    const background = getComputedStyle(probe).color;
    probe.style.color =
      'color-mix(in srgb, var(--ns-fg) calc(var(--ns-state-hover-opacity) * 1%), var(--ns-selected))';
    const hover = getComputedStyle(probe).color;
    probe.remove();
    return { background, hover };
  });
  await expect(selected).toHaveCSS('background-color', roles.background);
  await selected.hover();
  await expect(selected).toHaveCSS('background-color', roles.hover);
  await expect(checkbox).toBeChecked();
});

test('data-table/selected-surface-contrast', async ({ page }) => {
  for (const direction of ['ltr', 'rtl']) {
    await page.locator('html').evaluate(
      (element, value) => element.setAttribute('dir', value),
      direction,
    );
    for (
      const [section, label, opened] of [
        ['orders-table', 'Select row SO-10482', 'Orders opened'],
        ['table-keyboard', 'Select row one', 'Rows opened'],
        ['table-keyboard', 'Select row custom', 'Rows opened'],
      ]
    ) {
      const table = page.locator(`#${section} table`);
      const checkbox = table.getByRole('checkbox', { name: label, exact: true });
      const row = checkbox.locator('xpath=ancestor::tr[1]');
      await checkbox.press('Space');
      await expect(checkbox).toBeChecked();
      await expect(row).toHaveAttribute('data-state', 'selected');
      await page.mouse.move(0, 0);
      for (const hover of [false, true]) {
        if (hover) await row.hover();
        const axe = await new AxeBuilder({ page }).include(`#${section}`).analyze();
        expect(
          axe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical'),
          [section, label, direction, hover ? 'hover' : 'rest'].join('/'),
        ).toEqual([]);
      }
      await checkbox.press('Space');
      await expect(checkbox).not.toBeChecked();
      await expect(row).not.toHaveAttribute('data-state');
      await expect(page.getByLabel(opened, { exact: true })).toHaveText('0');
    }
  }
});

test('data-table/shared-tracks-align-intrinsic-actions-and-selection-without-offset', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const measure = (table: Locator) =>
    table.locator('tr').evaluateAll((elements) =>
      elements.map((row) => ({
        box: { x: row.getBoundingClientRect().x, width: row.getBoundingClientRect().width },
        cells: Array.from(row.children).map((cell) => {
          const box = cell.getBoundingClientRect(), style = getComputedStyle(cell);
          return {
            part: cell.getAttribute('data-part'),
            x: box.x,
            y: box.y,
            width: box.width,
            start: style.direction === 'rtl'
              ? box.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth)
              : box.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth),
            end: style.direction === 'rtl' ? box.left : box.right,
          };
        }),
      }))
    );
  const keyboard = page.locator('#table-keyboard');
  const originalWidth = await keyboard.evaluate((element) => element.style.width);
  try {
    for (const dir of ['ltr', 'rtl']) {
      await page.locator('html').evaluate(
        (element, value) => element.setAttribute('dir', value),
        dir,
      );
      for (const width of [900, 641, 640.25, 640.5, 640.75]) {
        let narrow = false;
        for (const name of ['plain', 'selection', 'actions', 'both', 'overflow']) {
          const fixture = page.locator("[data-track-case='" + name + "']");
          await fixture.evaluate((element, size) => element.style.width = size + 'px', width);
          const root = fixture.locator('.ns-data-grid');
          const mode = await nativeTableMode(page, root);
          narrow = mode === 'narrow';
          const table = fixture.getByRole('table');
          await expect(table).toHaveCSS('display', narrow ? 'block' : 'grid');
          const rows = await measure(table);
          expect(rows).toHaveLength(3);
          for (const row of rows.slice(1)) {
            const data = row.cells.filter((cell) => cell.part === 'cell');
            expect(data).toHaveLength(2);
            if (narrow) {
              expect(data[1].y).toBeGreaterThan(data[0].y);
              expect(data[1].x).toBeCloseTo(data[0].x, 1);
              for (let index = 0; index < data.length; index++) {
                const selected = rows[1].cells.filter((cell) => cell.part === 'cell')[index];
                expect(Math.abs(data[index].start - selected.start)).toBeLessThan(0.75);
              }
              expect(Math.abs(row.cells.at(-1)!.end - rows[1].cells.at(-1)!.end))
                .toBeLessThan(0.75);
            } else {
              expect(Math.abs(data[1].y - data[0].y)).toBeLessThan(0.75);
              expect(row.cells).toHaveLength(rows[0].cells.length);
              for (let index = 0; index < row.cells.length; index++) {
                for (const coordinate of ['x', 'width', 'start'] as const) {
                  expect(
                    Math.abs(row.cells[index][coordinate] - rows[0].cells[index][coordinate]),
                    [dir, width, name, index, coordinate].join('/'),
                  ).toBeLessThan(0.75);
                }
              }
            }
          }
          if (narrow) {
            expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth))
              .toBe(true);
            if (['selection', 'both', 'overflow'].includes(name)) {
              await expect(table.getByRole('checkbox', { name: 'Select all rows', exact: true }))
                .toBeVisible();
            }
          } else if (name === 'overflow') {
            expect(await root.evaluate((element) => element.scrollWidth > element.clientWidth))
              .toBe(true);
            expect(rows[1].box.width).toBeGreaterThan(width);
            const fixed = rows[1].cells.slice(1, 3);
            expect(fixed.map((cell) => Math.round(cell.width))).toEqual([420, 380]);
            const scrollWidth = await table.evaluate((element) => element.scrollWidth);
            // Backgrounds and rules belong to these boxes, not to overflowing button text.
            for (const row of rows) {
              expect(Math.abs(row.box.width - scrollWidth)).toBeLessThan(0.75);
            }
            const paint = await table.locator('tbody tr').first().evaluate((row) => {
              const style = getComputedStyle(row);
              const probe = document.createElement('span');
              probe.style.color = 'var(--ns-selected)';
              row.ownerDocument.body.append(probe);
              try {
                const bounds = row.getBoundingClientRect();
                return {
                  background: style.backgroundColor,
                  expected: getComputedStyle(probe).color,
                  ruleWidth: parseFloat(style.borderBottomWidth),
                  ruleStyle: style.borderBottomStyle,
                  fits: Array.from(row.querySelectorAll('button, input'), (control) => {
                    const box = control.getBoundingClientRect();
                    return box.left >= bounds.left - 0.75 && box.right <= bounds.right + 0.75;
                  }),
                };
              } finally {
                probe.remove();
              }
            });
            expect(paint.background).toBe(paint.expected);
            expect(paint.ruleWidth).toBeGreaterThan(0);
            expect(paint.ruleStyle).toBe('solid');
            expect(paint.fits.every(Boolean)).toBe(true);
          }
          const sort = table.getByRole('button', { name: 'Sort name', exact: true });
          await expect(sort).toBeVisible();
          await sort.focus();
          await expect(sort).toBeFocused();
        }
        if (narrow) {
          await keyboard.evaluate((element, size) => element.style.width = size + 'px', width);
          expect(await nativeTableMode(page, keyboard.locator('.ns-data-grid'))).toBe('narrow');
          const table = keyboard.getByRole('table');
          await expect(table).toHaveCSS('display', 'block');
          const row = table.locator('tbody tr').first();
          const checkbox = row.getByRole('checkbox', { name: 'Select row one', exact: true });
          const before = (await measure(table))[1].cells;
          await checkbox.press('Space');
          await expect(row).toHaveAttribute('data-state', 'selected');
          await expect(checkbox).toBeChecked();
          await expectSelectedRail(page, row);
          const after = (await measure(table))[1].cells;
          // Compare the same content; caller-owned intrinsic action widths may differ across rows.
          for (let index = 0; index < before.length; index++) {
            for (const coordinate of ['x', 'width', 'start'] as const) {
              expect(Math.abs(after[index][coordinate] - before[index][coordinate]))
                .toBeLessThan(0.75);
            }
          }
          await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
          await checkbox.press('Space');
          await expect(row).not.toHaveAttribute('data-state');
          await expect(checkbox).not.toBeChecked();
          const reset = (await measure(table))[1].cells;
          for (let index = 0; index < before.length; index++) {
            for (const coordinate of ['x', 'width', 'start'] as const) {
              expect(Math.abs(reset[index][coordinate] - before[index][coordinate]))
                .toBeLessThan(0.75);
            }
          }
          await expect(page.getByLabel('Rows opened', { exact: true })).toHaveText('0');
        }
      }
    }
  } finally {
    await keyboard.evaluate((element, value) => element.style.width = value, originalWidth);
  }
});

test('data-table/fluid-tracks-wrap-without-horizontal-overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const fixture = page.locator('#table-fluid-tracks .fluid-track-container');
  const root = fixture.locator('.ns-data-grid');
  const table = fixture.getByRole('table');
  const available = (await fixture.boundingBox())!.width;
  const originalWidth = await fixture.evaluate((element) => element.style.width);
  try {
    for (const direction of ['ltr', 'rtl']) {
      await page.locator('html').evaluate(
        (element, value) => element.setAttribute('dir', value),
        direction,
      );
      for (const width of [641, 900, available]) {
        await fixture.evaluate((element, size) => element.style.width = size + 'px', width);
        expect(await nativeTableMode(page, root)).toBe('wide');
        await expect(table).toHaveCSS('display', 'grid');
        expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth))
          .toBe(true);
        const geometry = await table.evaluate((element) => {
          const box = (element: Element) => {
            const bounds = element.getBoundingClientRect();
            return {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
              right: bounds.right,
              bottom: bounds.bottom,
            };
          };
          return {
            rows: Array.from(
              element.querySelectorAll('tr'),
              (row) => Array.from(row.children, box),
            ),
            text: Array.from(element.querySelectorAll('.fluid-long-text'), (text) => ({
              cell: box(text.parentElement!),
              row: box(text.closest('tr')!),
              lines: Array.from(text.getClientRects(), (line) => ({
                x: line.x,
                right: line.right,
                y: line.y,
                bottom: line.bottom,
              })),
            })),
          };
        });
        expect(geometry.rows).toHaveLength(3);
        for (const row of geometry.rows.slice(1)) {
          expect(row).toHaveLength(2);
          for (let index = 0; index < row.length; index++) {
            for (const coordinate of ['x', 'width'] as const) {
              expect(Math.abs(row[index][coordinate] - geometry.rows[0][index][coordinate]))
                .toBeLessThan(0.75);
            }
          }
        }
        expect(geometry.text).toHaveLength(4);
        for (const text of geometry.text) {
          expect(new Set(text.lines.map((line) => line.y)).size).toBeGreaterThan(1);
          for (const line of text.lines) {
            expect(line.x).toBeGreaterThanOrEqual(text.cell.x - 0.75);
            expect(line.right).toBeLessThanOrEqual(text.cell.right + 0.75);
            expect(line.y).toBeGreaterThanOrEqual(text.cell.y - 0.75);
            expect(line.bottom).toBeLessThanOrEqual(text.cell.bottom + 0.75);
            expect(line.y).toBeGreaterThanOrEqual(text.row.y - 0.75);
            expect(line.bottom).toBeLessThanOrEqual(text.row.bottom + 0.75);
          }
        }
      }
    }
  } finally {
    await fixture.evaluate((element, value) => element.style.width = value, originalWidth);
  }
});

test('data-table/shared-status-spans-and-fractional-narrow-boundary', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const dir of ['ltr', 'rtl']) {
    await page.locator('html').evaluate(
      (element, value) => element.setAttribute('dir', value),
      dir,
    );
    for (const width of [640.5, 641]) {
      for (const state of ['loading', 'empty']) {
        const fixture = page.locator("[data-track-state='" + state + "']");
        await fixture.evaluate((element, size) => element.style.width = size + 'px', width);
        const mode = await nativeTableMode(page, fixture.locator('.ns-data-grid'));
        await expect(fixture.getByRole('table')).toHaveCSS(
          'display',
          mode === 'wide' ? 'grid' : 'block',
        );
        const row = fixture.locator('tbody tr'), cell = row.locator('td');
        const [rowBox, cellBox] = await Promise.all([row.boundingBox(), cell.boundingBox()]);
        if (mode === 'wide') {
          expect(rowBox!.width).toBeGreaterThan(width);
          expect(Math.abs(rowBox!.width - cellBox!.width)).toBeLessThan(0.75);
          expect(Math.abs(rowBox!.x - cellBox!.x)).toBeLessThan(0.75);
        } else {
          const padding = await row.evaluate((element) => {
            const style = getComputedStyle(element);
            return { left: parseFloat(style.paddingLeft), right: parseFloat(style.paddingRight) };
          });
          expect(Math.abs(rowBox!.width - padding.left - padding.right - cellBox!.width))
            .toBeLessThan(0.75);
          expect(Math.abs(rowBox!.x + padding.left - cellBox!.x)).toBeLessThan(0.75);
        }
        await expect(
          fixture.getByText(state === 'loading' ? 'Loading shared tracks' : 'No shared rows', {
            exact: true,
          }),
        ).toBeVisible();
      }
    }
    const fixture = page.locator("[data-track-case='both']");
    await fixture.evaluate((element) => element.style.width = '640px');
    expect(await nativeTableMode(page, fixture.locator('.ns-data-grid'))).toBe('narrow');
    const cells = await fixture.locator('tbody tr').first().locator("td[data-part='cell']")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y };
        })
      );
    expect(cells[1].y).toBeGreaterThan(cells[0].y);
    expect(cells[1].x).toBeCloseTo(cells[0].x, 1);
    await expect(fixture.getByRole('button', { name: 'Sort name', exact: true })).toBeVisible();
    await expect(fixture.getByRole('checkbox', { name: 'Select all rows', exact: true }))
      .toBeVisible();
  }
  const axe = await new AxeBuilder({ page }).include('#table-track-examples').analyze();
  expect(axe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical'))
    .toEqual([]);
});
