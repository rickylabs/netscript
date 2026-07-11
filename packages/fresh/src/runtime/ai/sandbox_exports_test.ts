import { assert, assertEquals } from '@std/assert';

Deno.test('sandbox subpath publishes only implemented exports', async () => {
  const sandbox = await import('./sandbox.ts');

  assertEquals(typeof sandbox.createMcpSandboxHandler, 'function');
  assert(!('createNetScriptMcpSandbox' in sandbox));
});
