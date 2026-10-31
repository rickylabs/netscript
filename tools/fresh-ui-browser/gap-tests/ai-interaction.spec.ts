import { expect, type Locator, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/** Wait for the browser's own key-scroll animation before comparing reader positions. */
async function settleNativeScroll(view: Locator): Promise<void> {
  await view.evaluate((node) =>
    new Promise<void>((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      const finish = () => {
        globalThis.clearTimeout(timer);
        node.removeEventListener('scroll', progress);
        resolve();
      };
      const progress = () => {
        globalThis.clearTimeout(timer);
        timer = globalThis.setTimeout(finish, 100);
      };
      node.addEventListener('scroll', progress);
      progress();
    })
  );
}

const errors: string[] = [];
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (e) => {
    if (e.type() === 'error') errors.push(e.text());
  });
  await page.goto(
    '/ai-interaction?scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light'),
  );
  await expect(page.getByRole('heading', { name: 'AI interaction examples' })).toBeVisible();
});
test.afterEach(() => expect(errors).toEqual([]));

test('message-scroller/native-pinned-scroll', async ({ page }) => {
  const root = page.locator('#primary-scroller');
  const view = root.getByRole('region', { name: 'Conversation', exact: true });
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  const oldEnd = await view.evaluate((e) => e.scrollTop);
  await page.getByRole('button', { name: 'Append message', exact: true }).click();
  await expect.poll(() => view.evaluate((e) => e.scrollTop)).toBeGreaterThan(oldEnd);
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await view.focus();
  await page.keyboard.press('Home');
  await expect(root).toHaveAttribute('data-scrollable', 'down');
  await page.keyboard.press('PageDown');
  await expect(root).toHaveAttribute('data-scrollable', 'both');
  await settleNativeScroll(view);
  const reading = await view.evaluate((e) => e.scrollTop);
  await page.getByRole('button', { name: 'Append message', exact: true }).click();
  expect(await view.evaluate((e) => e.scrollTop)).toBeCloseTo(reading, 0);
  const latest = root.getByRole('button', { name: 'Scroll to latest' });
  await latest.focus();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await expect(latest).toBeFocused();
  await expect(latest).toBeVisible();
  await expect(latest).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Space');
  await expect(latest).toBeFocused();
  await view.focus();
  await expect(latest).toBeHidden();
  await page.keyboard.press('Home');
  await expect(root).toHaveAttribute('data-scrollable', 'down');
  await page.keyboard.press('End');
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await page.getByRole('button', { name: 'Use one message' }).click();
  await expect(root).toHaveAttribute('data-scrollable', 'none');
});

test('message-scroller/stream-growth-resize-follow-toggle-and-root-isolation', async ({ page }) => {
  const root = page.locator('#primary-scroller');
  const view = root.locator('[data-part="viewport"]');
  const other = page.locator('#secondary-scroller [data-part="viewport"]');
  const stream = root.locator('[data-stream-target]');
  const end = await view.evaluate((e) => e.scrollTop);
  await stream.evaluate((e) => {
    e.textContent += ' Streamed text.'.repeat(80);
  });
  await expect.poll(() => view.evaluate((e) => e.scrollTop)).toBeGreaterThan(end);
  expect(await other.evaluate((e) => e.scrollTop)).toBe(0);
  await view.evaluate((e) => {
    e.scrollTop = 80;
  });
  await expect(root).toHaveAttribute('data-scrollable', 'both');
  await stream.evaluate((e) => {
    e.textContent += ' More text.'.repeat(80);
  });
  await page.waitForTimeout(80);
  expect(await view.evaluate((e) => e.scrollTop)).toBeCloseTo(80, 0);
  await page.getByLabel('Follow pinned end').uncheck();
  await page.getByLabel('Follow pinned end').check();
  expect(await view.evaluate((e) => e.scrollTop)).toBeCloseTo(80, 0);
  await page.getByRole('button', { name: 'Resize viewport' }).click();
  expect(await view.evaluate((e) => e.scrollTop)).toBeCloseTo(80, 0);
  await root.getByRole('button', { name: 'Scroll to latest' }).click();
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await page.getByRole('button', { name: 'Resize viewport' }).click();
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  expect(await view.evaluate((e) => Math.abs(e.scrollHeight - e.clientHeight - e.scrollTop)))
    .toBeLessThanOrEqual(1);
});

