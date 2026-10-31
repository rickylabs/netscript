import { expect, type Locator, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
});

async function measureSyntax(
  matrix: Locator,
  selector: string,
  roles: readonly (readonly [string, string])[] = [],
) {
  return await matrix.evaluate((root, { selector, roles }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Color measurement needs a native 2D canvas.');
    const rgba = (color: string): number[] => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const luminance = (rgb: readonly number[]): number => {
      const linear = rgb.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).map((element) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--ns-fg)';
      element.append(probe);
      const plain = rgba(getComputedStyle(probe).color);
      const syntax = element.dataset.syntax ??
        roles.find((entry) => element.matches(entry[1]))?.[0];
      if (!syntax) throw new Error('Every measured token must map to a known syntax role');
      const row = element.closest<HTMLElement>('[data-line-variant]')?.dataset.lineVariant;
      probe.style.color = row === 'default'
        ? 'var(--ns-code-syntax-' + syntax + ')'
        : 'color-mix(in srgb, var(--ns-code-syntax-' + syntax + ') 80%, var(--ns-fg))';
      const expected = rgba(getComputedStyle(probe).color);
      probe.remove();
      const ink = rgba(getComputedStyle(element).color);
      const stack: number[][] = [];
      for (let parent: Element | null = element; parent; parent = parent.parentElement) {
        stack.push(rgba(getComputedStyle(parent).backgroundColor));
      }
      // Composite transparent row/code surfaces over their actual ancestors.
      const background = stack.reverse().reduce((under, over) => {
        const alpha = over[3] / 255;
        return under.map((channel, index) => over[index] * alpha + channel * (1 - alpha));
      }, [255, 255, 255]);
      const foregroundLum = luminance(ink), backgroundLum = luminance(background);
      return {
        syntax,
        row,
        matchesRole: ink.slice(0, 3).every((channel, index) =>
          Math.abs(channel - expected[index]) <= 1
        ),
        contrast: (Math.max(foregroundLum, backgroundLum) + 0.05) /
          (Math.min(foregroundLum, backgroundLum) + 0.05),
        differsFromPlainText: ink.slice(0, 3).some((channel, index) => channel !== plain[index]),
      };
    });
  }, { selector, roles });
}

test('code-block/syntax-contrast-on-every-row', async ({ page }, info) => {
  const matrix = page.locator('#code-syntax-contrast');
  await expect(matrix.locator('[data-part="syntax"]')).toHaveCount(28);
  // Canvas resolves modern CSS colors into the actual display RGB channels.
  const measured = await measureSyntax(matrix, '[data-part="syntax"]');
  expect(measured).toHaveLength(28);
  for (const cell of measured) {
    expect(cell.contrast, `${cell.syntax} on ${cell.row}`).toBeGreaterThanOrEqual(4.5);
    expect(cell.matchesRole, `${cell.syntax} on ${cell.row}`).toBe(true);
    // Neutral comments/punctuation may share an ink; chromatic roles must retain color.
    if (!['comment', 'punctuation'].includes(cell.syntax!)) {
      expect(cell.differsFromPlainText, `${cell.syntax} on ${cell.row}`).toBe(true);
    }
  }
  const result = await new AxeBuilder({ page }).include('#code-syntax-contrast').analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await matrix.locator('[data-part="root"]').screenshot({
    path: info.outputPath('syntax-matrix.png'),
  });
});

test('alert-dialog/canonical-destructive-roles', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Review deletion', exact: true }).focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('alertdialog', { name: 'Delete project?', exact: true });
  const action = dialog.getByRole('button', { name: 'Delete project', exact: true });
  const roles = await action.evaluate((element) => {
    const probe = document.createElement('span');
    element.append(probe);
    const resolve = (value: string): string => {
      probe.style.color = `var(${value})`;
      return getComputedStyle(probe).color;
    };
    const roles = {
      fill: resolve('--ns-destructive'),
      foreground: resolve('--ns-destructive-fg'),
      hover: resolve('--ns-destructive-hover'),
    };
    probe.remove();
    return roles;
  });
  await expect(action).toHaveCSS('background-color', roles.fill);
  await expect(action).toHaveCSS('color', roles.foreground);
  const rest = await new AxeBuilder({ page }).include('[role="alertdialog"]').analyze();
  expect(rest.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await action.hover();
  await expect(action).toHaveCSS('background-color', roles.hover);
  const hover = await new AxeBuilder({ page }).include('[role="alertdialog"]').analyze();
  expect(hover.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await dialog.screenshot({ path: info.outputPath('canonical-destructive-action.png') });
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel('Confirmed changes')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Review deletion', exact: true })).toBeFocused();
});

test('code-block/automatic-syntax-contextual-roles-and-contrast', async ({ page }, info) => {
  const matrix = page.locator('#code-automatic-contrast');
  const roles = [
    ['keyword', '.hljs-keyword'],
    ['function', '.hljs-title.function_'],
    ['type', '.hljs-built_in'],
    ['string', '.hljs-string'],
    ['number', '.hljs-number'],
    ['comment', '.hljs-comment'],
    ['punctuation', '.hljs-punctuation'],
  ] as const;
  const measured = await measureSyntax(matrix, roles.map((entry) => entry[1]).join(','), roles);
  expect(measured.length).toBeGreaterThanOrEqual(28);
  for (const variant of ['default', 'added', 'removed', 'highlighted']) {
    for (const [role] of roles) {
      expect(measured.some((cell) => cell.row === variant && cell.syntax === role)).toBe(true);
    }
  }
  for (const cell of measured) {
    expect(cell.contrast, cell.syntax + ' on ' + cell.row).toBeGreaterThanOrEqual(4.5);
    expect(cell.matchesRole, cell.syntax + ' on ' + cell.row).toBe(true);
    if (!['comment', 'punctuation'].includes(cell.syntax)) {
      expect(cell.differsFromPlainText).toBe(true);
    }
  }
  const axe = await new AxeBuilder({ page }).include('#code-automatic-contrast').analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
    [],
  );
  await matrix.screenshot({ path: info.outputPath('automatic-syntax-contrast.png') });
});
