import { expect, type Page, test, type TestInfo } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { analyzeStylePolicy, type StyleSource } from '../../docs-site/style-policy.ts';
import { inlineUtilityDiagram } from '../../docs-site/inline-diagram.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SITE = resolve(REPO, 'docs/site/_site');
const ROUTES = [
  { kind: 'home', path: './' },
  { kind: 'article', path: 'web-layer/fresh-ui/' },
  { kind: 'reference', path: 'reference/database/' },
  { kind: 'design-system', path: 'design-system/' },
  { kind: 'callouts', path: 'internal/callouts/' },
  { kind: 'code', path: 'internal/code/' },
  { kind: 'search', path: 'web-layer/fresh-ui/' },
] as const;

async function visit(page: Page, route: string): Promise<void> {
  const response = await page.goto(route);
  expect(response?.status(), `HTTP ${route}`).toBe(200);
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function search(page: Page, query = 'fresh ui tokens'): Promise<void> {
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Search documentation' }))
    .toBeVisible();
  await page.getByRole('combobox', { name: 'Search documentation' }).fill(
    query,
  );
  await expect(page.locator('#search-dialog')).toHaveAttribute(
    'data-state',
    'ready',
  );
}
async function audit(page: Page, info: TestInfo, name: string): Promise<void> {
  const report = await new AxeBuilder({ page }).analyze();
  const blocking = report.violations.filter((v) =>
    v.impact === 'serious' || v.impact === 'critical'
  );
  const reportPath = info.outputPath(`${name}-axe.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await info.attach(`${name}-axe`, {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(
    blocking.map((v) => ({
      id: v.id,
      impact: v.impact,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  const evidence = {
    command: 'npm test -- --config docs.playwright.config.ts',
    commit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim(),
    route: new URL(page.url()).pathname,
    project: info.project.name,
    viewport: page.viewportSize(),
    scheme: await page.locator('html').getAttribute('data-scheme'),
    browser: page.context().browser()?.version(),
    node: process.version,
    axe: {
      passes: report.passes.length,
      incomplete: report.incomplete.length,
      violations: report.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
      })),
      blocking: blocking.length,
    },
  };
  const evidencePath = info.outputPath(`${name}-evidence.json`);
  await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
  await info.attach(`${name}-evidence`, {
    path: evidencePath,
    contentType: 'application/json',
  });
}
for (const route of ROUTES) {
  test(
    `Utility ${route.kind}: screenshot, axe and responsive layout`,
    async ({ page }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await visit(page, route.path);
      if (route.kind === 'design-system') {
        const themes = page.locator('[data-sidebar] details.ns-nav-branch')
          .filter({
            has: page.locator('summary', { hasText: 'Themes' }),
          });
        await expect(themes.locator(':scope > summary')).toHaveText('Themes');
        await expect(themes.locator('a').filter({ hasText: /^Overview$/ }))
          .toHaveCount(0);
        await expect(themes.locator('a').first()).toHaveAttribute(
          'href',
          '/netscript/design-system/themes/studio/',
        );
        const separated = await page.locator('.ns-design__nav a').evaluateAll(
          (links) => {
            const boxes = links.map((link) => link.getBoundingClientRect());
            return boxes.length > 1 &&
              boxes.slice(1).every((box, index) =>
                box.left - boxes[index].right >= 4 ||
                box.top - boxes[index].bottom >= 4
              );
          },
        );
        expect(
          separated,
          'Design system navigation has a visible gap between links',
        ).toBe(true);
        await expect(page.locator('.docs-theme-context')).toHaveCount(0);
        await expect(page.locator('.ns-breadcrumb__item')).toHaveText([
          'Home',
          'Design system',
        ]);
      }
      if (route.kind === 'search') await search(page);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(
        true,
      );
      expect(await page.locator('html').getAttribute('data-theme')).toBe(
        'studio',
      );
      expect(await page.locator('html').getAttribute('data-scheme')).toBe(
        info.project.use.colorScheme,
      );
      const name = `${route.kind}-${info.project.name}`;
      const screenshot = info.outputPath(`${name}.png`);
      await page.screenshot({
        path: screenshot,
        animations: 'disabled',
      });
      await info.attach(name, { path: screenshot, contentType: 'image/png' });
      if (route.kind !== 'search') {
        const fullPage = info.outputPath(`${name}-full.png`);
        await page.screenshot({
          path: fullPage,
          fullPage: true,
          animations: 'disabled',
        });
        await info.attach(`${name}-full`, {
          path: fullPage,
          contentType: 'image/png',
        });
      }
      await audit(page, info, name);
      expect(errors).toEqual([]);
    },
  );
}

test(
  'keyboard: lanes, drawer, search, TOC and code tabs',
  async ({ page }, info) => {
    await visit(page, 'web-layer/fresh-ui/');
    if ((page.viewportSize()?.width ?? 1280) <= 960) {
      const trigger = page.locator('[data-sidebar-toggle]');
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#navigation-dialog')).toBeVisible();
      const lanes = page.locator('.docs-lanes--mobile a');
      await lanes.first().focus();
      await page.keyboard.press('Tab');
      await expect(lanes.nth(1)).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.locator('#navigation-dialog')).not.toBeVisible();
      await expect(trigger).toBeFocused();
    } else {
      const lanes = page.locator('.docs-topbar .docs-lanes a');
      await lanes.first().focus();
      await page.keyboard.press('Tab');
      await expect(lanes.nth(1)).toBeFocused();
    }
    const trigger = page.locator('[data-search-trigger]');
    await trigger.focus();
    await page.keyboard.press('Space');
    const input = page.locator('#search-query');
    await input.fill('fresh ui tokens');
    await expect(page.locator('#search-dialog')).toHaveAttribute(
      'data-state',
      'ready',
    );
    const before = await input.getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    const after = await input.getAttribute('aria-activedescendant');
    expect(after).not.toBe(before);
    await expect(page.locator(`#${after}`)).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    const mobile = page.locator('[data-mobile-toc]');
    if (await mobile.isVisible()) {
      await mobile.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(mobile).toHaveAttribute('open', '');
      await mobile.locator('a').first().focus();
      await page.keyboard.press('Enter');
      await expect(mobile).not.toHaveAttribute('open', '');
    } else {
      await page.locator('[data-toc] a').first().focus();
      await page.keyboard.press('Enter');
    }
    const tabs = page.locator('.ns-tabbed [role="tab"]');
    expect(await tabs.count()).toBeGreaterThan(1);
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
    await audit(page, info, 'keyboard');
  },
);

test('reference section focus stays visible after scrolling', async ({ page }) => {
  await visit(page, 'cli-reference/');
  await page.evaluate(() => scrollTo(0, 1400));
  const link = page.locator('[data-reference-nav] a').first();
  await link.focus();
  expect(
    await link.evaluate((a) => {
      const r = a.getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.x + r.width / 2,
        r.y + r.height / 2,
      );
      return r.y >= 56 && a.contains(hit);
    }),
  ).toBe(true);
  await expect(page.locator('[data-mobile-toc]')).not.toBeVisible();
});

