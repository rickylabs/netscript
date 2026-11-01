import { assertEquals, assertFalse, assertRejects, assertStringIncludes } from '@std/assert';
import { toFileUrl } from '@std/path';
import { buildDesignSkill, generateDesignSkill } from './generate-design-skill.ts';

async function fixture(): Promise<URL> {
  const root = toFileUrl(await Deno.makeTempDir() + '/');
  await Deno.mkdir(new URL('docs/design-system/themes/', root), { recursive: true });
  await Deno.writeTextFile(
    new URL('docs/design-system/GUIDELINES.md', root),
    '# Guidelines\n\n## 6. Theme catalogue\n\n| Studio | Own |\n| Tonal | Faithful |\n',
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
          `https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/${id}/${file}`,
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
    assertEquals(Object.keys(build.files).length, 2);
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
    assertStringIncludes(skill, 'web-layer/how-to/theme-your-app/');
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
