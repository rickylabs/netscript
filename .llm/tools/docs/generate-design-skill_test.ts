import { EmbeddedDocsCorpus } from '@netscript/mcp';
import { decodeAgentDocsPages, EMBEDDED_AGENT_DOCS_PAGES } from '@netscript/mcp/docs';
import { DESIGN_GUIDANCE } from '../../../packages/cli/src/kernel/assets/design-guidance.generated.ts';
import { assertEquals, assertFalse, assertRejects, assertStringIncludes } from '@std/assert';
import { toFileUrl } from '@std/path';
import { xref } from '../../../docs/site/_data/xref.ts';
import { buildDesignSkill, generateDesignSkill } from './generate-design-skill.ts';

async function fixture(): Promise<URL> {
  const root = toFileUrl(await Deno.makeTempDir() + '/');
  await Deno.mkdir(new URL('docs/design-system/themes/', root), { recursive: true });
  await Deno.writeTextFile(
    new URL('docs/design-system/GUIDELINES.md', root),
    `# Guidelines

## 1. Two rules that override everything
## 2. Theme architecture
### 2.4 Styles and token-only presets
## 3. Compatibility contract (MUST)
## 4. The quality method
### 4.5 Self-audit before anyone else looks
## 5. Anti-patterns
## 6. Theme catalogue

| Studio | Own |
| Tonal | Faithful |

## 7. Creating a new theme: step by step
## 8. Shipping (planned)
`,
  );
  for (const id of ['tonal', 'studio', '_template', '_draft']) {
    await Deno.mkdir(new URL(`docs/design-system/themes/${id}/`, root));
    for (const file of ['DESIGN.md', 'SKILL.md']) {
      await Deno.writeTextFile(
        new URL(`docs/design-system/themes/${id}/${file}`, root),
        `# ${id}\n`,
      );
    }
  }
  await Deno.mkdir(new URL('docs/design-system/token-presets/macos-27/', root), {
    recursive: true,
  });
  for (const file of ['DESIGN.md', 'SKILL.md']) {
    await Deno.writeTextFile(
      new URL(`docs/design-system/token-presets/macos-27/${file}`, root),
      `# macos-27 ${file}\n`,
    );
  }
  await Deno.mkdir(new URL('packages/fresh-ui/', root), { recursive: true });
  await Deno.writeTextFile(
    new URL('packages/fresh-ui/registry.json', root),
    JSON.stringify({
      items: [
        ...['studio-utility', 'studio-cloud', 'tonal', 'macos-27'].map((id) => ({
          name: `theme-${id}`,
          type: 'registry:theme',
          meta: { preset: { id } },
          files: ['DESIGN.md', 'SKILL.md'].map((file) => ({
            path: id === 'macos-27'
              ? `docs/design-system/token-presets/${id}/${file}`
              : `docs/design-system/themes/${id.startsWith('studio-') ? 'studio' : id}/${file}`,
            target: `.agents/skills/fresh-ui-theme-${id}/${file}`,
          })),
        })),
        { name: 'theme-seed', type: 'registry:theme' },
        { name: 'button', type: 'registry:ui' },
      ],
    }),
  );
  for (
    const path of [
      'web-layer/how-to/theme-your-app.md',
      'web-layer/how-to/customize-fresh-ui.md',
      'design-system/index.page.ts',
    ]
  ) {
    const url = new URL(`docs/site/${path}`, root);
    await Deno.mkdir(new URL('./', url), { recursive: true });
    await Deno.writeTextFile(url, '# Fixture doc\n');
  }
  return root;
}

