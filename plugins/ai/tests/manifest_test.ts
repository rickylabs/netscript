import { assertEquals, assertExists } from 'jsr:@std/assert@^1';
import { parsePluginManifest } from '@netscript/plugin';
import { AI_PLUGIN_ID, aiPlugin } from '../mod.ts';

Deno.test('ai manifest identity', () => {
  assertEquals(aiPlugin.name, AI_PLUGIN_ID);
  assertEquals(aiPlugin.name, '@netscript/plugin-ai');
});

Deno.test('ai manifest declares the ai runtime-config topic', () => {
  const topics = aiPlugin.contributions.runtimeConfigTopics ?? [];
  const names = topics.map((topic) => topic.name);
  assertEquals(names.includes('ai'), true);
});

Deno.test('ai manifest declares a v1 contract version', () => {
  const versions = aiPlugin.contributions.contractVersions ?? [];
  const v1 = versions.find((version) => version.version === 'v1');
  assertExists(v1);
  assertEquals(v1.loader, './contracts/v1/mod.ts');
});

Deno.test('ai manifest is a thin utility with no bundled service', () => {
  assertEquals(aiPlugin.type, 'utility');
  // Thin plugin: contributes no runtime service or background processor.
  assertEquals(aiPlugin.contributions.services ?? [], []);
  assertEquals(aiPlugin.contributions.backgroundProcessors ?? [], []);
});

Deno.test('ai package and scaffold manifest declare no service surface', async () => {
  const packageConfig: unknown = JSON.parse(
    await Deno.readTextFile(new URL('../deno.json', import.meta.url)),
  );
  const exports = packageConfig && typeof packageConfig === 'object'
    ? Reflect.get(packageConfig, 'exports')
    : undefined;
  assertExists(exports);
  assertEquals(typeof exports === 'object' && exports !== null && './services' in exports, false);

  const manifestJson: unknown = JSON.parse(
    await Deno.readTextFile(new URL('../scaffold.plugin.json', import.meta.url)),
  );
  const parsed = parsePluginManifest(manifestJson);
  if (!parsed.ok) {
    throw new Error(parsed.error.message);
  }

  assertExists(parsed.manifest.provider);
  assertEquals(parsed.manifest.provider.defaultServiceEntrypoint, undefined);
  assertEquals(parsed.manifest.officialSource?.serviceEntrypoint, undefined);
  assertEquals(parsed.manifest.officialSource?.serviceConfigKey, undefined);
  assertEquals(parsed.manifest.officialSource?.servicePort, undefined);
  assertEquals(parsed.manifest.officialSource?.backgroundPort, 8095);
});
