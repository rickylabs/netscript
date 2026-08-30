import { assertEquals } from '@std/assert';
import { AUTH_API_DEFAULT_PORT as rootPort } from '../../mod.ts';
import { AUTH_API_DEFAULT_PORT as publicPort } from '../../src/public/mod.ts';

Deno.test('deprecated auth default-port compatibility export remains surface-only', async () => {
  assertEquals([rootPort, publicPort], [8094, 8094]);

  const output = await new Deno.Command('git', {
    args: ['grep', '-l', 'AUTH_API_DEFAULT_PORT', '--', 'plugins/auth'],
    cwd: new URL('../../../..', import.meta.url),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0);
  const references = new TextDecoder().decode(output.stdout).trim().split('\n')
    .filter((path) => path.endsWith('.ts'));
  assertEquals(references, [
    'plugins/auth/mod.ts',
    'plugins/auth/src/constants.ts',
    'plugins/auth/src/public/mod.ts',
    'plugins/auth/tests/public/deprecated-default-port_test.ts',
  ]);
});
