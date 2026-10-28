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

// Deliberately independent of production constants and the mutated source.
const REQUIRED_THEME_H2S = [
  'Overview',
  'Colors',
  'Typography',
  'Layout',
  'Elevation & Depth',
  'Shapes',
  'Components',
  "Do's and Don'ts",
  'Iconography & Imagery',
  'Motion & States',
  'Accessibility',
  'NetScript Mapping',
  'Sources',
];
const REQUIRED_GUIDELINE_H2S = [
  '1. Two rules that override everything',
  '2. Theme architecture',
  '3. Compatibility contract (MUST)',
  '4. The quality method',
  '5. Anti-patterns',
  '6. Theme catalogue',
  '7. Creating a new theme: step by step',
  '8. Shipping (planned)',
];

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
  for (const title of REQUIRED_THEME_H2S) {
    const heading = `## ${title}`;
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

// These regressions exercise source mutations, rather than only output mutations.
Deno.test('negative: deleting a required theme section fails source validation', () => {
  assertThrows(() => parseTheme('fixture', fixture.replace('## Colors\n', '')), {
    message: /Colors/,
  });
});

Deno.test('negative: deleting a guidelines section fails page generation', async () => {
  const sources = await loadDesignSources();
  sources.guidelines = sources.guidelines.replace('## 5. Anti-patterns\n', '');
  assertThrows(() => renderDesignPages(sources, md), { message: /5/ });
});

Deno.test('negative: renaming a referenced guidelines heading fails instead of publishing a dead link', async () => {
  const sources = await loadDesignSources();
  sources.guidelines = sources.guidelines.replace(
    '## 3. Compatibility contract (MUST)',
    '## 3. Renamed compatibility',
  );
  assertThrows(() => renderDesignPages(sources, md), { message: /3|anchor/ });
});

Deno.test('required sections cannot be missing, reordered, duplicated or hidden in fences', async () => {
  for (const title of REQUIRED_THEME_H2S) {
    const heading = `## ${title}\n`;
    assertThrows(() => parseTheme('fixture', fixture.replace(heading, '')));
    assertThrows(() =>
      parseTheme('fixture', fixture.replace(heading, `\`\`\`md\n${heading}\`\`\`\n`))
    );
    assertThrows(() => parseTheme('fixture', fixture.replace(heading, heading + heading)));
  }
  assertThrows(() =>
    parseTheme(
      'fixture',
      fixture.replace('## Colors', '## Typography').replace(
        '## Typography\n\nTypography',
        '## Colors\n\nTypography',
      ),
    )
  );
  const sources = await loadDesignSources();
  for (const title of REQUIRED_GUIDELINE_H2S) {
    assertThrows(() =>
      renderDesignPages(
        { ...sources, guidelines: sources.guidelines.replace(`## ${title}\n`, '') },
        md,
      )
    );
  }
});

Deno.test('fixed fixture assertions detect a section deleted from both input and output', async () => {
  const theme = parseTheme('fixture', fixture);
  theme.body = theme.body.replace('## Colors\n', '');
  assertThrows(() => assertCompleteTheme(theme, renderTheme(theme, [], fixtureSources, md)));
  const sources = await loadDesignSources();
  assertEquals(
    sources.templates.design.match(/^## .+$/gm) ?? [],
    REQUIRED_THEME_H2S.map((title) => `## ${title}`),
  );
});

Deno.test('page assets are linked once and generated table headings are unambiguous', async () => {
  const sources = await loadDesignSources();
  const pages = renderDesignPages(sources, md);
  for (const page of pages) {
    assertStringIncludes(
      page.content,
      '<link rel="stylesheet" href="/assets/design-system/section.css">',
    );
    assert(!page.content.includes('<style>'));
  }
  const theme = pages.find((page) => page.url.endsWith('/themes/tonal/'))!;
  for (const label of ['Colors', 'Typography', 'Radii', 'Spacing', 'Component recipes']) {
    assertStringIncludes(theme.content, `Values: ${label}</a>`);
  }
  assert(!theme.content.includes('Colours'));
  assertStringIncludes(
    pages[0].content,
    'src="/assets/design-system/thumbnails/studio-utility--light.webp"',
  );
  assertStringIncludes(pages[0].content, 'width="480"');
  const links = pages.flatMap((page) =>
    [...page.content.matchAll(/href="\/design-system\/guidelines\/#([^"]+)"/g)].map((match) =>
      match[1]
    )
  );
  const guide = pages.find((page) => page.url.endsWith('/guidelines/'))!;
  for (const anchor of links) assertStringIncludes(guide.content, `id="${anchor}"`);
  const missingAnchor = (source: string) =>
    md(source).replace(/id="3-compatibility-contract-must"/g, '');
  assertThrows(() => renderDesignPages(sources, missingAnchor), { message: /anchor/ });
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
  const pages = renderDesignPages(sources, md);
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
  for (const title of REQUIRED_GUIDELINE_H2S) {
    assertStringIncludes(guide.content, md(`## ${title}`).trim());
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
