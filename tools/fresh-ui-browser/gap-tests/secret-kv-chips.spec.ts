import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const SENTINEL_SECRET = 'ns-e2e-sentinel-secret-9942';
const SENTINEL_SHA256 = createHash('sha256').update(SENTINEL_SECRET).digest('hex');
const UNCHANGED_SHA256 = createHash('sha256').update('__ns_secret_unchanged__').digest('hex');
const CLEAR_SHA256 = createHash('sha256').update('__ns_secret_clear__').digest('hex');

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(
    page.getByRole('heading', { name: 'Secret, key-value, and chips components' }),
  ).toBeVisible();
});

test('secret-field/no-reveal-guarantee-keyboard-and-form-contract', async ({ page }) => {
  const tokenForm = page.locator('#secret-form-token');
  const root = tokenForm.locator('[data-scope="secret-field"][data-part="root"]');
  const output = page.getByLabel('Token secret submission');

  // 1. Initial set state: masked, no password input yet, zero reveal buttons anywhere.
  await expect(root).toHaveAttribute('data-state', 'set');
  await expect(root.locator('[data-part="mask"]')).toBeVisible();
  await expect(root.locator('input[type="password"]')).toHaveCount(0);
  await expect(tokenForm.getByRole('button', { name: /reveal|show/i })).toHaveCount(0);

  // 2. Submitting untouched stored secret transmits unchanged sentinel token.
  await tokenForm.getByRole('button', { name: 'Save token secret' }).click();
  await expect(output).toHaveText(
    JSON.stringify({
      mode: 'keep',
      action: 'keep',
      hasField: true,
      digest: UNCHANGED_SHA256,
    }),
  );

  // 3. unchangedMode='omit' omits the field when untouched.
  const omitForm = page.locator('#secret-form-omit');
  await omitForm.getByRole('button', { name: 'Save omit secret' }).click();
  await expect(page.getByLabel('Omit secret submission')).toHaveText(
    JSON.stringify({ mode: 'keep', hasField: false }),
  );

  // 4. Keyboard Replace -> focus moves to write-only password input -> Escape cancels and scrubs.
  const replaceButton = root.getByRole('button', { name: 'Replace' });
  await replaceButton.focus();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'rotating');
  const passwordInput = root.locator('input[type="password"]');
  await expect(passwordInput).toBeFocused();
  await expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
  await expect(passwordInput).toHaveAttribute('spellcheck', 'false');
  await page.keyboard.type('temporary-draft-to-cancel');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state', 'set');
  await expect(replaceButton).toBeFocused();
  await expect(root.locator('input[type="password"]')).toHaveCount(0);

  // 5. Replace and submit: proves FormData received SENTINEL_SECRET, then asserts NO LEAK anywhere.
  await replaceButton.click();
  await expect(passwordInput).toBeFocused();
  await page.keyboard.type(SENTINEL_SECRET);
  await tokenForm.getByRole('button', { name: 'Save token secret' }).click();
  await expect(output).toHaveText(
    JSON.stringify({
      mode: 'replace',
      action: 'replace',
      hasField: true,
      digest: SENTINEL_SHA256,
    }),
  );

  // Post-submit state returns to 'set' and scrubs every trace of the secret.
  await expect(root).toHaveAttribute('data-state', 'set');
  await expect(root.locator('input[type="password"]')).toHaveCount(0);
  const leakAudit = await page.evaluate((needle) => {
    const outerHtmlHit = document.documentElement.outerHTML.includes(needle);
    const innerTextHit = document.body.innerText.includes(needle);
    const inputValuesHit = Array.from(document.querySelectorAll('input, textarea')).some((el) =>
      (el as HTMLInputElement).value.includes(needle)
    );
    const attrHit = Array.from(document.querySelectorAll('*')).some((el) =>
      Array.from(el.attributes).some((attr) => attr.value.includes(needle))
    );
    const formEl = document.getElementById('secret-form-token') as HTMLFormElement;
    const formDataHit = Array.from(new FormData(formEl).entries()).some(([k, v]) =>
      k.includes(needle) || String(v).includes(needle)
    );
    const localStorageHit = Object.entries(localStorage).some(([k, v]) =>
      k.includes(needle) || v.includes(needle)
    );
    const sessionStorageHit = Object.entries(sessionStorage).some(([k, v]) =>
      k.includes(needle) || v.includes(needle)
    );
    return {
      outerHtmlHit,
      innerTextHit,
      inputValuesHit,
      attrHit,
      formDataHit,
      localStorageHit,
      sessionStorageHit,
    };
  }, SENTINEL_SECRET);
  expect(leakAudit).toEqual({
    outerHtmlHit: false,
    innerTextHit: false,
    inputValuesHit: false,
    attrHit: false,
    formDataHit: false,
    localStorageHit: false,
    sessionStorageHit: false,
  });

  // 6. Explicit Clear submits clear sentinel; Keep restores stored state.
  await root.getByRole('button', { name: 'Clear' }).click();
  await expect(root).toHaveAttribute('data-state', 'unset');
  await root.getByRole('button', { name: 'Keep' }).click();
  await expect(root).toHaveAttribute('data-state', 'set');

  await root.getByRole('button', { name: 'Clear' }).click();
  await tokenForm.getByRole('button', { name: 'Save token secret' }).click();
  await expect(output).toHaveText(
    JSON.stringify({
      mode: 'clear',
      action: 'clear',
      hasField: true,
      digest: CLEAR_SHA256,
    }),
  );

  // 7. Invalid & readonly snapshots.
  const invalidRoot = page.locator('#sf-invalid');
  await expect(invalidRoot).toHaveAttribute('data-state', 'invalid');
  await expect(invalidRoot.locator('input[type="password"]')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  const readonlyRoot = page.locator('#sf-readonly');
  await expect(readonlyRoot).toHaveAttribute('data-state', 'readonly');
  await expect(readonlyRoot.locator('[data-part="action"]')).toHaveCount(0);
});

