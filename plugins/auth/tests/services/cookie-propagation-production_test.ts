import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

Deno.test('Production auth HTTP preserves safe declared errors and masks unexpected errors', async () => {
  const parentEnv = {
    mode: Deno.env.get('NODE_ENV'),
    denoMode: Deno.env.get('DENO_ENV'),
    color: Deno.env.get('FORCE_COLOR'),
  };
  const result = await new Deno.Command(Deno.execPath(), {
    // Both environment names are explicit so a development setting in the caller
    // cannot bypass the production error policy.
    env: { NODE_ENV: 'production', DENO_ENV: 'production', NO_COLOR: '1', FORCE_COLOR: '0' },
    args: [
      'test',
      '--allow-all',
      '--unstable-kv',
      fromFileUrl(new URL('./cookie-propagation-http_test.ts', import.meta.url)),
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  assertEquals(result.code, 0, output);
  assertEquals(output.includes('10 passed | 0 failed'), true, output);
  assertEquals({
    mode: Deno.env.get('NODE_ENV'),
    denoMode: Deno.env.get('DENO_ENV'),
    color: Deno.env.get('FORCE_COLOR'),
  }, parentEnv);
});
