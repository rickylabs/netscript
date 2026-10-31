import { assertEquals, assertStringIncludes } from '@std/assert';
import { fileURLToPath } from 'node:url';

const PACKAGE = new URL('../../', import.meta.url);

Deno.test('the real token-quality command goes red for every required negative control', async () => {
  const controls = [
    ['unknown-name', 'Unknown exported token name'],
    ['raw-semantic', 'Semantic token must be an alias'],
    ['contrast', 'negative-control/bg-on-bg'],
    ['exempt-active', 'Invalid inactive text contrast exemption'],
  ];
  for (const [control, message] of controls) {
    const output = await new Deno.Command(Deno.execPath(), {
      cwd: fileURLToPath(PACKAGE),
      args: [
        'run',
        '--config',
        'deno.json',
        '--lock=deno.lock',
        '--frozen',
        '--allow-read=.',
        '--allow-env',
        '--allow-net=registry.npmjs.org',
        'scripts/check-tokens.ts',
        `--negative-control=${control}`,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 1, `${control} must fail`);
    assertStringIncludes(new TextDecoder().decode(output.stderr), message);
  }
});
