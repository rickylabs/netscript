import { assertEquals, assertThrows } from '@std/assert';
import { POST_V1_COMPONENTS, POST_V1_SUPPORT } from './registry/post-v1-items.ts';
import legacyBaseline from './registry/legacy-v1.json' with { type: 'json' };
import { freshUiRegistryManifest } from '../registry.manifest.ts';
import { generatedThemes } from '../registry.theme-items.generated.ts';
import { TOKEN_PRESETS } from '../src/tokens/domain/token-presets.ts';
import { PREVIEW_TOKEN_FILES } from '../src/tokens/domain/token-output.ts';
import { FRESH_UI_PACKAGE_VERSION } from '../src/package-metadata.generated.ts';

/** Existing entries remain byte-for-byte contracts; new identities need an explicit review list. */
function assertLegacyCompatibility(actual: Readonly<Record<string, unknown>>): void {
  const baselineNames = new Set(Object.keys(legacyBaseline));
  const existing = Object.fromEntries(
    Object.entries(actual).filter(([name]) => baselineNames.has(name)),
  );
  // Historical fixture versions are independent of releases; compare their first-party pins today.
  // S6a adds syntax rendering; retain the historical fixture and declare only this reviewed delta.
  const expected = {
    ...Object.fromEntries(
      Object.entries(legacyBaseline).map(([name, item]) => [name, {
        ...item,
        ...('dependencies' in item
          ? {
            dependencies: item.dependencies.map((dependency) =>
              dependency.startsWith('jsr:@netscript/')
                ? dependency.replace('@0.0.0-fixture', `@${FRESH_UI_PACKAGE_VERSION}`)
                : dependency
            ),
          }
          : {}),
      }]),
    ),
    'code-block': { ...legacyBaseline['code-block'], dependencies: ['npm:highlight.js@^11'] },
  };
  assertEquals<unknown>(existing, expected);
  const additions = Object.keys(actual).filter((name) => !baselineNames.has(name)).sort();
  const themes = TOKEN_PRESETS.map((preset) => `theme-${preset.id}`).filter((name) => !baselineNames.has(name));
  assertEquals(additions, [...themes, ...POST_V1_COMPONENTS, ...POST_V1_SUPPORT].sort());
}

Deno.test('JSON authoring preserves every legacy file target, dependency, CSS contribution and tag', () => {
  const previewSources = new Set(legacyBaseline['theme-previews'].files.map((file) => file.source));
  const actual = Object.fromEntries(freshUiRegistryManifest.items.map((item) => [item.name, {
    name: item.name,
    kind: item.kind,
    files: item.name === 'theme-previews' ? item.files.filter((file) => previewSources.has(file.source)) : item.files,
    ...(item.dependencies ? { dependencies: item.dependencies } : {}),
    ...(item.registryDependencies ? { registryDependencies: item.registryDependencies } : {}),
    ...(item.css ? { css: item.css } : {}),
    tags: item.tags,
  }]));
  assertLegacyCompatibility(actual);
  const { button: _button, ...missing } = actual;
  assertEquals(_button.name, 'button');
  assertThrows(() => assertLegacyCompatibility(missing));
  assertThrows(() =>
    assertLegacyCompatibility({ ...actual, button: { ...actual.button, files: [] } })
  );
  assertThrows(() => assertLegacyCompatibility({ ...actual, 'unexpected-post-v1': actual.button }));
  const { toggle: _toggle, ...missingAddition } = actual;
  assertEquals(_toggle.name, 'toggle');
  assertThrows(() => assertLegacyCompatibility(missingAddition));
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

Deno.test('CodeBlock and Markdown share one highlight.js dependency range', () => {
  const dependency = (name: string) =>
    freshUiRegistryManifest.items.find((item) => item.name === name)
      ?.dependencies?.filter((value) => value.startsWith('npm:highlight.js@'));
  assertEquals(dependency('code-block'), ['npm:highlight.js@^11']);
  assertEquals(dependency('markdown'), dependency('code-block'));
});