test('message-scroller/native-child-focus-and-independent-reader', async ({ page }) => {
  const root = page.locator('#primary-scroller');
  const view = root.getByRole('region', { name: 'Conversation', exact: true });
  await view.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('Tab');
  await expect(root.locator('.ns-message').first().getByRole('button', { name: 'Copy message' }))
    .toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    root.locator('.ns-message').first().getByRole('button', { name: 'Regenerate response' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(root.getByRole('link', { name: 'Read message source' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#message-source$/);
  const other = page.locator('#secondary-scroller');
  await other.getByRole('region').focus();
  await page.keyboard.press('PageDown');
  await expect(other).toHaveAttribute('data-scrollable', 'both');
  await settleNativeScroll(other.getByRole('region'));
  const old = await other.getByRole('region').evaluate((e) => e.scrollTop);
  await page.getByRole('button', { name: 'Append message', exact: true }).click();
  expect(await other.getByRole('region').evaluate((e) => e.scrollTop)).toBeCloseTo(old, 0);
});

test('questionnaire/native-answer-form', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Native storage', exact: true });
  const first = form.getByRole('radio', { name: 'PostgreSQL', exact: true });
  const second = form.getByRole('radio', { name: 'SQLite', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await expect(second).toBeFocused();
  await expect(second).toBeChecked();
  await expect(first).not.toBeChecked();
  await page.keyboard.press('Space');
  await expect(second).toBeChecked();
  await expect(form.getByRole('radio', { name: 'Deno KV', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowUp');
  await expect(first).toBeFocused();
  await expect(first).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(second).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(first).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(form.getByRole('textbox', { name: 'Native extra field' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(first).toBeFocused();
  await form.getByRole('button', { name: 'Submit native storage' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Native form data')).toHaveText(
    '[["answer","postgres"],["extra","Initial extra"]]',
  );
  const multiple = page.getByRole('form', { name: 'Multiple storage', exact: true });
  const checkbox = multiple.getByRole('checkbox', { name: 'SQLite', exact: true });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await multiple.getByRole('button', { name: 'Submit multiple storage' }).click();
  await expect(page.getByLabel('Native form data')).toHaveText(
    '[["answer","postgres"],["answer","sqlite"]]',
  );
  await expect(form.getByRole('radio', { name: 'PostgreSQL', exact: true })).toBeChecked();
  await expect(page.getByRole('form', { name: 'Disabled storage' }).getByRole('radio').first())
    .toBeDisabled();
  await expect(page.getByRole('button', { name: 'Edit disabled answers' })).toBeEnabled();
});

test('questionnaire/controlled-radio-text-refusal-and-unchanged-dom-reconciliation', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Controlled storage', exact: true });
  const first = form.getByRole('radio', { name: 'PostgreSQL', exact: true });
  const second = form.getByRole('radio', { name: 'SQLite', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await expect(first).toBeChecked();
  await expect(second).not.toBeChecked();
  await expect(page.getByLabel('Choice proposals')).toHaveText('1');
  await expect(second).toBeFocused();
  await page.getByLabel('Accept answer changes').check();
  await second.check();
  await expect(second).toBeChecked();
  await expect(first).not.toBeChecked();
  await page.getByLabel('Accept answer changes').uncheck();
  await first.click();
  await expect(second).toBeChecked();
  await expect(first).not.toBeChecked();
  const notes = page.getByRole('textbox', { name: 'Controlled notes', exact: true });
  await notes.fill('Refused notes');
  await expect(notes).toHaveValue('Accepted notes');
  await page.getByLabel('Accept answer changes').check();
  await notes.fill('Accepted new notes');
  await expect(notes).toHaveValue('Accepted new notes');
  await first.evaluate((e: HTMLInputElement) => {
    e.checked = true;
  });
  await notes.evaluate((e: HTMLTextAreaElement) => {
    e.value = 'Outside change';
  });
  await page.getByRole('button', { name: 'Rerender unchanged answers' }).click();
  await expect(second).toBeChecked();
  await expect(first).not.toBeChecked();
  await expect(notes).toHaveValue('Accepted new notes');
});

test('questionnaire/native-and-prevented-reset-preserve-other-fields', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Native storage', exact: true });
  await form.getByRole('radio', { name: 'SQLite', exact: true }).check();
  await form.getByRole('textbox').fill('Changed extra');
  await form.getByRole('button', { name: 'Reset native storage' }).click();
  await expect(form.getByRole('radio', { name: 'PostgreSQL', exact: true })).toBeChecked();
  await expect(form.getByRole('textbox')).toHaveValue('Initial extra');
  const notes = page.getByRole('form', { name: 'Native notes', exact: true });
  await notes.getByRole('textbox').fill('Changed notes');
  await notes.getByRole('button', { name: 'Reset native notes' }).click();
  await expect(notes.getByRole('textbox')).toHaveValue('Initial notes');
  const controlled = page.getByRole('form', { name: 'Controlled storage', exact: true });
  await page.getByLabel('Accept answer changes').check();
  await controlled.getByRole('radio', { name: 'SQLite', exact: true }).check();
  await controlled.getByRole('textbox').fill('Changed other');
  await controlled.getByRole('button', { name: 'Reset controlled storage' }).click();
  await expect(controlled.getByRole('radio', { name: 'SQLite', exact: true })).toBeChecked();
  await expect(controlled.getByRole('textbox')).toHaveValue('Initial extra');
  const count = await page.getByLabel('Choice proposals').textContent();
  await page.getByLabel('Prevent native reset').check();
  await controlled.getByRole('textbox').fill('Prevented change');
  await controlled.getByRole('button', { name: 'Reset controlled storage' }).click();
  await expect(controlled.getByRole('textbox')).toHaveValue('Prevented change');
  await expect(page.getByLabel('Choice proposals')).toHaveText(count!);
});

test('questionnaire/host-step-validation-submit-and-native-newline', async ({ page }) => {
  const flow = page.locator('#host-flow');
  await flow.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(flow.getByText('Pick an option to continue.')).toBeVisible();
  const radio = flow.getByRole('radio', { name: 'PostgreSQL', exact: true });
  await expect(radio).toHaveAttribute('aria-invalid', 'true');
  expect(
    (await new AxeBuilder({ page }).include('#host-flow').analyze()).violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? '')
    ),
  ).toEqual([]);
  await radio.check();
  await expect(flow.getByText('Pick an option to continue.')).toHaveCount(0);
  await flow.getByRole('button', { name: 'Next', exact: true }).click();
  const field = flow.getByRole('textbox');
  await field.fill('First line');
  await field.press('Enter');
  await field.press('a');
  await expect(field).toHaveValue('First line\na');
  expect(
    (await new AxeBuilder({ page }).include('#host-flow').analyze()).violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? '')
    ),
  ).toEqual([]);
  await expect(flow.getByRole('button', { name: 'Submit answers' })).toBeVisible();
  await field.press('Escape');
  await field.press('1'); // No invented Escape/digit workflow.
  await expect(field).toHaveValue('First line\na1');
  await flow.getByRole('button', { name: 'Submit answers' }).click();
  await expect(flow.getByText('Answers sent')).toBeVisible();
  await expect(flow.locator('input,textarea')).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).include('#host-flow').analyze()).violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? '')
    ),
  ).toEqual([]);
  await expect(flow.getByLabel('Host accepted answers')).toContainText('"value":["postgres"]');
  await flow.getByRole('button', { name: 'Edit answers' }).click();
  await expect(flow.getByRole('radio', { name: 'PostgreSQL', exact: true })).toBeChecked();
});

test('ai-interaction/strict-accessibility-utility-and-rtl', async ({ page }, info) => {
  for (const direction of ['ltr', 'rtl']) {
    await page.locator('html').evaluate((e, dir) => e.setAttribute('dir', dir), direction);
    const axe = await new AxeBuilder({ page }).include('main').analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
      [],
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('[aria-live]')).toHaveCount(0);
    for (const id of ['scroller-examples', 'native-answers', 'host-flow', 'controlled-answers']) {
      await page.locator('#' + id).screenshot({
        path: info.outputPath(id + '-' + direction + '.png'),
      });
    }
  }
});

test('ai-interaction/native-form-before-js-and-real-hydration', async ({ page, browser }, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
    colorScheme: info.project.use.colorScheme,
  });
  try {
    const native = await context.newPage();
    await native.goto(String(info.project.use.baseURL) + '/ai-interaction-static');
    const form = native.getByRole('form', { name: 'Native storage', exact: true });
    await form.getByRole('radio', { name: 'PostgreSQL', exact: true }).focus();
    await native.keyboard.press('ArrowDown');
    await expect(form.getByRole('radio', { name: 'SQLite', exact: true })).toBeChecked();
    await form.getByRole('button', { name: 'Submit native storage' }).click();
    expect(new URL(native.url()).searchParams.get('answer')).toBe('sqlite');
  } finally {
    await context.close();
  }
  await page.goto('/ai-interaction-static');
  await expect(page.locator('#primary-scroller')).toHaveAttribute('data-scrollable', 'up');
  const form = page.getByRole('form', { name: 'Controlled storage', exact: true });
  await form.getByRole('radio', { name: 'SQLite', exact: true }).click();
  await expect(form.getByRole('radio', { name: 'PostgreSQL', exact: true })).toBeChecked();
  await expect(page.getByLabel('Choice proposals')).toHaveText('1');
});

test('message-scroller/same-shell-chat-composer-and-reader', async ({ page }, info) => {
  await page.goto(
    '/shell?layout=chat&scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light'),
  );
  const shell = page.locator('#shell-example');
  await expect(shell).toHaveAttribute('data-sidebar-mode', 'hydrated');
  const root = shell.locator('.ns-message-scroller');
  const view = root.getByRole('region', { name: 'Shell conversation' });
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  const end = await view.evaluate((e) => e.scrollTop);
  await shell.getByRole('button', { name: 'Send', exact: true }).click();
  await expect.poll(() => view.evaluate((e) => e.scrollTop)).toBeGreaterThan(end);
  await view.evaluate((e) => {
    e.scrollTop = 100;
  });
  await expect(root).toHaveAttribute('data-scrollable', 'both');
  await shell.getByRole('button', { name: 'Send', exact: true }).click();
  expect(await view.evaluate((e) => e.scrollTop)).toBeCloseTo(100, 0);
  const frame = (await shell.boundingBox())!;
  const composer = (await shell.locator('.ns-dashboard__composer').boundingBox())!;
  expect(composer.y + composer.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
  expect(
    await shell.locator('.ns-dashboard__thread').evaluate((e) =>
      e.scrollHeight <= e.clientHeight + 1
    ),
  ).toBe(true);
  const axe = await new AxeBuilder({ page }).include('#shell-example').analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
    [],
  );
});

