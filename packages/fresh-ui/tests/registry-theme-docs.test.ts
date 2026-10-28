import { assert, assertEquals } from '@std/assert';
import { FRESH_UI_REGISTRY_CONTENT, freshUiRegistryJson } from '../registry.ts';
import { buildRegistry, validateRegistry } from '../registry-v2.ts';
import { TOKEN_PRESETS } from '../src/tokens/domain/token-presets.ts';

Deno.test('every authored preset theme carries its canonical design and skill documents', async () => {
  validateRegistry(freshUiRegistryJson);
  const themes = freshUiRegistryJson.items.filter((item) =>
    item.type === 'registry:theme' && item.meta?.preset !== undefined
  );
  assertEquals(themes.length, TOKEN_PRESETS.length);
  const seed = freshUiRegistryJson.items.find((item) => item.name === 'theme-seed')!;
  const primary = themes.find((item) => item.name === 'theme-ns-one')!;
  assertEquals(
    seed.files?.filter((file) => file.target?.startsWith('.agents/skills/')),
    primary.files?.filter((file) => file.target?.startsWith('.agents/skills/')),
  );
  for (const preset of TOKEN_PRESETS) {
    const theme = themes.find((item) => item.name === `theme-${preset.id}`);
    assert(theme, preset.id);
    const language = preset.id === 'ns-one' ? 'studio' : preset.language;
    for (const name of ['DESIGN.md', 'SKILL.md']) {
      const source = `docs/design-system/themes/${language}/${name}`;
      const target = `.agents/skills/fresh-ui-theme-${preset.id}/${name}`;
      assert(theme.files?.some((file) => file.path === source && file.target === target));
      const canonical = await Deno.readTextFile(new URL(`../../../${source}`, import.meta.url));
      assertEquals(FRESH_UI_REGISTRY_CONTENT[`../../${source}`], canonical);
    }
  }
});

Deno.test('static theme items contain exact documentation bytes without a runtime source tree', async () => {
  const artifacts = await buildRegistry({
    registry: freshUiRegistryJson,
    readSource: (path) => {
      const key = path.startsWith('packages/fresh-ui/')
        ? path.slice('packages/fresh-ui/'.length)
        : `../../${path}`;
      const content = FRESH_UI_REGISTRY_CONTENT[key];
      if (content === undefined) throw new Error('Missing embedded registry source');
      return Promise.resolve(content);
    },
  });
  for (const name of [...TOKEN_PRESETS.map((preset) => `theme-${preset.id}`), 'theme-seed']) {
    const payload = artifacts[`${name}.json`];
    assert(payload);
    const item = JSON.parse(payload) as {
      files: Array<{ path: string; target: string; content: string }>;
    };
    const docs = item.files.filter((file) => file.target.startsWith('.agents/skills/'));
    assertEquals(docs.length, 2);
    for (const file of docs) {
      assertEquals(file.content, FRESH_UI_REGISTRY_CONTENT[`../../${file.path}`]);
      assert(file.content.length > 100);
    }
  }
});
