import {
  deepStrictEqual as assertEquals,
  ok as assert,
  throws as assertThrows,
} from 'node:assert/strict';
import site from '../../_config.ts';
import { type ConfiguredMarkdown, designMarkdown } from '../design-system-markdown.ts';
import {
  escapeHtml,
  renderDesignPages,
  renderTheme,
  sourceLinks,
} from '../design-system-render.ts';
import {
  type DesignSources,
  guidelineSection,
  loadDesignSources,
  parseTheme,
  SOURCE_ROOT,
  type Theme,
  valueRows,
} from '../design-system.ts';

const md = designMarkdown(site);

function assertStringIncludes(actual: string, expected: string, message?: string): void {
  assert(actual.includes(expected), message ?? `Expected HTML to include ${expected}`);
}
const fixtureSources: DesignSources = {
  guidelines: '',
  themes: [],
  previews: [],
  templates: { design: '', skill: '' },
  imageSizes: {},
};
const fixture = await Deno.readTextFile(new URL('./fixture.md', import.meta.url));

function assertUniqueIds(html: string): void {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assertEquals(
    ids.length,
    new Set(ids).size,
    `Duplicate IDs: ${ids.filter((id, index) => ids.indexOf(id) !== index).join(', ')}`,
  );
}

function assertCompleteTheme(theme: Theme, html: string): void {
  const prose = html.slice(html.indexOf('<section aria-label="Design specification">'));
  for (const heading of theme.body.match(/^#{2,4} .+$/gm) ?? []) {
    assertStringIncludes(
      prose,
      md(heading).trim(),
      `${theme.id}: dropped prose heading ${heading}`,
    );
  }
  assertStringIncludes(html, escapeHtml(theme.yaml), `${theme.id}: YAML source/comments lost`);
  for (const [group, values] of Object.entries(theme.values)) {
    if (['name', 'description', 'version'].includes(group)) continue;
    const start = html.indexOf(`id="values-${group}"`);
    assert(start >= 0, `${theme.id}: dropped value group ${group}`);
    const table = html.slice(start, html.indexOf('</table>', start));
    for (const row of valueRows(values)) {
      assertStringIncludes(
        table,
        `<code>${escapeHtml(row.path)}</code>`,
        `${theme.id}: dropped property ${group}.${row.path}`,
      );
      assertStringIncludes(
        table,
        `<code>${escapeHtml(row.value)}</code>`,
        `${theme.id}: dropped value ${group}.${row.path}`,
      );
    }
  }
  assertUniqueIds(html);
}

Deno.test('fixture renders every prose section, every value table and nested leaf', () => {
  const theme = parseTheme('fixture', fixture);
  const html = renderTheme(theme, [], fixtureSources, md);
  assertCompleteTheme(theme, html);
  const prose = html.slice(html.indexOf('<section aria-label="Design specification">'));
  for (
    const sentinel of [
      'Overview sentinel',
      'Colour policy sentinel',
      'Typography prose sentinel',
      'Layout sentinel',
      'Depth sentinel',
      'Shape sentinel',
      'Component anatomy sentinel',
      'Nested component sentinel',
      'Usage sentinel',
      'Imagery sentinel',
      'Motion sentinel',
      'Accessibility sentinel',
      'Mapping sentinel',
      'Sources sentinel',
    ]
  ) assertStringIncludes(prose, sentinel);
  assertStringIncludes(html, 'class="ns-design__swatch"');
  assertStringIncludes(html, 'fill="#fcfcfc"');
  assert(!html.includes('fill="red;'));
  assertStringIncludes(html, '<code>body.fontFamily</code>');
  assertStringIncludes(html, '<code>button.states.hover</code>');
  assertStringIncludes(html, '<code>curves[1]</code>');
  assertStringIncludes(html, '&lt;Theme Name&gt;');
  assertStringIncludes(html, '&lt;script&gt;');
  assert(!html.includes('<script>'));
  assert(!html.includes('Internal metadata'));
  assertStringIncludes(html, 'href="/design-system/themes/studio/"');
  assertStringIncludes(html, 'href="/design-system/guidelines/#2-theme-architecture"');
  assertStringIncludes(html, `${SOURCE_ROOT}themes/fixture/SKILL.md`);
});

Deno.test('fixture contract fails if a renderer drops a section or value table', () => {
  const theme = parseTheme('fixture', fixture);
  const html = renderTheme(theme, [], fixtureSources, md);
  assertThrows(() =>
    assertCompleteTheme(
      theme,
      html.replace('<p>Depth sentinel.</p>', '').replace(md('## Elevation & Depth').trim(), ''),
    )
  );
  assertThrows(() =>
    assertCompleteTheme(theme, html.replace('id="values-spacing"', 'id="dropped-spacing"'))
  );
  assertThrows(() =>
    assertCompleteTheme(theme, html.replace('<code>button.states.hover</code>', ''))
  );
});

Deno.test('incomplete source fails closed instead of publishing an empty specification', () => {
  assertThrows(() => parseTheme('fixture', '# Missing front matter'), Error, 'front matter');
  assertThrows(
    () => parseTheme('fixture', fixture.replace('spacing:\n  row-height: 47px', 'spacing: {}')),
    Error,
    'spacing',
  );
  assertThrows(
    () => parseTheme('fixture', fixture.replace('name: Fixture', 'name:')),
    Error,
    'name',
  );
});

Deno.test('guidelines projection ignores fenced headings and fails on missing sections', () => {
  const text =
    '# Guide\n\n## 1. Rules\nRules\n\n## 2. Tokens\n~~~md\n## 7. Not authoring\n~~~\nToken sentinel\n\n## 3. Compatibility\nCompatibility';
  assertEquals(
    guidelineSection(text, 2),
    '## 2. Tokens\n~~~md\n## 7. Not authoring\n~~~\nToken sentinel',
  );
  assertThrows(() => guidelineSection(text, 7), Error, 'missing section 7');
});

Deno.test('source links preserve external URLs, hash links and escaped query strings', () => {
  const input =
    '<a href="https://example.com/?a=1&amp;b=2">external</a><a href="#colors">local</a><a href="../studio/SKILL.md?a=1&amp;b=2">raw</a>';
  const html = sourceLinks(input, 'themes/tonal/DESIGN.md');
  assertStringIncludes(html, 'href="https://example.com/?a=1&amp;b=2"');
  assertStringIncludes(html, 'href="#colors"');
  assertStringIncludes(html, `${SOURCE_ROOT}themes/studio/SKILL.md?a=1&amp;b=2`);
});

Deno.test('configured Markdown keeps site anchors and restores raw HTML settings even on failure', () => {
  let before: boolean | undefined;
  let after: boolean | undefined;
  site.hooks.markdownIt((engine: ConfiguredMarkdown) => before = engine.options.html);
  assertStringIncludes(md('## Elevation & Depth'), 'id="elevation-depth"');
  assertStringIncludes(md("## Do's and Don'ts"), 'id="dos-and-donts"');
  assertStringIncludes(md('<script>fixture</script>'), '&lt;script&gt;');
  site.hooks.markdownIt((engine: ConfiguredMarkdown) => after = engine.options.html);
  assertEquals(after, before);
  site.hooks.markdownIt((engine: ConfiguredMarkdown) => {
    const original = engine.render;
    engine.render = () => {
      throw new Error('render failure');
    };
    try {
      assertThrows(() => md('failure'), Error, 'render failure');
      assertEquals(engine.options.html, before);
    } finally {
      engine.render = original;
    }
  });
});

Deno.test('real corpus: all theme sections, YAML leaves/comments, guidelines sections, flavors and templates survive', async () => {
  const sources = await loadDesignSources();
  const pages = renderDesignPages(sources, md, '');
  assertEquals(sources.themes.length, 11);
  assertEquals(sources.previews.length, 17);
  assertEquals(pages.length, 15);
  assertEquals(new Set(pages.map((page) => page.url)).size, pages.length);
  for (const page of pages) assertUniqueIds(page.content);
  for (const theme of sources.themes) {
    const page = pages.find((page) => page.url === `/design-system/themes/${theme.id}/`);
    assert(page);
    assertCompleteTheme(theme, page.content);
    assertStringIncludes(page.content, `${SOURCE_ROOT}themes/${theme.id}/DESIGN.md`);
    assertStringIncludes(page.content, `${SOURCE_ROOT}themes/${theme.id}/SKILL.md`);
  }
  const landing = pages[0].content;
  for (const preview of sources.previews) {
    assertStringIncludes(landing, `data-preset="${preview.id}"`);
    for (const scheme of ['light', 'dark']) {
      const file = `${preview.id}--${scheme}.webp`;
      assertStringIncludes(landing, `/assets/design-system/${file}`);
      assert(sources.imageSizes[file].width > 0);
      assert(sources.imageSizes[file].height > 0);
    }
  }
  assertStringIncludes(landing, 'Studio · Utility');
  assertStringIncludes(landing, 'NetScript default');
  const guide = pages.find((page) => page.url.endsWith('/guidelines/'))!;
  for (const heading of sources.guidelines.match(/^## .+$/gm) ?? []) {
    assertStringIncludes(guide.content, md(heading).trim());
  }
  const tokenPage = pages.find((page) => page.url.endsWith('/token-contract/'))!;
  assertStringIncludes(tokenPage.content, md(guidelineSection(sources.guidelines, 2)));
  const authoring = pages.find((page) => page.url.endsWith('/create-your-own-theme/'))!;
  assertStringIncludes(authoring.content, md(guidelineSection(sources.guidelines, 7)));
  assertStringIncludes(authoring.content, escapeHtml(sources.templates.design));
  assertStringIncludes(authoring.content, escapeHtml(sources.templates.skill));
  const studio = pages.find((page) => page.url.endsWith('/themes/studio/'))!;
  for (const flavor of ['utility', 'cloud', 'workshop', 'playful', 'ledger', 'atelier', 'signal']) {
    assertStringIncludes(studio.content, `id="design-flavor-${flavor}"`);
  }
});
