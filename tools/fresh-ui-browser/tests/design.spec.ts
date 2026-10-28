/// <reference lib="dom" />
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import process from 'node:process';
import { readFileSync, writeFileSync } from 'node:fs';
import { verifyAccessibility } from '../accessibility.ts';

const baseline = JSON.parse(
  readFileSync(new URL('../axe-baseline.json', import.meta.url), 'utf8'),
) as {
  engine: { name: string; version: string };
  cases: Record<string, Record<string, number>>;
};
const controls = (process.env.FRESH_UI_AXE_NEGATIVE_CONTROL ?? '').split(',');
if (
  controls.some((control) =>
    !['', '1', 'new-rule', 'new-target', 'duplicate', 'stale'].includes(control)
  )
) {
  throw new Error('Unknown FRESH_UI_AXE_NEGATIVE_CONTROL mode');
}
import { routeName, ROUTES, THEME_STORAGE_KEY } from '../settings.ts';

for (const route of ROUTES) {
  for (const control of controls) {
    test(
      `${route}: screenshots, axe and keyboard${control ? ` [negative:${control}]` : ''}`,
      async ({ page, colorScheme }, testInfo) => {
        const theme = colorScheme === 'dark' ? 'dark' : 'light';
        const otherTheme = theme === 'dark' ? 'light' : 'dark';
        await page.addInitScript(({ key, theme }) => {
          localStorage.setItem(key, theme);
        }, { key: THEME_STORAGE_KEY, theme });
        const response = await page.goto(route);
        expect(response?.status(), `${route} must render successfully`).toBe(200);
        await expect(page.locator('h1')).toBeVisible();
        const toggle = page.getByRole('button', {
          name: `Switch to ${otherTheme} mode`,
          exact: true,
        });
        await expect(toggle).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        // Reach a real island by Tab, then prove its handlers hydrated using Enter and Space.
        for (
          let index = 0;
          index < 80 && !(await toggle.evaluate((el) => el === document.activeElement));
          index++
        ) {
          await page.keyboard.press('Tab');
        }
        await expect(toggle).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('html')).toHaveAttribute('data-theme', otherTheme);
        await expect(page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }))
          .toBeFocused();
        await page.keyboard.press('Space');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBe(
          theme,
        );
        await page.evaluate(async () => {
          (document.activeElement as HTMLElement | null)?.blur();
          await document.fonts.ready;
          globalThis.scrollTo(0, 0);
        });
        const screenshot = testInfo.outputPath(`${routeName(route)}-${testInfo.project.name}.png`);
        await page.screenshot({
          path: screenshot,
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
        });
        await testInfo.attach('screenshot', { path: screenshot, contentType: 'image/png' });

        // Deliberate controls exercise this same scan and exact-node validator.
        if (control === '1' || control === 'new-rule' || control === 'new-target') {
          await page.evaluate((mode) => {
            const element = document.createElement(mode === 'new-target' ? 'p' : 'button');
            element.id = 'axe-negative-control';
            if (mode === 'new-target') {
              element.textContent = 'Deliberately low contrast';
              element.style.cssText = 'color:#aaa;background:#fff;font:16px sans-serif;padding:8px';
            }
            document.body.append(element);
          }, control);
        }
        const scan = await new AxeBuilder({ page }).analyze();
        if (control === 'duplicate' || control === 'stale') {
          const known = scan.violations.find((violation) =>
            (violation.impact === 'serious' || violation.impact === 'critical') &&
            violation.nodes.length
          );
          if (!known) throw new Error('Negative control requires an existing blocking node');
          if (control === 'duplicate') known.nodes.push(structuredClone(known.nodes[0]));
          else known.nodes.shift();
        }
        const report = testInfo.outputPath('axe.json');
        writeFileSync(report, JSON.stringify(scan, null, 2) + '\n');
        await testInfo.attach('axe', { path: report, contentType: 'application/json' });
        expect(scan.testEngine).toEqual(baseline.engine);
        const expected = process.env.FRESH_UI_AXE_STRICT === '1'
          ? {}
          : baseline.cases[`${route}|${testInfo.project.name}`] ?? {};
        verifyAccessibility(scan.violations, expected);
      },
    );
  }
}
