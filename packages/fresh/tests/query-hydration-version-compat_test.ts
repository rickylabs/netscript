import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

const freshRoot = fromFileUrl(new URL('../', import.meta.url));
const fixtureConfig = fromFileUrl(
  new URL('./type-fixtures/query-hydration-5.102-deno.json', import.meta.url),
);

Deno.test('query hydration type-checks against query-core 5.102.8', async () => {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'check',
      '--unstable-kv',
      '--no-lock',
      '--config',
      fixtureConfig,
      'src/application/query/hydration.ts',
    ],
    cwd: freshRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const diagnostics = [output.stdout, output.stderr]
    .map((bytes) => new TextDecoder().decode(bytes))
    .join('\n')
    .trim();

  assertEquals(output.code, 0, diagnostics);
});
