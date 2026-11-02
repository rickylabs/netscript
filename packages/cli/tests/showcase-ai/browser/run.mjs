/** Mounted Chromium assertions, using tools/fresh-ui-browser's checked-in npm lock. */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const [origin, output, toolRoot] = process.argv.slice(2);
const { chromium } = await import(
  pathToFileURL(join(toolRoot, 'node_modules/playwright-core/index.mjs')).href
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(5000);
const errors = [];
const reads = [];
const responseHeaders = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (request.method() === 'GET' && url.pathname.startsWith('/api/showcase/chat/')) {
    reads.push({
      request,
      path: url.pathname,
      live: url.searchParams.get('live'),
      offset: url.searchParams.get('offset'),
    });
  }
});
page.on('response', (response) => {
  const read = reads.find((candidate) => candidate.request === response.request());
  if (read && !read.live) {
    responseHeaders.push(
      response.headerValue('stream-next-offset').then((offset) => {
        read.nextOffset = offset;
      }),
    );
  }
});
const report = { passed: false, steps: [], errors, snapshotThenExactOffsetResume: false };
function check(condition, message) {
  if (!condition) throw new Error(message);
}
async function ready(label) {
  await page.waitForFunction(() => {
    const send = document.querySelector('button[aria-label="Send"]');
    return send && !send.disabled;
  });
  report.steps.push(label);
}
async function send(text) {
  await page.getByPlaceholder('Ask about Northwind orders…').fill(text);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.locator('.northwind-ai__message[data-role="assistant"] strong').first().waitFor();
  await page.locator('[data-scope="tool-call-card"][data-part="root"][data-status="done"]').first()
    .waitFor();
  await ready('turn finished');
}
try {
  await page.goto(origin + '/__test/login');
  await page.goto(origin);
  await page.locator('.northwind-ai__new').click();
  await ready('new empty thread accepts first prompt');
  await send('First browser prompt');
  check(
    await page.locator('.northwind-ai__message[data-role="user"]').count() === 1,
    'First prompt must persist exactly once',
  );
  report.steps.push('first prompt and live tool result rendered');
  await page.locator('.northwind-ai__new').click();
  await ready('second unused thread caught up');
  await page.getByRole('button', { name: 'First browser prompt', exact: true }).click();
  await ready('previous thread reopened');
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  await ready('unused thread reopened and accepts first prompt');
  await send('Unused browser prompt');
  await page.reload();
  await ready('nonempty transcript reloaded');
  await page.getByText('Unused browser prompt', { exact: true }).last().waitFor();
  await page.locator('.northwind-ai__message[data-role="assistant"] strong').waitFor();
  // The framework also projects a separate tool-role result; inspect the correlated named call.
  const cards = page.locator('[data-scope="tool-call-card"][data-part="root"]').filter({
    hasText: 'northwind_get_order',
  });
  check(await cards.count() === 1, 'Reload must retain exactly one named MCP call card');
  check(await cards.getAttribute('data-status') === 'done', 'Reloaded tool must be complete');
  await cards.locator('summary').click();
  check(
    (await cards.textContent()).includes('NW-00012'),
    'Reloaded native tool output must survive',
  );
  check(
    await page.locator('.northwind-ai__message[data-role="user"]').count() === 1,
    'Reload must not duplicate native user messages',
  );
  await page.screenshot({ path: join(output, 'reloaded-tools.png'), fullPage: true });
  report.steps.push('native messages, Markdown and tool output survive reload');
  const before = (await (await page.request.get(origin + '/__test/stats')).json()).turns;
  const forbidden = await page.request.post(origin + '/api/showcase/chat', {
    headers: { origin: 'https://foreign.test' },
  });
  check(forbidden.status() === 403, 'Real origin guard must reject cross-origin creation');
  await context.clearCookies();
  await page.getByRole('button', { name: 'First browser prompt', exact: true }).click();
  await page.getByRole('alert').waitFor();
  check(
    await page.getByRole('button', { name: 'Send', exact: true }).isDisabled(),
    'Unauthenticated catch-up must not unlock composer',
  );
  const denied = await page.request.post(origin + '/api/showcase/chat', { headers: { origin } });
  check(denied.status() === 401, 'Real auth guard must reject signed-out creation');
  check(
    (await (await page.request.get(origin + '/__test/stats')).json()).turns === before,
    'Denied requests must not invoke provider',
  );
  report.steps.push('origin and authentication failures remain closed');
  await Promise.all(responseHeaders);
  const liveReads = reads.filter((read) => read.live === 'sse');
  report.snapshotThenExactOffsetResume = liveReads.length > 0 && liveReads.every((live) => {
    const snapshot = reads.slice(0, reads.indexOf(live)).findLast((read) =>
      read.path === live.path && !read.live
    );
    return snapshot && typeof snapshot.nextOffset === 'string' &&
      live.offset === snapshot.nextOffset;
  });
  check(
    report.snapshotThenExactOffsetResume,
    'Browser must authenticate a finite catch-up and resume at its returned offset',
  );
  check(errors.length === 0, 'Mounted component must have no page errors');
  report.passed = true;
} catch (error) {
  report.failure = error.message;
  report.composerDisabled = await page.getByRole('button', { name: 'Send', exact: true })
    .isDisabled().catch(() => true);
  report.openingSavedConversation = await page.getByText('Opening your saved conversation…')
    .isVisible().catch(() => false);
  await page.screenshot({ path: join(output, 'failure.png'), fullPage: true });
} finally {
  await writeFile(join(output, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  await context.close();
  await browser.close();
}
if (!report.passed) {
  console.error(JSON.stringify(report));
  process.exitCode = 1;
} else console.log(JSON.stringify(report));