test('questionnaire/controlled-multiple-refusal-and-both-reset-modes', async ({ page }) => {
  const controlled = page.getByRole('form', { name: 'Controlled multiple storage', exact: true });
  const first = controlled.getByRole('checkbox', { name: 'PostgreSQL', exact: true });
  const second = controlled.getByRole('checkbox', { name: 'SQLite', exact: true });
  await second.focus();
  await page.keyboard.press('Space');
  await expect(first).toBeChecked();
  await expect(second).not.toBeChecked();
  await expect(page.getByLabel('Multiple proposals')).toHaveText('1');
  await page.getByLabel('Accept answer changes').check();
  await second.click();
  await expect(second).toBeChecked();
  await controlled.getByRole('button').click();
  await expect(first).toBeChecked();
  await expect(second).toBeChecked();
  await page.getByLabel('Accept answer changes').uncheck();
  await first.click();
  await expect(first).toBeChecked();
  await controlled.getByRole('button').click();
  await expect(first).toBeChecked();
  const native = page.getByRole('form', { name: 'Multiple storage', exact: true });
  await native.getByRole('checkbox', { name: 'SQLite', exact: true }).check();
  await native.getByRole('button', { name: 'Reset multiple storage' }).click();
  await expect(native.getByRole('checkbox', { name: 'PostgreSQL', exact: true })).toBeChecked();
  await expect(native.getByRole('checkbox', { name: 'SQLite', exact: true })).not.toBeChecked();
  const notes = page.getByRole('form', { name: 'Controlled notes', exact: true });
  await page.getByLabel('Accept answer changes').check();
  await notes.getByRole('textbox').fill('Accepted changed notes');
  await notes.getByRole('button').click();
  await expect(notes.getByRole('textbox')).toHaveValue('Accepted changed notes');
  await page.getByLabel('Accept answer changes').uncheck();
  await notes.getByRole('textbox').fill('Refused changed notes');
  await notes.getByRole('button').click();
  await expect(notes.getByRole('textbox')).toHaveValue('Accepted changed notes');
});

