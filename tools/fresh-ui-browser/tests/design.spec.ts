/// <reference lib="dom" />
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import process from 'node:process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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
import { APP_DIR, routeName, ROUTES, THEME_STORAGE_KEY } from '../settings.ts';

const tokenData = JSON.parse(readFileSync(join(APP_DIR, 'assets/tokens.json'), 'utf8')) as {
  ramps: unknown[];
  allRamps: unknown[];
};
const fontData = JSON.parse(readFileSync(join(APP_DIR, 'assets/fonts.json'), 'utf8')) as {
  imports: Record<string, string[]>;
};

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
        await expect(page.locator('html')).toHaveAttribute('data-scheme', theme);

        const utility =
          new URL(route, 'https://example.test').searchParams.get('preset') === 'studio-utility';
        await expect(page.locator('html')).toHaveAttribute(
          'data-theme',
          utility ? 'studio' : 'ns-one',
        );
        await expect(page.locator('html')).toHaveAttribute(
          'data-density',
          utility ? 'compact' : 'comfortable',
        );
        if (utility) await expect(page.locator('html')).toHaveAttribute('data-flavor', 'utility');
        if (utility && testInfo.project.use.viewport?.width === 390) {
          const trigger = page.locator('button.ns-dashboard__mobile-trigger');
          await expect(trigger).toBeVisible();
          const geometry = await trigger.evaluate((element) => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return {
              expected: Number.parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue(
                  '--ns-control-height-sm',
                ),
              ),
              width: box.width,
              height: box.height,
              padding: [
                style.paddingTop,
                style.paddingRight,
                style.paddingBottom,
                style.paddingLeft,
              ],
              gap: style.gap,
            };
          });
          expect(geometry.height).toBe(geometry.expected);
          expect(geometry.width).toBe(geometry.expected);
          expect(geometry.padding).toEqual(['0px', '0px', '0px', '0px']);
          expect(geometry.gap).toBe('0px');
        }
        const language = await page.locator('html').getAttribute('data-theme');

        // Discard the seed so each activation must persist its own result.
        await page.evaluate((key) => localStorage.removeItem(key), THEME_STORAGE_KEY);
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
        await expect(page.locator('html')).toHaveAttribute('data-scheme', otherTheme);
        expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBe(
          otherTheme,
        );
        await expect(page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }))
          .toBeFocused();
        await page.keyboard.press('Space');
        await expect(page.locator('html')).toHaveAttribute('data-scheme', theme);
        expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBe(
          theme,
        );
        await expect(page.locator('html')).toHaveAttribute('data-theme', language!);
        const loadedStylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll(
          (links) => links.map((link) => link.getAttribute('href')),
        );
        for (const href of fontData.imports[utility ? 'studio-utility' : 'ns-one']) {
          expect(loadedStylesheets).toContain(href);
        }
        if (utility) await expect(page.getByText('Studio Utility', { exact: true })).toBeVisible();
        if (route.startsWith('/design/tokens')) {
          await expect(page.locator('figure.ns-token-ramp')).toHaveCount(
            utility ? tokenData.allRamps.length : tokenData.ramps.length,
          );
        }
        if (!utility) {
          const colors = await page.locator('body').evaluate(async (element) => {
            await Promise.all(element.getAnimations().map((animation) => animation.finished));
            const style = getComputedStyle(element);
            return [style.backgroundColor, style.color];
          });
          await page.evaluate((scheme) => {
            document.documentElement.removeAttribute('data-scheme');
            document.documentElement.setAttribute('data-theme', scheme);
          }, theme);
          expect(
            await page.locator('body').evaluate(async (element) => {
              await Promise.all(element.getAnimations().map((animation) => animation.finished));
              const style = getComputedStyle(element);
              return [style.backgroundColor, style.color];
            }),
          ).toEqual(colors);
          await page.evaluate((scheme) => {
            document.documentElement.setAttribute('data-theme', 'ns-one');
            document.documentElement.setAttribute('data-scheme', scheme);
          }, theme);
        }
        if (route === '/design/tokens' && testInfo.project.name === 'light-1280') {
          const preview = await page.request.get('/design/tokens?preset=studio-utility');
          expect(await preview.text()).toMatch(/<html[^>]*data-theme="studio"/);
          const normal = await page.request.get('/design/tokens');
          expect(await normal.text()).toMatch(/<html[^>]*data-theme="ns-one"/);
          const outside = await page.request.get('/?preset=studio-utility');
          expect(await outside.text()).toMatch(/<html[^>]*data-theme="ns-one"/);
          const unknown = await page.request.get('/design/tokens?preset=unknown');
          expect(await unknown.text()).toMatch(/<html[^>]*data-theme="ns-one"/);
        }
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