Deno.test('design skill derives complete pairs in canonical catalogue order and preserves source', async () => {
  const root = await fixture();
  try {
    const build = await generateDesignSkill(root);
    assertEquals(build.themeIds, ['studio', 'tonal']);
    const skill = build.files['skills/netscript-design/SKILL.md'];
    for (const id of build.themeIds) {
      for (const file of ['DESIGN.md', 'SKILL.md']) {
        assertStringIncludes(
          skill,
          `https://raw.githubusercontent.com/rickylabs/netscript/{{NETSCRIPT_RELEASE_REF}}/docs/design-system/themes/${id}/${file}`,
        );
      }
    }
    assertEquals(
      build.files['skills/netscript-design/references/GUIDELINES.md'],
      await Deno.readTextFile(new URL('docs/design-system/GUIDELINES.md', root)),
    );
    await generateDesignSkill(root, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('current preset links follow registry targets without copying per-theme content', async () => {
  const root = await fixture();
  try {
    const build = await generateDesignSkill(root);
    const skill = build.files['skills/netscript-design/SKILL.md'];
    assertEquals(build.presetIds, ['studio-utility', 'studio-cloud', 'tonal', 'macos-27']);
    assertEquals(Object.keys(build.files).length, 3);
    for (const id of build.presetIds) {
      for (const file of ['DESIGN.md', 'SKILL.md']) {
        assertStringIncludes(skill, `\`.agents/skills/fresh-ui-theme-${id}/${file}\``);
      }
    }
    assertStringIncludes(skill, 'token-presets/macos-27/DESIGN.md');
    assertStringIncludes(skill, 'themes/studio/SKILL.md');
    assertFalse(skill.includes('# macos-27 DESIGN.md'));
    assertFalse(skill.includes('fresh-ui-theme-seed/'));
    assertFalse(skill.includes('](../fresh-ui-theme-'));
    assertStringIncludes(skill, 'select `apps/<app>/`');
    assertStringIncludes(skill, 'In a standalone Fresh app, resolve them from its root');
    assertStringIncludes(skill, '**Studio Utility** (`studio-utility`)');
    assertStringIncludes(skill, 'netscript ui:apply --preset <preset-id>');
    assertStringIncludes(skill, 'web-layer/how-to/theme-your-app.md');
    assertStringIncludes(skill, 'provisional/planned implementation notes');
    assertFalse(skill.includes('Installing these pairs is registry-v2 work'));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('registry link drift fails read-only and missing preset documentation fails closed', async () => {
  const root = await fixture();
  try {
    const before = await generateDesignSkill(root);
    const path = new URL('packages/fresh-ui/registry.json', root);
    await Deno.writeTextFile(
      path,
      (await Deno.readTextFile(path)).replaceAll('studio-cloud', 'studio-workshop'),
    );
    await assertRejects(() => generateDesignSkill(root, true), Error, 'is stale');
    for (const [path, content] of Object.entries(before.files)) {
      assertEquals(await Deno.readTextFile(new URL(path, root)), content);
    }
    await Deno.remove(new URL('docs/design-system/token-presets/macos-27/SKILL.md', root));
    await assertRejects(() => buildDesignSkill(root), Deno.errors.NotFound);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('canonical guideline drift fails read-only without repairing either output', async () => {
  const root = await fixture();
  try {
    const before = await generateDesignSkill(root);
    const source = new URL('docs/design-system/GUIDELINES.md', root);
    await Deno.writeTextFile(
      source,
      await Deno.readTextFile(source) + '\nNew compatibility rule.\n',
    );
    await assertRejects(() => generateDesignSkill(root, true), Error, 'is stale');
    for (const [path, content] of Object.entries(before.files)) {
      assertEquals(await Deno.readTextFile(new URL(path, root)), content);
    }
    const after = await generateDesignSkill(root);
    assertEquals(before.guidelinesSha256 === after.guidelinesSha256, false);
    await generateDesignSkill(root, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('missing procedures and changed generated bodies fail instead of dropping themes', async () => {
  const root = await fixture();
  try {
    await generateDesignSkill(root);
    const skill = new URL('skills/netscript-design/SKILL.md', root);
    await Deno.writeTextFile(skill, 'Unreviewed replacement.\n');
    await assertRejects(() => generateDesignSkill(root, true), Error, 'is stale');
    assertEquals(await Deno.readTextFile(skill), 'Unreviewed replacement.\n');
    await Deno.remove(new URL('docs/design-system/themes/tonal/SKILL.md', root));
    await assertRejects(() => buildDesignSkill(root), Deno.errors.NotFound);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('guidance count tracks complete themes rather than a handwritten eleven', async () => {
  const root = await fixture();
  try {
    const build = await buildDesignSkill(root);
    assertStringIncludes(build.files['skills/netscript-design/SKILL.md'], 'The 2 complete');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('section renumbering updates guidance and makes every output check fail read-only', async () => {
  const root = await fixture();
  try {
    const before = await generateDesignSkill(root);
    const path = new URL('docs/design-system/GUIDELINES.md', root);
    await Deno.writeTextFile(
      path,
      (await Deno.readTextFile(path))
        .replace('## 6. Theme catalogue', '## 12. Theme catalogue')
        .replace('### 2.4 Styles and token-only presets', '### 3.7 Styles and token-only presets'),
    );
    await assertRejects(() => generateDesignSkill(root, true), Error, 'is stale');
    for (const [path, content] of Object.entries(before.files)) {
      assertEquals(await Deno.readTextFile(new URL(path, root)), content);
    }
    const skill = (await buildDesignSkill(root)).files['skills/netscript-design/SKILL.md'];
    assertStringIncludes(skill, '§12 (theme catalogue) and §3.7 (preset design constraints)');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('missing or duplicate semantic headings and reserved source tokens fail closed', async () => {
  const root = await fixture();
  try {
    const path = new URL('docs/design-system/GUIDELINES.md', root);
    const source = await Deno.readTextFile(path);
    for (
      const changed of [
        source.replace('Styles and token-only presets', 'Unreviewed new heading'),
        source + '\n## 13. Theme catalogue\n',
      ]
    ) {
      await Deno.writeTextFile(path, changed);
      await assertRejects(() => buildDesignSkill(root), Error, 'needs exactly one heading');
    }
    await Deno.writeTextFile(path, source + '\n{{NETSCRIPT_RELEASE_REF}}\n');
    await assertRejects(() => buildDesignSkill(root), Error, 'reserved release-ref token');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('manifest route relocation updates source links and metadata while drift check never repairs', async () => {
  const root = await fixture();
  try {
    const before = await generateDesignSkill(root);
    const manifest = {
      ...xref,
      'howto:theme-your-app': { href: '/guides/theme-basics/', label: 'Theme' },
    };
    const source = new URL('docs/site/guides/theme-basics/index.md', root);
    await Deno.mkdir(new URL('./', source), { recursive: true });
    await Deno.writeTextFile(source, '# Theme\n');
    await assertRejects(() => generateDesignSkill(root, true, manifest), Error, 'is stale');
    for (const [path, content] of Object.entries(before.files)) {
      assertEquals(await Deno.readTextFile(new URL(path, root)), content);
    }
    const after = await generateDesignSkill(root, false, manifest);
    assertStringIncludes(
      after.files['skills/netscript-design/SKILL.md'],
      '/docs/site/guides/theme-basics/index.md',
    );
    const metadataPath = 'packages/cli/src/kernel/assets/design-guidance.generated.ts';
    assertStringIncludes(after.files[metadataPath], "themeGuideSlug: 'guides/theme-basics'");
    await generateDesignSkill(root, true, manifest);
    await Deno.writeTextFile(new URL(metadataPath, root), before.files[metadataPath]);
    await assertRejects(
      () => generateDesignSkill(root, true, manifest),
      Error,
      `${metadataPath} is stale`,
    );
    assertEquals(await Deno.readTextFile(new URL(metadataPath, root)), before.files[metadataPath]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('missing and ambiguous manifest source targets fail instead of shipping dead routes', async () => {
  const root = await fixture();
  try {
    const source = new URL('docs/site/web-layer/how-to/theme-your-app.md', root);
    await Deno.remove(source);
    await assertRejects(() => buildDesignSkill(root), Error, 'found 0');
    await Deno.writeTextFile(source, '# Theme\n');
    const duplicate = new URL('docs/site/web-layer/how-to/theme-your-app/index.md', root);
    await Deno.mkdir(new URL('./', duplicate), { recursive: true });
    await Deno.writeTextFile(duplicate, '# Duplicate\n');
    await assertRejects(() => buildDesignSkill(root), Error, 'found 2');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

function docsImports(file: URL, source: string, root: URL): string[] {
  const docs = new URL('docs/site/', root).href;
  return [...source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)]
    .map((match) => match[1])
    .filter((specifier) => new URL(specifier, file).href.startsWith(docs));
}

Deno.test('CLI runtime cannot import docs-site implementation; negative controls detect all import forms', async () => {
  const root = new URL('../../../', import.meta.url);
  const file = new URL('packages/cli/src/bad.ts', root);
  for (
    const source of [
      "import { xref } from '../../../docs/site/_data/xref.ts';",
      "export { xref } from '../../../docs/site/_data/xref.ts';",
      "await import('../../../docs/site/_data/xref.ts');",
      "import '../../../docs/site/_data/xref.ts';",
    ]
  ) {
    assertEquals(docsImports(file, source, root), ['../../../docs/site/_data/xref.ts']);
  }
  const violations: string[] = [];
  for await (const file of cliSources(new URL('packages/cli/src/', root))) {
    const imports = docsImports(file, await Deno.readTextFile(file), root);
    violations.push(...imports.map((specifier) => `${file.pathname}: ${specifier}`));
  }
  assertEquals(violations, []);
});

async function* cliSources(root: URL): AsyncGenerator<URL> {
  for await (const entry of Deno.readDir(root)) {
    const path = new URL(entry.name + (entry.isDirectory ? '/' : ''), root);
    if (entry.isDirectory) yield* cliSources(path);
    else if (entry.isFile && /\.tsx?$/.test(entry.name)) yield path;
  }
}

Deno.test('manifest-derived guidance slugs resolve through the real shipped MCP corpus', async () => {
  const slugs = [
    DESIGN_GUIDANCE.themeGuideSlug,
    DESIGN_GUIDANCE.customizeGuideSlug,
    DESIGN_GUIDANCE.gallerySlug,
  ];
  const pages = await decodeAgentDocsPages(
    EMBEDDED_AGENT_DOCS_PAGES.filter(([path]) =>
      slugs.some((slug) => path === `pages/${slug}/index.md`)
    ),
  );
  const corpus = new EmbeddedDocsCorpus({
    documents: Object.entries(pages).map(([path, source]) => ({
      slug: path.slice('pages/'.length, -'.md'.length),
      source,
    })),
  });
  for (const slug of slugs) {
    assertEquals(Boolean(await corpus.get(slug)), true, `Missing shipped guidance: ${slug}`);
  }
  assertEquals(await corpus.get('missing-guidance-negative-control'), undefined);
});