test('questionnaire/initial-uncontrolled-reset-baseline-and-programmatic-reset', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Native storage', exact: true });
  const notes = page.getByRole('form', { name: 'Native notes', exact: true });
  await page.getByRole('button', { name: 'Change later default props' }).click();
  await form.getByRole('radio', { name: 'SQLite', exact: true }).check();
  await notes.getByRole('textbox').fill('Changed notes');
  await form.evaluate((e: HTMLFormElement) => e.reset());
  await notes.evaluate((e: HTMLFormElement) => e.reset());
  await expect(form.getByRole('radio', { name: 'PostgreSQL', exact: true })).toBeChecked();
  await expect(notes.getByRole('textbox')).toHaveValue('Initial notes');
});

type ObserverEvent = { kind: string; roots: string[] };
type NativeListener = {
  target: EventTarget;
  type: string;
  callback: EventListenerOrEventListenerObject | null;
  root: string;
};
declare global {
  var __aiObserverEvents: ObserverEvent[];
  var __aiPendingFrames: Map<number, string>;
  var __aiNativeListeners: NativeListener[];
}

test('message-scroller/observer-frame-ownership-and-teardown', async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__aiObserverEvents = [];
    globalThis.__aiPendingFrames = new Map();
    globalThis.__aiNativeListeners = [];
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const tracked = new Set(['scroll', 'wheel', 'pointerdown', 'touchstart', 'keydown']);
    EventTarget.prototype.addEventListener = function (type, callback, options) {
      if (
        this instanceof Element && this.getAttribute('data-part') === 'viewport' &&
        tracked.has(type)
      ) {
        const root = this.closest('.ns-message-scroller')?.id;
        if (root) globalThis.__aiNativeListeners.push({ target: this, type, callback, root });
      }
      add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function (type, callback, options) {
      globalThis.__aiNativeListeners = globalThis.__aiNativeListeners.filter((entry) =>
        !(entry.target === this && entry.type === type && entry.callback === callback)
      );
      remove.call(this, type, callback, options);
    };
    let owner = '';
    const originalRAF = globalThis.requestAnimationFrame.bind(globalThis);
    const originalCancel = globalThis.cancelAnimationFrame.bind(globalThis);
    globalThis.requestAnimationFrame = (callback) => {
      const own = owner;
      const id = originalRAF((time) => {
        globalThis.__aiPendingFrames.delete(id);
        if (own && !document.getElementById(own)) {
          globalThis.__aiObserverEvents.push({ kind: 'frame-after-detach', roots: [own] });
        }
        callback(time);
      });
      globalThis.__aiPendingFrames.set(id, own);
      return id;
    };
    globalThis.cancelAnimationFrame = (id) => {
      globalThis.__aiPendingFrames.delete(id);
      originalCancel(id);
    };
    const NativeResize = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class extends NativeResize {
      roots = new Set<string>();
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          globalThis.__aiObserverEvents.push({ kind: 'resize', roots: [...this.roots] });
          owner = [...this.roots][0] ?? '';
          try {
            callback(entries, observer);
          } finally {
            owner = '';
          }
        });
      }
      override observe(target: Element, options?: ResizeObserverOptions) {
        const id = target.closest('.ns-message-scroller')?.id;
        if (id) this.roots.add(id);
        super.observe(target, options);
      }
      override disconnect() {
        globalThis.__aiObserverEvents.push({ kind: 'resize-disconnect', roots: [...this.roots] });
        super.disconnect();
      }
    };
    const NativeMutation = globalThis.MutationObserver;
    globalThis.MutationObserver = class extends NativeMutation {
      roots = new Set<string>();
      constructor(callback: MutationCallback) {
        super((entries, observer) => {
          globalThis.__aiObserverEvents.push({ kind: 'mutation', roots: [...this.roots] });
          owner = [...this.roots][0] ?? '';
          try {
            callback(entries, observer);
          } finally {
            owner = '';
          }
        });
      }
      override observe(target: Node, options?: MutationObserverInit) {
        const id = target instanceof Element ? target.closest('.ns-message-scroller')?.id : '';
        if (id) this.roots.add(id);
        super.observe(target, options);
      }
      override disconnect() {
        globalThis.__aiObserverEvents.push({ kind: 'mutation-disconnect', roots: [...this.roots] });
        super.disconnect();
      }
    };
  });
  await page.reload();
  await expect(page.locator('#primary-scroller')).toHaveAttribute('data-scrollable', 'up');
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(() =>
      globalThis.__aiNativeListeners.filter((e) => e.root === 'primary-scroller').map((e) => e.type)
        .sort()
    ),
  ).toEqual(['keydown', 'pointerdown', 'scroll', 'touchstart', 'wheel']);
  await page.evaluate(() => {
    globalThis.__aiObserverEvents.length = 0;
  });
  await page.locator('#primary-scroller [data-stream-target]').evaluate((e) => {
    e.textContent += ' More streaming.'.repeat(50);
  });
  await expect.poll(() =>
    page.evaluate(() =>
      globalThis.__aiObserverEvents.some((e) =>
        e.kind === 'mutation' && e.roots.includes('primary-scroller')
      )
    )
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      globalThis.__aiObserverEvents.some((e) => e.roots.includes('secondary-scroller'))
    ),
  ).toBe(false);
  await page.getByRole('button', { name: 'Mount message viewport' }).evaluate(
    (e: HTMLButtonElement) => {
      const stream = document.querySelector('#primary-scroller [data-stream-target]');
      if (stream) stream.textContent += ' Pending stream';
      e.click();
    },
  );
  await expect(page.locator('#primary-scroller')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      globalThis.__aiNativeListeners.filter((e) => e.root === 'primary-scroller').length
    ),
  ).toBe(0);
  expect(
    await page.evaluate(() =>
      globalThis.__aiNativeListeners.filter((e) => e.root === 'secondary-scroller').length
    ),
  ).toBe(5);
  await expect.poll(() =>
    page.evaluate(() =>
      [...globalThis.__aiPendingFrames.values()].filter((id) => id === 'primary-scroller').length
    )
  ).toBe(0);
  for (const kind of ['resize-disconnect', 'mutation-disconnect']) {
    expect(
      await page.evaluate(
        (k) =>
          globalThis.__aiObserverEvents.some((e) =>
            e.kind === k && e.roots.includes('primary-scroller')
          ),
        kind,
      ),
    ).toBe(true);
  }
  expect(
    await page.evaluate(() =>
      globalThis.__aiObserverEvents.some((e) => e.kind === 'frame-after-detach')
    ),
  ).toBe(false);
  // Queue unmount before native reset work; the form's microtask must leave removed ownership alone.
  await page.getByRole('button', { name: 'Mount native answer forms' }).evaluate(
    (e: HTMLButtonElement) => {
      const form = document.querySelector('#native-answers form');
      e.click();
      if (form instanceof HTMLFormElement) form.reset();
    },
  );
  await expect(page.locator('#native-answers')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mount native answer forms' }).click();
  await expect(
    page.getByRole('form', { name: 'Native storage', exact: true }).getByRole('radio', {
      name: 'PostgreSQL',
      exact: true,
    }),
  ).toBeChecked();
});

