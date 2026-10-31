import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const browserErrors = new WeakMap<Page, string[]>();

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
