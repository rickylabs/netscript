import { assertEquals, assertStringIncludes } from '@std/assert';

const POLICY = {
  action: 'uses: actions/cache@v4',
  path: 'path: ~/.nuget/packages',
  key: 'key: nuget-aspire-${{ runner.os }}-13.4.6-v1',
} as const;

Deno.test('every Aspire runtime workflow persists the exact pinned NuGet package train', async () => {
  for (
    const [path, expectedCaches] of [
      ['.github/workflows/e2e-cli.yml', 2],
      ['.github/workflows/e2e-cli-prod.yml', 1],
      ['.github/workflows/e2e-cli-prod-local.yml', 1],
    ] as const
  ) {
    const source = await Deno.readTextFile(path);
    assertEquals(count(source, POLICY.action), expectedCaches, path);
    assertEquals(count(source, POLICY.path), expectedCaches, path);
    assertEquals(count(source, POLICY.key), expectedCaches, path);
    assertStringIncludes(source, 'ASPIRE_CLI_VERSION:');
    assertStringIncludes(source, '13.4.6');
  }
});

function count(source: string, needle: string): number {
  return source.split(needle).length - 1;
}