test('Pagefind filters, hash navigation, empty, unavailable and stale states', async ({ page, context }) => {
  const indexRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/pagefind/')) indexRequests.push(r.url());
  });
  await visit(page, 'web-layer/fresh-ui/');
  expect(indexRequests).toEqual([]);
  await search(page);
  await page.getByRole('button', { name: /^Build / }).click();
  await expect(page.locator('#search-dialog')).toHaveAttribute(
    'data-state',
    'ready',
  );
  await expect(page.locator('[data-search-lane="Build"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    await page.locator('#search-results [role="group"]').evaluateAll((nodes) =>
      nodes.every((n) => n.getAttribute('aria-label')?.startsWith('Build'))
    ),
  ).toBe(true);
  await page.locator('#search-query').press('ArrowDown');
  const id = await page.locator('#search-query').getAttribute(
    'aria-activedescendant',
  );
  const target = await page.locator(`#${id}`).getAttribute('href');
  expect(target).toBeTruthy();
  await Promise.all([page.waitForURL(target!), page.keyboard.press('Enter')]);
  await expect(page.locator('#search-dialog')).not.toBeVisible();
  await page.keyboard.press('Control+k');
  await page.locator('#search-query').fill('"qxvplmnoexistzz"');
  await expect(page.locator('#search-dialog')).toHaveAttribute(
    'data-state',
    'empty',
  );
  await expect(page.getByRole('option')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('#search-fallback > summary').click();
  await page.locator('#search .pagefind-ui__search-input').fill('contracts');
  await expect(page.locator('#search .pagefind-ui__result-link').first())
    .toBeVisible();
  const errorPage = await context.newPage();
  await errorPage.route('**/pagefind/pagefind.js', (route) => route.abort());
  await visit(errorPage, './');
  await searchError(errorPage);
  await errorPage.close();
  // A new context avoids Pagefind's fragment cache, so the delayed response is real.
  const staleContext = await page.context().browser()!.newContext({
    baseURL: String(test.info().project.use.baseURL),
  });
  try {
    await staleContext.route('**/*.pf_fragment', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.continue();
    });
    const stale = await staleContext.newPage();
    await visit(stale, './');
    await stale.keyboard.press('Control+k');
    await stale.locator('#search-query').fill('fresh ui');
    await expect(stale.locator('#search-dialog')).toHaveAttribute(
      'data-state',
      'loading',
    );
    await stale.locator('#search-query').fill('"qxvplmnoexistzz"');
    await expect(stale.locator('#search-dialog')).toHaveAttribute(
      'data-state',
      'empty',
    );
    await stale.waitForTimeout(400);
    await expect(stale.getByRole('option')).toHaveCount(0);
  } finally {
    await staleContext.close();
  }
});
async function searchError(page: Page): Promise<void> {
  await page.keyboard.press('Control+k');
  await page.locator('#search-query').fill('contracts');
  await expect(page.locator('#search-dialog')).toHaveAttribute(
    'data-state',
    'error',
  );
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
}

