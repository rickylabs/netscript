/// <reference lib="dom" />
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const badgeCss = readFileSync(
  new URL('../../../packages/fresh-ui/registry/components/ui/badge.css', import.meta.url),
  'utf8',
);
const variants = ['primary', 'secondary', 'info', 'success', 'warning', 'destructive', 'muted'];

// Deliberately distinct sentinel colors isolate cascade/role selection from token palette changes.
const palette = Object.fromEntries(variants.map((variant, index) => [variant, {
  text: `rgb(${index + 10}, 20, 30)`,
  subtle: `rgb(${index + 40}, 50, 60)`,
  border: `rgb(${index + 70}, 80, 90)`,
}]));
const roles = variants.map((variant) => {
  const { text, subtle, border } = palette[variant];
  return variant === 'muted'
    ? `--ns-muted-fg:${text};--ns-muted:${subtle};--ns-border:${border};`
    : `--ns-${variant}-text:${text};--ns-${variant}-subtle:${subtle};--ns-${variant}-border:${border};`;
}).join('');

function badge(variant: string): string {
  return `<span class="ns-badge" data-scope="badge" data-part="root" data-variant="${variant}" data-emphasis="subtle">Status</span>`;
}

test('Badge Utility variant backgrounds and borders survive the shared anatomy rule', async ({ page }) => {
  await page.setContent(`<style>:root{${roles}}</style>${variants.map(badge).join('')}`);
  await page.addStyleTag({ content: badgeCss });
  for (
    const attributes of [
      { theme: 'studio-utility', flavor: null },
      { theme: 'studio', flavor: 'utility' },
      { theme: 'studio', flavor: null },
    ]
  ) {
    await page.evaluate(({ theme, flavor }) => {
      document.documentElement.dataset.theme = theme;
      if (flavor) document.documentElement.dataset.flavor = flavor;
      else delete document.documentElement.dataset.flavor;
    }, attributes);
    for (const variant of variants) {
      const actual = await page.locator(`[data-variant="${variant}"]`).evaluate((element) => {
        const style = getComputedStyle(element);
        return { text: style.color, subtle: style.backgroundColor, border: style.borderTopColor };
      });
      expect.soft(actual, `${attributes.theme}/${attributes.flavor ?? 'default'}/${variant}`)
        .toEqual(palette[variant]);
    }
  }
});

test('Badge info falls back to secondary text when info roles are unavailable', async ({ page }) => {
  const secondary = palette.secondary;
  await page.setContent(`<style>:root{
    --ns-secondary:rgb(201, 202, 203);
    --ns-secondary-text:${secondary.text};
    --ns-secondary-subtle:${secondary.subtle};
    --ns-secondary-border:${secondary.border};
  }</style>${badge('info')}`);
  await page.addStyleTag({ content: badgeCss });
  for (const theme of ['ns-one', 'light', 'dark']) {
    await page.evaluate((value) => document.documentElement.dataset.theme = value, theme);
    const actual = await page.locator('[data-variant="info"]').evaluate((element) => {
      const style = getComputedStyle(element);
      return { text: style.color, subtle: style.backgroundColor, border: style.borderTopColor };
    });
    expect.soft(actual, theme).toEqual(secondary);
  }
});
