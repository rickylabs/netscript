import { assertEquals } from '@std/assert';
import legacyBaseline from './registry/legacy-v1.json' with { type: 'json' };
import { freshUiRegistryManifest } from '../registry.manifest.ts';
import { generatedThemes } from '../registry.theme-items.generated.ts';
import { TOKEN_PRESETS } from '../src/tokens/domain/token-presets.ts';
import { PREVIEW_TOKEN_FILES } from '../src/tokens/domain/token-output.ts';
import { FRESH_UI_PACKAGE_VERSION } from '../src/package-metadata.generated.ts';

Deno.test('JSON authoring preserves legacy contracts plus the reviewed syntax dependency', () => {
  const legacyNames = new Set(Object.keys(legacyBaseline));
  const previewSources = new Set(legacyBaseline['theme-previews'].files.map((file) => file.source));
  const actual = Object.fromEntries(
    freshUiRegistryManifest.items.filter((item) => legacyNames.has(item.name)).map((
      item,
    ) => [item.name, {
      name: item.name,
      kind: item.kind,
      files: item.name === 'theme-previews'
        ? item.files.filter((file) => previewSources.has(file.source))
        : item.files,
      ...(item.dependencies ? { dependencies: item.dependencies } : {}),
      ...(item.registryDependencies ? { registryDependencies: item.registryDependencies } : {}),
      ...(item.css ? { css: item.css } : {}),
      tags: item.tags,
    }]),
  );
  // S6a adds syntax rendering; retain the historical fixture and declare only this reviewed delta.
  const expected = {
    ...legacyBaseline,
    'code-block': { ...legacyBaseline['code-block'], dependencies: ['npm:highlight.js@11.11.1'] },
  };
  assertEquals<unknown>(actual, expected);
  assertEquals(
    freshUiRegistryManifest.items.filter((item) => !legacyNames.has(item.name)).map((item) =>
      item.name
    ).sort(),
    TOKEN_PRESETS.map((preset) => `theme-${preset.id}`).filter((name) => !legacyNames.has(name))
      .sort(),
  );
});

Deno.test('authored themes match the token generator including files and preset metadata', () => {
  const authored = freshUiRegistryManifest.items.filter((item) =>
    generatedThemes.some((theme) => theme.name === item.name)
  );
  assertEquals(authored.length, generatedThemes.length);
  for (const theme of generatedThemes) {
    const item = authored.find((item) => item.name === theme.name)!;
    assertEquals(item.files, theme.files);
    assertEquals(item.registryDependencies, theme.registryDependencies);
    assertEquals(item.tags, theme.tags);
    assertEquals(item.css, theme.css);
    assertEquals(item.meta?.preset, theme.meta?.preset);
  }
});

Deno.test('authored theme previews track the token engine output list', () => {
  const previews = freshUiRegistryManifest.items.find((item) => item.name === 'theme-previews')!;
  assertEquals(
    previews.files,
    PREVIEW_TOKEN_FILES.map((file) => ({
      source: `registry/theme/${file}`,
      target: `static/${file}`,
    })),
  );
});

Deno.test('every internal dependency in authored registry tracks the package release version', () => {
  for (const item of freshUiRegistryManifest.items) {
    for (const dependency of item.dependencies ?? []) {
      if (!dependency.startsWith('jsr:@netscript/')) continue;
      assertEquals(dependency.split('@')[2].split('/')[0], FRESH_UI_PACKAGE_VERSION, item.name);
    }
  }
});