test('key-value-editor/add-remove-focus-validation-secret-row-and-form', async ({ page }) => {
  const form = page.locator('#kv-form');
  const editor = form.locator('[data-scope="key-value-editor"][data-part="root"]');
  const addButton = editor.getByRole('button', { name: 'Add row' });
  const output = page.getByLabel('KV submission');

  // Verify table semantics and no reveal button on stored secret row.
  await expect(editor.locator('table')).toBeVisible();
  await expect(editor.getByRole('button', { name: /reveal|show/i })).toHaveCount(0);

  // Add row moves focus directly to the new row's key input.
  await addButton.click();
  const rows = editor.locator('[data-part="row"]');
  await expect(rows).toHaveCount(3);
  const thirdRow = rows.nth(2);
  const thirdKey = thirdRow.locator('[data-part="key-input"]');
  await expect(thirdKey).toBeFocused();

  // Pattern validation for HTTP header names.
  await page.keyboard.type('Bad Header');
  await expect(thirdKey).toHaveAttribute('aria-invalid', 'true');
  await expect(thirdRow).toContainText('Key contains invalid characters.');

  // Duplicate validation (case-insensitive against Accept).
  await thirdKey.fill('accept');
  await expect(thirdKey).toHaveAttribute('aria-invalid', 'true');
  await expect(thirdRow).toContainText('Duplicate key');

  // Valid key + toggle per-row secret mode -> switches to write-only password input.
  await thirdKey.fill('X-Webhook-Token');
  await expect(thirdKey).not.toHaveAttribute('aria-invalid', 'true');
  const secretToggle = thirdRow.locator('[data-part="secret-toggle"]');
  await secretToggle.click();
  await expect(secretToggle).toHaveAttribute('aria-pressed', 'true');
  const secretInput = thirdRow.locator('input[type="password"]');
  await expect(secretInput).toBeVisible();
  await expect(secretInput).toHaveAttribute('autocomplete', 'new-password');
  const rowSecret = 'kv-row-secret-7731';
  await secretInput.fill(rowSecret);

  // Submit form -> verify indexed FormData parsing & secret scrubbing!
  await form.getByRole('button', { name: 'Save headers' }).click();
  await expect(output).toHaveText(
    JSON.stringify([
      { id: 'hdr-1', key: 'Accept', secret: false, value: 'application/json' },
      { id: 'hdr-2', key: 'Authorization', secret: true, mode: 'keep', length: 0 },
      {
        key: 'X-Webhook-Token',
        secret: true,
        mode: 'replace',
        length: rowSecret.length,
      },
    ]),
  );
  const leakedRowSecret = await page.evaluate(
    (needle) =>
      document.documentElement.outerHTML.includes(needle) ||
      Array.from(document.querySelectorAll('input')).some((el) => el.value.includes(needle)),
    rowSecret,
  );
  expect(leakedRowSecret).toBe(false);

  // Remove middle row -> focus moves to next row's key input.
  await rows.nth(1).locator('[data-part="remove"]').click();
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1).locator('[data-part="key-input"]')).toBeFocused();

  // Remove remaining rows -> focus moves to Add row button.
  await rows.nth(1).locator('[data-part="remove"]').click();
  await rows.nth(0).locator('[data-part="remove"]').click();
  await expect(rows).toHaveCount(0);
  await expect(addButton).toBeFocused();
});