test('message-scroller/native-reader-intent-during-growth-and-inert-input', async ({ page }) => {
  const root = page.locator('#primary-scroller');
  const view = root.getByRole('region', { name: 'Conversation', exact: true });
  const latest = root.getByRole('button', { name: 'Scroll to latest' });
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await view.evaluate((e) =>
    e.addEventListener('wheel', () => {
      const stream = e.querySelector('[data-stream-target]');
      if (stream) stream.textContent += ' Wheel-race growth.'.repeat(50);
    }, { once: true })
  );
  await view.hover();
  await page.mouse.wheel(0, -240);
  await expect(root).toHaveAttribute('data-scrollable', 'both');
  await settleNativeScroll(view);
  expect(await view.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop)).toBeGreaterThan(
    1,
  );
  await latest.click();
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await view.focus();
  await view.evaluate((e) =>
    e.addEventListener('keydown', () => {
      const stream = e.querySelector('[data-stream-target]');
      if (stream) stream.textContent += ' Key-race growth.'.repeat(50);
    }, { once: true })
  );
  await page.keyboard.press('PageUp');
  await expect(root).toHaveAttribute('data-scrollable', 'both');
  await settleNativeScroll(view);
  await latest.click();
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  // Wheel/pointer input at the boundary must not leave a sticky intent bit.
  await view.hover();
  await page.mouse.wheel(0, 80);
  await settleNativeScroll(view);
  await root.locator('[data-stream-target]').evaluate((e) => {
    e.textContent += ' After inert input.'.repeat(30);
  });
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await view.click({ position: { x: 8, y: 8 } });
  await settleNativeScroll(view);
  await root.locator('[data-stream-target]').evaluate((e) => {
    e.textContent += ' After pointer.'.repeat(30);
  });
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  const annotation = root.getByRole('textbox', { name: 'Message annotation' });
  await annotation.focus();
  await annotation.evaluate((e) =>
    e.addEventListener('keydown', () => {
      const stream = e.closest('.ns-message-scroller')?.querySelector('[data-stream-target]');
      if (stream) stream.textContent += ' Child editor growth.'.repeat(30);
    }, { once: true })
  );
  await annotation.press('ArrowLeft');
  await expect(root).toHaveAttribute('data-scrollable', 'up');
  await expect(annotation).toBeFocused();
});

