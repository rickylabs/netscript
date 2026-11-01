import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const errors: string[] = [];
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (e) => {
    if (e.type() === 'error') errors.push(e.text());
  });
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'CodeBlock components' })).toBeVisible();
});

test.afterEach(() => expect(errors).toEqual([]));

test('code-block/tabs-and-rtl', async ({ page }) => {
  const source = page.getByRole('group', { name: 'Project source', exact: true });
  const first = source.getByRole('tab', { name: 'one.ts', exact: true });
  const second = source.getByRole('tab', { name: 'second.ts', exact: true });
  const last = source.getByRole('tab', { name: 'README.md', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(source.getByRole('tabpanel')).toContainText('export const second = 2;');
  await expect(source.getByRole('tabpanel').locator('[data-part="line"]')).toHaveCount(2);
  const panelId = await second.getAttribute('aria-controls');
  await expect(source.getByRole('tabpanel')).toHaveAttribute('id', panelId!);
  await expect(source.getByRole('tabpanel')).toHaveAttribute(
    'aria-labelledby',
    (await second.getAttribute('id'))!,
  );
  await page.keyboard.press('End');
  await expect(last).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  await expect(source.getByRole('button', { name: 'Copy code' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(first).toBeFocused();
  const controlled = page.getByRole('group', { name: 'Controlled source', exact: true });
  await controlled.getByRole('tab', { name: 'one.ts', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(controlled.getByRole('tab', { name: 'second.ts', exact: true })).toBeFocused();
  await expect(controlled.getByRole('tab', { name: 'one.ts', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByLabel('Requested file')).toHaveText('src/second file.ts');
  await page.locator('html').evaluate((element) => {
    element.setAttribute('dir', 'rtl');
  });
  await first.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  // A horizontal tablist must leave perpendicular arrows to the browser.
  expect(
    await first.evaluate((element) => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);
  const minimal = page.getByRole('group', { name: 'Minimal source', exact: true });
  await minimal.getByRole('tab', { name: 'second.ts', exact: true }).click();
  await expect(minimal.getByRole('tabpanel')).toHaveText('export const second = 2;');
  await expect(minimal.getByRole('button', { name: 'Copy code' })).toHaveCount(0);
});

test('code-block/clipboard-and-native-scroll', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const source = page.getByRole('group', { name: 'Project source', exact: true });
  const button = source.getByRole('button', { name: 'Copy code' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(source.getByRole('status')).toHaveText('Copied code.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await button.getAttribute('data-clipboard'),
  );
  await source.getByRole('tab', { name: 'second.ts', exact: true }).click();
  await expect(source).toHaveAttribute('data-state', 'rest');
  await button.focus();
  await page.keyboard.press('Space');
  await expect(source.getByRole('status')).toHaveText('Copied code.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'export const second = 2;\n',
  );
  await expect(page.getByLabel('Copied source')).toHaveText('export const second = 2;');
  await source.getByRole('tabpanel').evaluate((element) =>
    element.dispatchEvent(new ClipboardEvent('copy', { bubbles: true }))
  );
  await expect(page.getByLabel('Native copy events')).toHaveText('1');
  await source.getByRole('tab', { name: 'one.ts', exact: true }).click();
  const content = source.getByRole('tabpanel');
  await content.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => content.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(content).toHaveAttribute('dir', 'ltr');
  await page.keyboard.press('Shift+Tab');
  await expect(button).toBeFocused();
  const legacy = page.getByRole('group', { name: 'Single source', exact: true });
  await legacy.getByRole('button', { name: 'Copy code' }).click();
  await expect(legacy.getByRole('status')).toHaveText('Copied code.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('deno task test');
});

test('code-block/clipboard-failure', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    })
  );
  await page.reload();
  const source = page.getByRole('group', { name: 'Project source', exact: true });
  await source.getByRole('button', { name: 'Copy code' }).click();
  await expect(source.getByRole('status')).toContainText('Could not copy code.');
  await expect(source).toHaveAttribute('data-state', 'rest');
  await expect(page.getByLabel('Copy errors')).toHaveText('1');
});

test('code-block/stale-clipboard-result', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: () =>
          new Promise<void>((resolve) =>
            document.addEventListener('resolve-copy', () => resolve(), { once: true })
          ),
      },
    })
  );
  await page.reload();
  const source = page.getByRole('group', { name: 'Project source', exact: true });
  const button = source.getByRole('button', { name: 'Copy code' });
  const original = await button.getAttribute('data-clipboard');
  await button.click();
  await source.getByRole('tab', { name: 'second.ts', exact: true }).click();
  await page.evaluate(() => document.dispatchEvent(new Event('resolve-copy')));
  await expect(page.getByLabel('Copied source')).toHaveText(original!);
  await expect(source.getByRole('status')).toBeEmpty();
  await expect(source).toHaveAttribute('data-state', 'rest');
});

test('code-block/strict-accessibility-and-local-review', async ({ page }) => {
  const violations =
    (await new AxeBuilder({ page }).include('#code-files').include('#code-controlled').include(
      '#code-chromeless',
    ).include('#code-diff').include('#code-single').analyze()).violations.filter((entry) =>
      entry.impact === 'critical' || entry.impact === 'serious'
    );
  expect(violations).toEqual([]);
  for (const id of ['code-files', 'code-diff', 'code-single']) {
    const component = page.locator(`#${id} > [data-scope="code-block"]`);
    await component.screenshot({ path: test.info().outputPath(`${id}.png`) });
  }
});

const automaticSource = [
  '/* open',
  'const hidden = 42;',
  '*/ const visible = "</span><script>safe</script>&amp;";',
  '',
].join('\r\n');
test('code-block/automatic-multiline-syntax-and-exact-native-clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const source = page.getByRole('group', { name: 'Automatic source', exact: true });
  const panel = source.getByRole('tabpanel');
  const rows = panel.locator('[data-part="line"]');
  expect(await rows.locator('> [data-part="code"]').allTextContents()).toEqual(
    automaticSource.split('\r\n'),
  );
  await expect(rows.nth(1).locator('.hljs-comment')).toHaveText('const hidden = 42;');
  await expect(rows.nth(1).locator('.hljs-keyword, .hljs-number')).toHaveCount(0);
  await expect(rows.nth(2).locator('.hljs-keyword')).toHaveText('const');
  await expect(panel.locator('script')).toHaveCount(0);
  await expect(rows.locator('[data-part="line-number"]')).toHaveText(['1', '2', '3', '4']);
  const button = source.getByRole('button', { name: 'Copy code' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(source.getByRole('status')).toHaveText('Copied code.');
  expect(await page.getByLabel('Automatic transfer', { exact: true }).textContent()).toBe(
    automaticSource,
  );
  // Only read the known source written by this native activation.
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(automaticSource);
  await expect(button).toBeFocused();
});

test('code-block/per-file-language-runtime-tab-changes-and-recognition', async ({ page }) => {
  const section = page.locator('#code-automatic');
  const source = section.getByRole('group', { name: 'Automatic source', exact: true });
  await source.getByRole('tab', { name: 'automatic.ts', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(source.getByRole('tab', { name: 'automatic.json', exact: true })).toBeFocused();
  await expect(source.getByRole('tabpanel').locator('.hljs-punctuation')).toHaveCount(3);
  expect(await source.getByRole('tabpanel').locator('[data-part="code"]').allTextContents())
    .toEqual(['{"ready":true}']);
  await section.getByRole('button', { name: 'Toggle JSON language recognition' }).click();
  await expect(source.getByRole('tabpanel').locator('[class*="hljs-"]')).toHaveCount(0);
  await expect(source.getByRole('tabpanel')).toContainText('{"ready":true}');
  await section.getByRole('button', { name: 'Toggle JSON language recognition' }).click();
  await expect(source.getByRole('tabpanel').locator('.hljs-punctuation')).toHaveCount(3);
  await section.getByRole('button', { name: 'Add extra language file' }).click();
  await expect(source.getByRole('tab')).toHaveCount(3);
  await source.getByRole('tab', { name: 'automatic.json', exact: true }).focus();
  await page.keyboard.press('End');
  await expect(source.getByRole('tab', { name: 'automatic.xml', exact: true })).toBeFocused();
  await expect(source.getByRole('tabpanel').locator('.hljs-tag')).toHaveCount(2);
  await expect(source.getByRole('tabpanel').locator('article')).toHaveCount(0);
  expect(await source.getByRole('tabpanel').locator('[data-part="code"]').allTextContents())
    .toEqual(['<article>Read &amp; write</article>']);
  await section.getByRole('button', { name: 'Remove extra language file' }).click();
  await expect(source.getByRole('tab')).toHaveCount(2);
  await expect(source.getByRole('tab', { name: 'automatic.ts', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(await source.getByRole('tabpanel').locator('[data-part="code"]').allTextContents())
    .toEqual(automaticSource.split('\r\n'));
});

test(
  'code-block/explicit-content-unknown-language-and-nested-row-semantics',
  async ({ page }, info) => {
    const explicit = page.getByRole('group', { name: 'Explicit source', exact: true });
    expect(await explicit.locator('[data-part="code"]').allTextContents()).toEqual([
      '<b>Caller literal</b>',
      '<em>Explicit token</em>',
    ]);
    await expect(explicit.locator('b, em, [class*="hljs-"]')).toHaveCount(0);
    await expect(explicit.locator('[data-syntax="keyword"]')).toHaveText('<em>Explicit token</em>');
    const unknown = page.getByRole('group', { name: 'Unknown source', exact: true });
    await expect(unknown.locator('[data-part="code"]')).toHaveText('<div>Literal &amp; text</div>');
    await expect(unknown.locator('code div, [class*="hljs-"]')).toHaveCount(0);
    const nested = page.getByRole('group', { name: 'Nested syntax source', exact: true });
    expect(await nested.locator('[data-part="code"]').allTextContents()).toEqual([
      '\x60hello ${\nNumber(42)',
      '} last\x60',
    ]);
    await expect(nested.locator('.hljs-number')).toHaveText('42');
    expect(
      await nested.locator('.hljs-number').evaluate((e) => e.closest('.hljs-subst')?.textContent),
    ).toContain('Number(42)');
    await expect(nested.locator('[data-part="line"]').nth(1).locator('.hljs-subst')).toHaveText(
      '}',
    );
    const axe = await new AxeBuilder({ page }).include('#code-automatic').include(
      '#code-automatic-contrast',
    ).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
      [],
    );
    await page.locator('#code-automatic').screenshot({
      path: info.outputPath('automatic-syntax.png'),
    });
  },
);