test('chips-input/enter-comma-paste-validation-backspace-delete-and-combobox', async ({ page }) => {
  const emailForm = page.locator('#chips-email-form');
  const emailRoot = emailForm.locator('[data-scope="chips-input"][data-part="root"]');
  const emailInput = emailRoot.locator('[data-part="input"]');
  const chips = emailRoot.locator('[data-part="chip"]');
  const live = emailRoot.locator('[data-part="live"]');

  // Enter commits a valid chip.
  await emailInput.focus();
  await page.keyboard.type('one@example.com');
  await page.keyboard.press('Enter');
  await expect(chips).toHaveCount(1);
  await expect(chips.nth(0)).toContainText('one@example.com');
  await expect(live).toContainText('Added one@example.com');

  // Comma commits a chip.
  await page.keyboard.type('two@example.com,');
  await expect(chips).toHaveCount(2);
  await expect(chips.nth(1)).toContainText('two@example.com');

  // Paste splits on comma/semicolon and marks invalid email inline.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() =>
    navigator.clipboard.writeText('three@example.com, not-an-email; four@example.com')
  );
  await emailInput.focus();
  await page.keyboard.press('Control+V');
  await expect(chips).toHaveCount(5);
  await expect(chips.nth(3)).toHaveAttribute('data-invalid', 'true');
  await expect(emailRoot).toHaveAttribute('data-state', 'invalid');
  await expect(emailRoot.locator('[data-part="error"]')).toContainText(
    'Enter a valid email address.',
  );

  // Backspace on empty input removes last chip and keeps focus on input.
  await emailInput.focus();
  await page.keyboard.press('Backspace');
  await expect(chips).toHaveCount(4);
  await expect(emailInput).toBeFocused();
  await expect(live).toContainText('Removed four@example.com');

  // Focus invalid chip and remove with Delete.
  await chips.nth(3).focus();
  await page.keyboard.press('Delete');
  await expect(chips).toHaveCount(3);
  await expect(emailRoot).not.toHaveAttribute('data-state', 'invalid');

  // Form submit carries all committed chips.
  await emailForm.getByRole('button', { name: 'Save recipients' }).click();
  await expect(page.getByLabel('Submitted recipients')).toHaveText(
    JSON.stringify(['one@example.com', 'two@example.com', 'three@example.com']),
  );

  // Optional Combobox suggestions seam via keyboard.
  const suggBox = page.locator('#chips-sugg-box');
  const suggInput = suggBox.locator('[data-part="input"]');
  await suggInput.focus();
  await page.keyboard.type('sec');
  await expect(suggBox.locator('[data-part="suggestions"]')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(suggBox.locator('[data-part="chip"]')).toHaveCount(1);
  await expect(suggBox.locator('[data-part="chip"]').nth(0)).toContainText('security@example.com');
});

test('secret-kv-chips/strict-accessibility-focus-rings-and-light-dark', async ({ page }) => {
  // Verify visible focus ring on keyboard-focused controls of all 3 components.
  const checkFocusRing = async (locator: ReturnType<typeof page.locator>) => {
    await locator.focus();
    const outline = await locator.evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).not.toBe('0px');
  };

  await page.keyboard.press('Tab');
  await checkFocusRing(page.locator('#sf-token [data-action="replace"]'));
  await checkFocusRing(page.locator('#kv-headers [data-part="add"]'));
  // Add an interactive chip and verify focus rings on the control, chip, and remove button.
  const chipsInput = page.locator('#chips-email [data-part="input"]');
  const chipsInputControl = page.locator('#chips-email [data-part="control"]');
  await chipsInput.focus();
  await page.keyboard.type('focus@example.com');
  await page.keyboard.press('Enter');
  const chipsControlOutline = await chipsInputControl.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(chipsControlOutline.style).not.toBe('none');
  expect(chipsControlOutline.width).not.toBe('0px');
  await checkFocusRing(page.locator('#chips-email [data-part="chip-remove"]').first());

  // Strict axe-core scan on the entire #secret-kv-chips section in light & dark, 390 & 1280.
  const result = await new AxeBuilder({ page }).include('#secret-kv-chips').analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
});