test('diagram twins, accessible names, two-instance IDs and fileTree compatibility', async ({ page }) => {
  await visit(page, './');
  await page.locator('.docs-contract-details > summary').click();
  const source = page.locator('.ns-diagram > img').first();
  await expect(source).toHaveAttribute('hidden', '');
  await expect(source).toHaveAttribute('loading', 'lazy');
  const alt = await source.getAttribute('alt');
  expect(alt).toBeTruthy();
  await expect(page.getByRole('img', { name: alt!, exact: true }))
    .toBeVisible();
  const twin = await readFile(resolve(SITE, 'index.md'), 'utf8');
  expect(twin).toContain(
    `![${alt}](https://rickylabs.github.io/netscript/assets/diagrams/contract-flow.svg)`,
  );
  expect(twin).not.toContain('/netscript/netscript/');
  const prose = twin.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '');
  expect(prose.match(/^# /gm)).toHaveLength(1);
  expect(twin).not.toContain('data-ns-runtime · remembered');
  expect(twin).toContain(
    '[Read the quickstart →](https://rickylabs.github.io/netscript/quickstart/)',
  );
  const svg = await readFile(
    resolve(REPO, 'docs/site/assets/diagrams/contract-flow.svg'),
    'utf8',
  );
  await page.evaluate(
    (html) => {
      const fixture = document.createElement('section');
      fixture.id = 'diagram-fixture';
      fixture.innerHTML = html;
      document.querySelector('main')!.append(fixture);
    },
    inlineUtilityDiagram(svg, 'First diagram', 'first-fixture') +
      inlineUtilityDiagram(svg, 'Second diagram', 'second-fixture'),
  );
  const ids = await page.locator('#diagram-fixture [id]').evaluateAll((nodes) =>
    nodes.map((n) => n.id)
  );
  expect(new Set(ids).size).toBe(ids.length);
  await expect(page.getByRole('img', { name: 'First diagram', exact: true }))
    .toBeVisible();
  await expect(page.getByRole('img', { name: 'Second diagram', exact: true }))
    .toBeVisible();
  await visit(page, 'orchestration-runtime/runtime-config/');
  const tree = page.locator('.ns-file-tree--root').first();
  for (const name of ['runtime', 'current', 'features']) {
    await expect(tree).toContainText(name);
  }
  await visit(page, 'design-system/themes/studio/');
  await expect(page.locator('.ns-breadcrumb__item')).toHaveText([
    'Home',
    'Design system',
    'Themes',
    'Studio',
  ]);
  expect(
    await page.locator('.ns-breadcrumb a').evaluateAll((links) =>
      links.every((link) => Boolean(link.textContent?.trim()))
    ),
  ).toBe(true);
});

test(
  'runtime keyboard persistence, clipboard, no-JS and denied storage',
  async ({ page, browser }, info) => {
    await page.context().grantPermissions([
      'clipboard-read',
      'clipboard-write',
    ]);
    await visit(page, './');
    const tabs = page.locator('[data-ns-runtime-group] [role="tab"]');
    await expect(tabs).toHaveText(['postgres', 'mysql', 'mssql', 'sqlite']);
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => localStorage.getItem('ns-runtime'))).toBe(
      'mysql',
    );
    await page.reload();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.locator('.ns-hero [data-code-copy]').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      await page.locator('.ns-hero pre code').textContent(),
    );
    const nojs = await browser.newContext({
      javaScriptEnabled: false,
      baseURL: String(info.project.use.baseURL),
      viewport: page.viewportSize()!,
      colorScheme: info.project.use.colorScheme ?? 'light',
    });
    try {
      const p = await nojs.newPage();
      await visit(p, './');
      const panels = p.locator('[data-ns-runtime-group] [role="tabpanel"]');
      await expect(panels).toHaveCount(4);
      for (const [index, panel] of (await panels.all()).entries()) {
        await expect(panel).toBeVisible();
        await expect(panel.locator('.ns-code-label')).toHaveText(
          ['postgres', 'mysql', 'mssql', 'sqlite'][index],
        );
      }
      await p.locator('#search-fallback > summary').click();
      // Playwright's textContent matcher deliberately ignores noscript descendants.
      await expect(p.locator('#search noscript p')).toBeVisible();
      await expect(p.locator('#search')).toContainText(
        'Search needs JavaScript',
        {
          useInnerText: true,
        },
      );
    } finally {
      await nojs.close();
    }
    const denied = await browser.newContext({
      baseURL: String(info.project.use.baseURL),
      viewport: page.viewportSize()!,
    });
    try {
      await denied.addInitScript(() =>
        Object.defineProperty(globalThis, 'localStorage', {
          get() {
            throw Error('storage denied');
          },
        })
      );
      const p = await denied.newPage();
      const errors: string[] = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await visit(p, './');
      await p.locator('[data-theme-toggle]').click();
      expect(errors).toEqual([]);
    } finally {
      await denied.close();
    }
  },
);

