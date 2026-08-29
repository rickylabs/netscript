import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

const freshRoot = fromFileUrl(new URL('../', import.meta.url));
const queryCoreVersions: readonly string[] = ['5.101.0', '5.102.8'];

for (const version of queryCoreVersions) {
  Deno.test(`query hydration type-checks against query-core ${version}`, async () => {
    const fixtureConfig = fromFileUrl(
      new URL(`./type-fixtures/query-hydration-${version}-deno.json`, import.meta.url),
    );
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
}