test('questionnaire/native-radio-disabled-edge-matches-platform-reference', async ({ page, context }) => {
  const form = page.getByRole('form', { name: 'Native storage', exact: true });
  await form.getByRole('radio', { name: 'PostgreSQL', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  const component = await form.evaluate((e) =>
    [...e.querySelectorAll('input[type=radio]')].map((input) => {
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected native input');
      return {
        value: input.value,
        checked: input.checked,
        focused: input === document.activeElement,
        disabled: input.disabled,
      };
    })
  );
  const native = await context.newPage();
  try {
    await native.setContent(
      '<form><fieldset><legend>Native reference</legend><label>PostgreSQL<input type=radio name=answer value=postgres checked></label><label>SQLite<input type=radio name=answer value=sqlite></label><label>Deno KV<input type=radio name=answer value=kv disabled></label></fieldset></form>',
    );
    await native.getByRole('radio', { name: 'PostgreSQL', exact: true }).focus();
    await native.keyboard.press('ArrowDown');
    await native.keyboard.press('ArrowDown');
    const reference = await native.locator('form').evaluate((e) =>
      [...e.querySelectorAll('input[type=radio]')].map((input) => {
        if (!(input instanceof HTMLInputElement)) throw new Error('Expected native input');
        return {
          value: input.value,
          checked: input.checked,
          focused: input === document.activeElement,
          disabled: input.disabled,
        };
      })
    );
    expect(component).toEqual(reference);
    expect(component[2].checked).toBe(false);
    expect(component[2].focused).toBe(false);
  } finally {
    await native.close();
  }
});