async function collectFiles(
  root: string,
  excludeProtectedDesign = false,
): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (excludeProtectedDesign && entry.name === 'design') continue;
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path, excludeProtectedDesign));
    } else files.push(path);
  }
  return files;
}
async function ownedSources(): Promise<StyleSource[]> {
  const root = resolve(REPO, 'docs/site');
  const files = [resolve(root, 'favicon.svg')];
  for (const dir of ['styles', '_includes', '_components', 'assets/docs']) {
    files.push(
      ...await collectFiles(resolve(root, dir), dir === '_components'),
    );
  }
  const sources: StyleSource[] = [];
  for (const file of files) {
    if (!/\.(css|vto|js|svg)$/.test(file)) continue;
    const path = relative(root, file).replaceAll('\\', '/');
    sources.push({
      path,
      source: await readFile(file, 'utf8'),
      kind: path.endsWith('.css') ? 'css' : path.endsWith('.js') ? 'js' : 'html',
      tokenLayer: path === 'styles/tokens.css' || path === 'favicon.svg',
    });
  }
  for (const file of await collectFiles(SITE)) {
    if (file.endsWith('.css')) {
      const path = relative(SITE, file).replaceAll('\\', '/');
      sources.push({
        path: `_site/${path}`,
        kind: 'css',
        source: await readFile(file, 'utf8'),
        tokenLayer: path === 'styles/tokens.css',
        roleCheckOnly: path.startsWith('pagefind/'),
      });
      continue;
    }
    if (!file.endsWith('.html')) continue;
    const source = await readFile(file, 'utf8');
    if (source.includes('class="ns-diagram"')) {
      sources.push({
        path: `_site/${relative(SITE, file)}`,
        kind: 'html',
        source,
      });
    }
  }
  return sources;
}
test(
  'style policy: authored and rendered UI has no raw colours or misplaced red',
  async ({ page }, info) => {
    await visit(page, './');
    const sources = await ownedSources();
    if (process.env.DOCS_UI_NEGATIVE_CONTROL === 'raw-colour') {
      sources.push({
        path: 'styles/control.css',
        kind: 'css' as const,
        source: '.control { background-image: linear-gradient(#f00, #f00); }',
      });
    }
    if (process.env.DOCS_UI_NEGATIVE_CONTROL === 'red-role') {
      sources.push({
        path: 'styles/control.css',
        kind: 'css' as const,
        source: '.control { border-color: var(--ns-studio-signal-brand); }',
      });
    }
    const findings = await page.evaluate(analyzeStylePolicy, sources);
    const path = info.outputPath('style-policy.json');
    await writeFile(
      path,
      JSON.stringify(
        { sources: sources.map((s) => s.path), findings },
        null,
        2,
      ),
    );
    await info.attach('style-policy', {
      path,
      contentType: 'application/json',
    });
    expect(findings).toEqual([]);
  },
);
test('style policy negative contracts reject literal, named and aliased colours', async ({ page }) => {
  await visit(page, './');
  const layers = (await ownedSources()).filter((s) => s.tokenLayer);
  for (
    const source of [
      '.x{color:#ff0000}',
      '.x{background:red}',
      '.x{color:rgb(255 0 0)}',
      '.x{--paint:red;color:var(--paint)}',
      '.x{background-image:linear-gradient(#f00,#f00)}',
      '.x{filter:drop-shadow(0 0 2px red)}',
      '.x{stop-color:#f00}',
      '.x{flood-color:red}',
      '.x{lighting-color:red}',
      '.x{-webkit-text-fill-color:red}',
      '.x{text-emphasis-color:red}',
    ]
  ) {
    const findings = await page.evaluate(analyzeStylePolicy, [...layers, {
      path: 'styles/control.css',
      kind: 'css' as const,
      source,
    }]);
    expect(findings.some((f) => f.kind === 'raw-colour')).toBe(true);
  }
  for (
    const source of [
      '.x{color:var(--ns-studio-signal-brand)}',
      '.x{--alias:var(--ns-block-pink);background:var(--alias)}',
      '.x{border-color:var(--ns-studio-signal-brand)}',
      '.x{border-inline-start:1px solid var(--ns-studio-signal-brand)}',
      '.x{border-block-color:var(--ns-studio-signal-brand)}',
    ]
  ) {
    const findings = await page.evaluate(analyzeStylePolicy, [...layers, {
      path: 'styles/control.css',
      kind: 'css' as const,
      source,
    }]);
    expect(findings.some((f) => f.kind === 'red-outside-state')).toBe(true);
  }
  for (
    const source of [
      '.x{border-color:var(--ns-missing)}',
      '.x{--alias:var(--ns-missing);border-inline-start:1px solid var(--alias)}',
      '.x{padding:var(--ns-missing)}',
    ]
  ) {
    const findings = await page.evaluate(analyzeStylePolicy, [...layers, {
      path: 'styles/control.css',
      kind: 'css' as const,
      source,
    }]);
    expect(findings.some((f) => f.kind === 'undefined-role')).toBe(true);
  }
  expect(
    await page.evaluate(analyzeStylePolicy, [...layers, {
      path: 'styles/control.css',
      kind: 'css' as const,
      source:
        '.docs-logo{background:var(--ns-studio-signal-brand)} .notice[data-state="error"]{color:var(--ns-destructive-text)}',
    }]),
  ).toEqual([]);
  const unresolvedBuilt = await page.evaluate(analyzeStylePolicy, [...layers, {
    path: '_site/assets/third-party.css',
    kind: 'css' as const,
    source: '.fixture { gap: var(--ns-missing); }',
    roleCheckOnly: true,
  }]);
  expect(unresolvedBuilt.some((finding) => finding.kind === 'undefined-role'))
    .toBe(true);
});

