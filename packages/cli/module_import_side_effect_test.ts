import { assertEquals } from 'jsr:@std/assert@^1';

Deno.test('public module imports do not execute the CLI runner', async () => {
  const cli = await import('./mod.ts');
  const scaffolding = await import('./scaffolding.ts');
  const testing = await import('./testing.ts');

  assertEquals(typeof cli.createPublicCli, 'function');
  assertEquals(typeof scaffolding.planPluginScaffoldFiles, 'function');
  assertEquals(typeof testing.createInMemoryProcess, 'function');
});
