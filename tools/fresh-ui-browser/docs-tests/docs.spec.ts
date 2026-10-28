import { expect, type Page, test, type TestInfo } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { analyzeStylePolicy, type StyleSource } from '../../docs-site/style-policy.ts';
import { inlineUtilityDiagram } from '../../docs-site/inline-diagram.ts';
import { AA_TEXT_CONTRAST, contrastRatio } from '../../docs-site/contrast.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SITE = resolve(REPO, 'docs/site/_site');
const ROUTES = [
  { kind: 'home', path: './' },
  { kind: 'article', path: 'web-layer/fresh-ui/' },
  { kind: 'reference', path: 'reference/database/' },
  { kind: 'design-system', path: 'design-system/' },
  { kind: 'callouts', path: 'design-system/docs-kit/callouts/' },
  { kind: 'code', path: 'design-system/docs-kit/code/' },
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

test('reader follow-ups: bundled CSS, consistent chip gaps and named heading links', async ({ page }) => {
  await visit(page, './');
  const gaps = await page.locator('.ns-path-stack .ns-file-path').evaluateAll((chips) => {
    const boxes = chips.map((chip) => chip.getBoundingClientRect());
    return boxes.slice(1).map((box, index) => box.top - boxes[index].bottom);
  });
  expect(gaps).toHaveLength(3);
  for (const gap of gaps) expect(gap).toBeCloseTo(8, 0);
  const bundle = await readFile(resolve(SITE, 'styles/docs.css'), 'utf8');
  expect(bundle).not.toMatch(/@import\b/);
  expect(bundle).toContain('--ns-bg:');
  expect(bundle).toContain('.ns-file-path');

  await visit(page, 'web-layer/fresh-ui/');
  const names = await page.locator('.ns-heading-anchor').evaluateAll((links) =>
    links.map((link) => ({
      actual: link.getAttribute('aria-label'),
      expected: `Permalink to ${link.parentElement?.textContent?.trim()}`,
    }))
  );
  expect(names.length).toBeGreaterThan(0);
  for (const { actual, expected } of names) expect(actual).toBe(expected);
  const tabs = await page.locator('.ns-tabbed [role="tab"]').evaluateAll((tabs) =>
    tabs.map((tab) => {
      const id = tab.getAttribute('aria-controls') ?? '';
      const panel = document.getElementById(id);
      return Boolean(panel && panel.getAttribute('aria-labelledby') === tab.id);
    })
  );
  expect(tabs.length).toBeGreaterThan(0);
  expect(tabs.every(Boolean)).toBe(true);
});

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
        generatedTokenBundle: path === 'styles/docs.css',
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
    if (process.env.DOCS_UI_NEGATIVE_CONTROL === 'raw-custom') {
      sources.push({
        path: 'styles/control.css',
        kind: 'css' as const,
        source: ':root { --ns-authored-paint: #123456; }',
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
  const fixtureLayer: StyleSource = {
    path: 'styles/tokens.css',
    kind: 'css',
    tokenLayer: true,
    source: ':root { --ns-known: #123456; }',
  };
  for (const generatedTokenBundle of [false, true]) {
    for (
      const source of [
        ':root { --ns-authored-paint: #123456; }',
        ':root { --ns-known: #654321; }',
        '.wrong { --ns-known: #123456; }',
      ]
    ) {
      const findings = await page.evaluate(analyzeStylePolicy, [fixtureLayer, {
        path: generatedTokenBundle ? '_site/styles/docs.css' : 'styles/components.css',
        kind: 'css' as const,
        generatedTokenBundle,
        source,
      }]);
      expect(findings.some((finding) => finding.kind === 'raw-colour')).toBe(true);
    }
  }
  expect(
    await page.evaluate(analyzeStylePolicy, [fixtureLayer, {
      path: '_site/styles/docs.css',
      kind: 'css' as const,
      generatedTokenBundle: true,
      source: fixtureLayer.source,
    }]),
  ).toEqual([]);
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
      '.ns-prose .hljs-keyword{color:var(--ns-destructive-text)}',
      '.ns-callout[data-tone="info"]{color:var(--ns-destructive-text)}',
      '.x[data-tone="destructive-decoration"]{color:var(--ns-destructive-text)}',
      '.x[data-variant="errorish"]{color:var(--ns-destructive-text)}',
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
        '.docs-logo{background:var(--ns-studio-signal-brand)} .notice[data-state="error"]{color:var(--ns-destructive-text)} .ns-callout[data-tone="destructive"]{border-color:var(--ns-destructive-border)}',
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
  await visit(page, 'design-system/docs-kit/callouts/');
  for (
    const [kind, tone] of Object.entries({
      note: 'info',
      tip: 'success',
      important: 'important',
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

test('callout labels: one body-sized label, first-line icon alignment and typed twins', async ({ page }) => {
  await visit(page, 'design-system/docs-kit/callouts/');
  const types: Record<string, string> = {
    note: 'Note',
    tip: 'Tip',
    important: 'Important',
    warning: 'Warning',
    caution: 'Caution',
    error: 'Error',
  };
  for (const label of Object.values(types)) {
    const callout = page.getByRole('note', { name: label, exact: true });
    await expect(callout).toHaveCount(1);
    await expect(callout.locator('.ns-callout__label')).toHaveText(label);
  }
  await expect(page.locator('.ns-callout__head .ns-eyebrow, .ns-callout__title')).toHaveCount(0);
  const callouts = await page.locator('.ns-callout').evaluateAll((nodes) =>
    nodes.map((node) => {
      const label = node.querySelector('.ns-callout__label')!;
      const icon = node.querySelector('.ns-callout__icon')!;
      const body = node.querySelector('.ns-callout__body')!;
      const glyph = icon.querySelector('svg')!;
      const style = getComputedStyle(label);
      const range = document.createRange();
      range.selectNodeContents(label);
      const lines = [...range.getClientRects()].filter((rect) => rect.width > 0);
      const firstLine = lines[0];
      const box = label.getBoundingClientRect(), iconBox = icon.getBoundingClientRect();
      const glyphBox = glyph.getBoundingClientRect();
      return {
        kind: node.getAttribute('data-variant')!,
        label: label.textContent!.trim(),
        accessibleName: node.getAttribute('aria-label'),
        headText: node.querySelector('.ns-callout__head')!.textContent!.trim(),
        labelCount: node.querySelectorAll('.ns-callout__label').length,
        bodyCount: node.querySelectorAll('.ns-callout__body').length,
        family: style.fontFamily,
        weight: style.fontWeight,
        size: style.fontSize,
        bodySize: getComputedStyle(body).fontSize,
        lineHeight: Number.parseFloat(style.lineHeight),
        transform: style.textTransform,
        colour: style.color,
        iconColour: getComputedStyle(icon).color,
        iconWidth: iconBox.width,
        iconHeight: iconBox.height,
        glyphWidth: glyphBox.width,
        glyphHeight: glyphBox.height,
        iconCentre: iconBox.top + iconBox.height / 2,
        glyphCentre: glyphBox.top + glyphBox.height / 2,
        firstLineCentre: firstLine.top + firstLine.height / 2,
        lineBoxCentre: box.top + Number.parseFloat(style.lineHeight) / 2,
        labelLeft: box.left,
        bodyLeft: body.getBoundingClientRect().left,
        gap: box.left - iconBox.right,
        lines: new Set(lines.map((line) => Math.round(line.top))).size,
      };
    })
  );
  expect(callouts).toHaveLength(12);
  const twin = await readFile(resolve(SITE, 'design-system/docs-kit/callouts/index.md'), 'utf8');
  expect(twin.match(/^> \[![A-Z]+\]$/gm)).toHaveLength(callouts.length);
  const wrappedKinds = new Set<string>();
  for (const callout of callouts) {
    const type = types[callout.kind];
    expect(callout.accessibleName).toBe(
      callout.label === type ? type : `${type}: ${callout.label}`,
    );
    expect(callout.labelCount).toBe(1);
    expect(callout.bodyCount).toBe(1);
    expect(callout.headText).toBe(callout.label);
    expect(callout.family).toContain('Host Grotesk');
    expect(callout.weight).toBe('500');
    expect(callout.size).toBe(callout.bodySize);
    expect(callout.size).toBe('14px');
    expect(callout.transform).toBe('none');
    expect(callout.iconColour).toBe(callout.colour);
    expect(callout.iconHeight).toBeCloseTo(callout.lineHeight, 2);
    expect(callout.iconWidth).toBeCloseTo(callout.lineHeight, 2);
    expect(callout.glyphWidth).toBe(18);
    expect(callout.glyphHeight).toBe(18);
    expect(Math.abs(callout.iconCentre - callout.firstLineCentre), callout.label)
      .toBeLessThanOrEqual(1);
    expect(Math.abs(callout.iconCentre - callout.lineBoxCentre), callout.label).toBeLessThanOrEqual(
      1,
    );
    expect(callout.glyphCentre).toBeCloseTo(callout.iconCentre, 2);
    expect(callout.bodyLeft).toBeCloseTo(callout.labelLeft, 2);
    expect(callout.gap).toBeCloseTo(8, 2);
    const header = `> [!${callout.kind.toUpperCase()}]\n> ${callout.label}\n`;
    expect(twin.split(header).length - 1, header).toBe(1);
    if (callout.label.length > 100) {
      expect(callout.lines, callout.label).toBeGreaterThan(1);
      wrappedKinds.add(callout.kind);
      const block =
        `${header}>\n> The icon stays beside the first line. The body starts on the same left edge as the label.`;
      expect(twin.split(block).length - 1).toBe(1);
    }
  }
  expect([...wrappedKinds].sort()).toEqual(['caution', 'important', 'note', 'tip', 'warning']);
  for (const kind of Object.keys(types)) {
    const markers = twin.split('\n').filter((line) => line === `> [!${kind.toUpperCase()}]`);
    expect(markers).toHaveLength(callouts.filter((callout) => callout.kind === kind).length);
  }
});

test('public galleries belong to Design system Docs kit in navigation, search and twins', async ({ page }) => {
  await visit(page, 'design-system/');
  await expect(page.locator('.ns-design__nav').getByRole('link', { name: 'Docs kit' }))
    .toHaveAttribute('href', '/netscript/design-system/docs-kit/');
  for (const [slug, title] of [['callouts', 'Callout gallery'], ['code', 'Code gallery']]) {
    const route = `design-system/docs-kit/${slug}/`;
    await visit(page, route);
    await expect(page.locator('.ns-breadcrumb__item')).toHaveText([
      'Home',
      'Design system',
      'Docs kit',
      title,
    ]);
    await expect(page.locator('[data-pagefind-body]')).toHaveCount(1);
    await expect(page.locator('[data-sidebar] a').filter({ hasText: new RegExp(`^${title}$`) }))
      .toHaveAttribute('href', `/netscript/${route}`);
    await access(resolve(SITE, `${route}index.md`));
    for (const index of ['llms.txt', 'llms-full.txt']) {
      expect(await readFile(resolve(SITE, index), 'utf8')).toContain(`/${route}`);
      expect(await readFile(resolve(SITE, index), 'utf8')).not.toContain(`/internal/${slug}/`);
    }
    const matches = await page.evaluate(async (title) => {
      const module = await import(new URL('/netscript/pagefind/pagefind.js', location.href).href);
      const result = await module.search(`"${title}"`);
      return await Promise.all(
        result.results.map((
          match: { data: () => Promise<{ url: string; filters: Record<string, string[]> }> },
        ) => match.data()),
      );
    }, title);
    expect(
      matches.some((match) =>
        match.url.endsWith(`/${route}`) && match.filters.lane.includes('Design system')
      ),
    ).toBe(true);
    await expect(access(resolve(SITE, `internal/${slug}/index.html`))).rejects.toThrow();
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
  await visit(page, 'design-system/docs-kit/code/');
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
      await visit(page, 'design-system/docs-kit/code/');
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

test('syntax: generated roles, actual code backgrounds and AA contrast', async ({ page }) => {
  await visit(page, 'design-system/docs-kit/code/');
  const paint = await page.locator('.ns-prose').evaluate((prose) => {
    const probe = document.createElement('span');
    prose.append(probe);
    const roles: Record<string, string> = {};
    for (
      const role of ['keyword', 'function', 'type', 'string', 'number', 'comment', 'punctuation']
    ) {
      probe.style.color = `var(--ns-code-syntax-${role})`;
      roles[role] = getComputedStyle(probe).color;
    }
    probe.style.color = 'var(--ns-code-bg)';
    const background = getComputedStyle(probe).color;
    probe.remove();
    const examples = Object.fromEntries(
      Object.entries({
        keyword: '.hljs-keyword',
        function: '.hljs-title.function_',
        type: '.hljs-built_in',
        string: '.hljs-string',
        number: '.hljs-number',
        comment: '.hljs-comment',
        punctuation: '.hljs-punctuation',
      }).map(([role, selector]) => [role, getComputedStyle(prose.querySelector(selector)!).color]),
    );
    const tokens = [...prose.querySelectorAll('pre code [class*="hljs-"]')].map((token) => ({
      classes: token.className,
      foreground: getComputedStyle(token).color,
      background: getComputedStyle(token.closest('pre')!).backgroundColor,
    }));
    return { roles, examples, background, tokens };
  });
  expect(paint.tokens.length).toBeGreaterThan(40);
  for (const [role, actual] of Object.entries(paint.examples)) {
    expect(actual).toBe(paint.roles[role]);
  }
  for (const token of paint.tokens) {
    expect(token.background).toBe(paint.background);
    expect(Object.values(paint.roles), token.classes).toContain(token.foreground);
    expect(contrastRatio(token.foreground, token.background), token.classes).toBeGreaterThanOrEqual(
      AA_TEXT_CONTRAST,
    );
  }
});

test('API kind paint and badge anatomy follow the merged Utility spec', async ({ page }) => {
  // Independent contract: do not derive expectations from the implementation mapping.
  const expectedRoles: Record<string, string> = {
    class: 'type',
    interface: 'keyword',
    type: 'keyword',
    function: 'function',
    method: 'function',
    const: 'number',
    variable: 'number',
    enum: 'number',
    module: 'fg',
    namespace: 'fg',
    component: 'function',
  };
  const seen = new Set<string>();
  let highlightedSignatures = 0;
  for (const route of ['reference/database/', 'reference/fresh-ui/', 'design-system/docs-kit/']) {
    await visit(page, route);
    const tags = await page.locator('.ns-api-kind').evaluateAll((tags) =>
      tags.map((tag) => {
        const role = tag.getAttribute('data-syntax-role')!;
        const probe = document.createElement('span');
        tag.append(probe);
        probe.style.color = role === 'fg' ? 'var(--ns-fg)' : `var(--ns-code-syntax-${role})`;
        const expected = getComputedStyle(probe).color;
        probe.remove();
        const style = getComputedStyle(tag);
        let ancestor = tag.parentElement!;
        while (
          getComputedStyle(ancestor).backgroundColor === 'rgba(0, 0, 0, 0)' &&
          ancestor.parentElement
        ) ancestor = ancestor.parentElement;
        const dot = tag.querySelector('.ns-api-kind__dot')!;
        const dotStyle = getComputedStyle(dot);
        return {
          kind: tag.getAttribute('data-kind')!,
          role,
          actual: style.color,
          background: style.backgroundColor,
          tableBackground: getComputedStyle(ancestor).backgroundColor,
          expected,
          outline: [style.borderTopWidth, style.borderTopStyle, style.borderTopColor],
          radius: style.borderRadius,
          font: style.fontFamily,
          size: style.fontSize,
          dot: {
            width: dotStyle.width,
            height: dotStyle.height,
            radius: dotStyle.borderRadius,
            colour: dotStyle.backgroundColor,
            hidden: dot.getAttribute('aria-hidden'),
          },
        };
      })
    );
    for (const tag of tags) {
      seen.add(tag.kind);
      expect(tag.role).toBe(expectedRoles[tag.kind]);
      expect(tag.actual).toBe(tag.expected);
      expect(tag.background).toBe('rgba(0, 0, 0, 0)');
      expect(tag.outline).toEqual(['1px', 'solid', tag.expected]);
      expect(tag.radius).toBe('2px');
      expect(tag.font).toContain('Fragment Mono');
      expect(tag.size).toBe('11px');
      expect(tag.dot).toEqual({
        width: '6px',
        height: '6px',
        radius: '0px',
        colour: tag.expected,
        hidden: 'true',
      });
      expect(contrastRatio(tag.actual, tag.tableBackground)).toBeGreaterThanOrEqual(
        AA_TEXT_CONTRAST,
      );
    }
    highlightedSignatures += await page.locator('.ns-api-table__type .hljs-keyword').count();
  }
  expect(highlightedSignatures).toBeGreaterThan(0);
  for (const kind of Object.keys(expectedRoles)) {
    expect(seen.has(kind)).toBe(true);
  }
});

test('API symbols never wrap inside an identifier and scroll within their table', async ({ page }) => {
  await visit(page, 'reference/database/');
  const symbols = await page.locator(
    '.ns-api-table__name code, .ns-api-table[data-variant="symbols"] .ns-api-table__type code > span',
  ).evaluateAll((codes) =>
    codes.filter((code) =>
      code.closest('.ns-api-table__name') || /^[A-Za-z_$][\w$]*$/.test(code.textContent ?? '')
    ).map((code) => {
      const range = document.createRange();
      range.selectNodeContents(code);
      const rows = new Set(
        [...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) =>
          Math.round(rect.top)
        ),
      );
      const wrapper = code.closest('.ns-api-table-wrap')!;
      return {
        name: code.textContent,
        lines: rows.size,
        overflow: getComputedStyle(wrapper).overflowX,
      };
    })
  );
  expect(symbols.length).toBeGreaterThan(50);
  expect(symbols.some((symbol) => symbol.name === 'DatabaseConnectionOptions')).toBe(true);
  for (const symbol of symbols) {
    expect(symbol.lines, symbol.name!).toBe(1);
    expect(symbol.overflow).toBe('auto');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('package heading code inherits display typography without a chip', async ({ page }) => {
  await visit(page, 'reference/database/');
  const paint = await page.locator('h1 code').evaluate((code) => {
    const style = getComputedStyle(code), heading = getComputedStyle(code.parentElement!);
    return {
      font: style.fontFamily,
      size: style.fontSize,
      headingSize: heading.fontSize,
      weight: style.fontWeight,
      headingWeight: heading.fontWeight,
      lineHeight: style.lineHeight,
      headingLineHeight: heading.lineHeight,
      background: style.backgroundColor,
      padding: style.padding,
      border: style.borderWidth,
      radius: style.borderRadius,
    };
  });
  expect(paint.font).toContain('Fragment Mono');
  expect(paint.size).toBe(paint.headingSize);
  expect(paint.weight).toBe(paint.headingWeight);
  expect(paint.lineHeight).toBe(paint.headingLineHeight);
  expect(paint.background).toBe('rgba(0, 0, 0, 0)');
  expect(paint.padding).toBe('0px');
  expect(paint.border).toBe('0px');
  expect(paint.radius).toBe('0px');
});

test('filename and tab headers align language beside Copy with the same gap', async ({ page }) => {
  await visit(page, 'design-system/docs-kit/code/');
  const group = page.locator('.ns-tabbed').first();
  for (const tab of await group.getByRole('tab').all()) {
    await tab.click();
    const headers = page.locator('.ns-code-header:visible').filter({
      has: page.locator('.ns-code-path'),
    });
    expect(await headers.count()).toBeGreaterThan(1);
    for (const header of await headers.all()) {
      const language = await header.locator('.ns-code-language').boundingBox();
      const copy = await header.locator('.ns-copy-btn').boundingBox();
      const box = await header.boundingBox();
      expect(language).not.toBeNull();
      expect(copy).not.toBeNull();
      expect(box).not.toBeNull();
      expect(copy!.x - (language!.x + language!.width)).toBeCloseTo(12, 0);
      expect(box!.x + box!.width - (copy!.x + copy!.width)).toBeCloseTo(10, 0);
    }
  }
});

test('file paths: single-line ellipsis, full titles and one list gap', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await visit(page, './');
  const chips = page.locator('.ns-path-stack .ns-file-path');
  await expect(chips).toHaveCount(4);
  const measurements = await chips.evaluateAll((chips) =>
    chips.map((chip) => {
      const text = chip.querySelector('.ns-file-path__value')!;
      const style = getComputedStyle(text);
      const box = chip.getBoundingClientRect();
      return {
        title: chip.getAttribute('title'),
        text: text.textContent,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
        overflowWrap: style.overflowWrap,
        overflow: style.overflow,
        ellipsis: style.textOverflow,
        textHeight: text.getBoundingClientRect().height,
        lineHeight: parseFloat(style.lineHeight),
        top: box.top,
        bottom: box.bottom,
      };
    })
  );
  const gap = await page.locator('.ns-path-stack').evaluate((stack) =>
    parseFloat(getComputedStyle(stack).rowGap)
  );
  for (const [index, chip] of measurements.entries()) {
    expect(chip.title).toBe(chip.text);
    expect(chip.whiteSpace).toBe('nowrap');
    expect(chip.wordBreak).toBe('normal');
    expect(chip.overflowWrap).toBe('normal');
    expect(chip.overflow).toBe('hidden');
    expect(chip.ellipsis).toBe('ellipsis');
    expect(chip.textHeight).toBeLessThanOrEqual(chip.lineHeight + 1);
    if (index) expect(chip.top - measurements[index - 1].bottom).toBeCloseTo(gap, 0);
  }
  await chips.last().locator('[data-copy-path]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(measurements.at(-1)!.text);
  await visit(page, 'web-layer/fresh-ui/');
  const tagline = page.locator('.ns-prose p').filter({
    hasText: 'Fresh runtime extensions, builders, forms, defer',
  });
  await expect(tagline).toHaveCount(1);
  await expect(tagline.locator('code').filter({ hasText: 'Fresh runtime extensions' })).toHaveCount(
    0,
  );
});

test('API signature generics survive HTML rendering and highlighting', async ({ page }) => {
  await visit(page, 'durable-workflows/sagas/');
  const state = page.locator('.ns-api-table__identity').filter({
    has: page.locator('.ns-api-table__name', { hasText: /^SagaState$/ }),
  });
  await expect(state.locator('.ns-api-table__type')).toHaveText(
    'Readonly<Record<string, unknown>>',
  );
  const definition = page.locator('.ns-api-table__identity').filter({
    has: page.locator('.ns-api-table__name', { hasText: /^SagaDefinition<Id, S, M>$/ }),
  });
  await expect(definition).toHaveCount(1);
  await expect(definition.locator('.ns-api-table__type')).toContainText(
    'Readonly<{ id, durability, initialState',
  );
});