test('callouts: semantic tone, default body and ink links', async ({ page }) => {
  await visit(page, 'internal/callouts/');
  for (
    const [kind, tone] of Object.entries({
      note: 'info',
      tip: 'success',
      warning: 'warning',
      caution: 'destructive',
      error: 'destructive',
    })
  ) {
    const callout = page.locator(`.ns-callout[data-variant="${kind}"]`).first();
    await expect(callout).toHaveAttribute('data-tone', tone);
    const paint = await callout.evaluate((node, tone) => {
      const probe = document.createElement('span');
      node.append(probe);
      const role = (name: string) => {
        probe.style.color = `var(--ns-${name})`;
        return getComputedStyle(probe).color;
      };
      const result = {
        background: getComputedStyle(node).backgroundColor,
        expectedBackground: role(`${tone}-subtle`),
        border: getComputedStyle(node).borderTopColor,
        expectedBorder: role(`${tone}-border`),
        head: getComputedStyle(node.querySelector('.ns-callout__head')!).color,
        expectedHead: role(`${tone}-text`),
        body: getComputedStyle(node.querySelector('.ns-callout__body')!).color,
        expectedBody: role('fg'),
        links: [...node.querySelectorAll('a')].map((a) => getComputedStyle(a).color),
      };
      probe.remove();
      return result;
    }, tone);
    expect(paint.background).toBe(paint.expectedBackground);
    expect(paint.border).toBe(paint.expectedBorder);
    expect(paint.head).toBe(paint.expectedHead);
    expect(paint.body).toBe(paint.expectedBody);
    expect(paint.links.every((painted) => painted === paint.expectedBody)).toBe(
      true,
    );
  }
});

