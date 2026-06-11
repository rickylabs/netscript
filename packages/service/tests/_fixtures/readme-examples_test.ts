import { assert, assertStringIncludes } from '@std/assert';

const readme = await Deno.readTextFile(new URL('../../README.md', import.meta.url));

Deno.test('README examples use current service lifecycle APIs', () => {
  assertStringIncludes(readme, 'const service = await defineService');
  assertStringIncludes(readme, 'const running = await createService');
  assertStringIncludes(readme, 'await service.stop();');
  assertStringIncludes(readme, 'await running.stop();');
});

Deno.test('README examples avoid removed builder check names', () => {
  assert(!readme.includes('addHealthCheck'));
  assert(!readme.includes('addReadinessCheck'));
});
