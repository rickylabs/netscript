import { assertEquals } from '@std/assert';
import { TRIGGERS_API_DEFAULT_PORT as rootPort } from '../../mod.ts';
import { TRIGGERS_API_DEFAULT_PORT as aspirePort } from '../../src/aspire/mod.ts';
import { TRIGGERS_API_DEFAULT_PORT as publicPort } from '../../src/public/mod.ts';
import { TRIGGERS_API_DEFAULT_PORT as servicesPort } from '../../services/src/main.ts';

Deno.test('deprecated triggers default-port compatibility export remains surface-only', async () => {
  assertEquals([rootPort, publicPort, aspirePort, servicesPort], [8093, 8093, 8093, 8093]);

  const output = await new Deno.Command('git', {
    args: ['grep', '-l', 'TRIGGERS_API_DEFAULT_PORT', '--', 'plugins/triggers'],
    cwd: new URL('../../../..', import.meta.url),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0);
  const references = new TextDecoder().decode(output.stdout).trim().split('\n')
    .filter((path) => path.endsWith('.ts'));
  assertEquals(references, [
    'plugins/triggers/mod.ts',
    'plugins/triggers/services/src/main.ts',
    'plugins/triggers/src/aspire/mod.ts',
    'plugins/triggers/src/constants.ts',
    'plugins/triggers/src/public/mod.ts',
    'plugins/triggers/tests/public/deprecated-default-port_test.ts',
  ]);
});