test('internal galleries stay out of search and agent documentation', async ({ page }) => {
  for (const [slug, title] of [['callouts', 'Callout gallery'], ['code', 'Code gallery']]) {
    await visit(page, `internal/${slug}/`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('[data-pagefind-body], .ns-md-link')).toHaveCount(0);
    await expect(access(resolve(SITE, `internal/${slug}/index.md`))).rejects.toThrow();
    for (const index of ['llms.txt', 'llms-full.txt']) {
      expect(await readFile(resolve(SITE, index), 'utf8')).not.toContain(`/internal/${slug}/`);
    }
    const matches = await page.evaluate(async (title) => {
      const module = await import(new URL('/netscript/pagefind/pagefind.js', location.href).href);
      const result = await module.search(`"${title}"`);
      return result.results.length;
    }, title);
    expect(matches).toBe(0);
  }
});

test('API reference: visible kind tags and full-contrast names and signatures', async ({ page }) => {
  await visit(page, 'reference/database/');
  const tags = page.locator('.ns-api-kind');
  expect(await tags.count()).toBeGreaterThan(10);
  for (const kind of ['class', 'function', 'interface', 'type']) {
    await expect(page.locator(`.ns-api-kind[data-kind="${kind}"]`).first()).toBeVisible();
  }
  const contrast = await page.locator('.ns-api-table__name, .ns-api-table__type').evaluateAll(
    (cells) => {
      const probe = document.createElement('span');
      document.body.append(probe);
      probe.style.color = 'var(--ns-fg)';
      const foreground = getComputedStyle(probe).color;
      probe.remove();
      return cells.every((cell) =>
        getComputedStyle(cell).color === foreground &&
        [...cell.querySelectorAll('code')].every((code) =>
          getComputedStyle(code).color === foreground
        )
      );
    },
  );
  expect(contrast).toBe(true);
  await visit(page, 'orchestration-runtime/how-to/add-a-plugin/');
  const plugins = page.locator('.ns-api-table').filter({
    has: page.locator('caption', { hasText: 'Official plugins' }),
  });
  await expect(plugins).toHaveAttribute('data-variant', 'generic');
  await expect(plugins.locator('.ns-api-kind')).toHaveCount(0);
});

