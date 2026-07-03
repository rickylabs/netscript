import { assertEquals, assertExists } from 'jsr:@std/assert@^1';
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
