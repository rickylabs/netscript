import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
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