test('code headers: filename, human language, selected clipboard and no duplicate header', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await visit(page, 'internal/code/');
  const group = page.locator('.ns-tabbed').first();
  const header = group.locator(':scope > .ns-code-header');
  await expect(header).toBeVisible();
  await expect(group.locator('.ns-code-header:visible')).toHaveCount(1);
  const tabs = group.getByRole('tab');
  for (const [index, label] of ['TypeScript', 'Shell', 'JSON with comments'].entries()) {
    await tabs.nth(index).click();
    await expect(header.locator('.ns-code-language')).toHaveText(label);
    await expect(header.locator('[data-tab-filename]')).toHaveText(
      ['src/greeting.ts', 'scripts/start.sh', 'deno.json'][index],
    );
    await header.locator('[data-code-copy]').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      await group.locator('[role="tabpanel"]:visible pre code').textContent(),
    );
  }
  for (const block of await page.locator('[data-code-block]').all()) {
    await expect(block.locator('.ns-code-language')).not.toHaveText(/^(ts|sh|jsonc|py|ps1)$/);
  }
  const filename = page.locator('[data-code-block]').filter({
    has: page.locator('.ns-code-path', { hasText: 'services/users.contract.ts' }),
  });
  await expect(filename.locator('.ns-code-header')).toHaveCount(1);
  await expect(filename.locator('.ns-code-language')).toHaveText('TypeScript');
  for (
    const language of [
      'python',
      'powershell',
      'jsonc',
      'markdown',
      'dotenv',
      'yaml',
      'css',
      'diff',
      'sql',
      'html',
      'xml',
    ]
  ) {
    const code = page.locator(`code.language-${language}`).last();
    await expect(code.locator('[class^="hljs-"]').first()).toBeAttached();
  }
});

test(
  'code gallery remains labelled and fully readable without JavaScript',
  async ({ browser }, info) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      baseURL: String(info.project.use.baseURL),
      viewport: info.project.use.viewport,
      colorScheme: info.project.use.colorScheme,
    });
    try {
      const page = await context.newPage();
      await visit(page, 'internal/code/');
      await expect(page.locator('.ns-tabbed > .ns-code-header')).not.toBeVisible();
      for (const panel of await page.locator('.ns-tabbed__panel').all()) {
        await expect(panel).toBeVisible();
        await expect(panel.locator('.ns-code-header')).toBeVisible();
        await expect(panel.locator('.ns-code-path')).not.toBeEmpty();
        await expect(panel.locator('.ns-code-language')).not.toBeEmpty();
      }
    } finally {
      await context.close();
    }
  },
);

test('code header metadata stays out of twins and search bodies', async ({ page }) => {
  await visit(page, 'durable-workflows/sagas/');
  for (const node of await page.locator('.ns-code-header, .ns-code-gutter').all()) {
    await expect(node).toHaveAttribute('data-pagefind-ignore', '');
  }
  const twin = await readFile(resolve(SITE, 'durable-workflows/sagas/index.md'), 'utf8');
  const prose = twin.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '');
  expect(prose).not.toMatch(/\S+(?:TypeScript|Shell|JSON with comments)/);
  expect(prose).not.toMatch(/^(?:TypeScript|Shell|Plain text|JSON with comments)$/m);
  expect(twin).toMatch(/```(?:ts|typescript)\n/);
  expect(twin).toContain('plugins/sagas/order-saga.ts');
});
