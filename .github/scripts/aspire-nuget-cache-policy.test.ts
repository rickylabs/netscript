import { assertEquals, assertStringIncludes } from '@std/assert';

const POLICY = {
  action: 'uses: actions/cache@v4',
  path: 'path: ~/.nuget/packages',
  key: 'key: nuget-aspire-${{ runner.os }}-13.4.6-v1',
} as const;

const FIXED_PUBLISHED_E2E_CLI = '13.5.0-preview.1.26404.10';

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

Deno.test('published E2E uses the fixed Aspire CLI and retains CLI diagnostics', async () => {
  const source = await Deno.readTextFile('.github/workflows/e2e-cli-prod.yml');
  assertStringIncludes(source, `ASPIRE_CLI_VERSION: '${FIXED_PUBLISHED_E2E_CLI}'`);
  assertStringIncludes(source, 'https://aspire.dev/install.sh');
  assertStringIncludes(source, 'aspire doctor --non-interactive --nologo');
  assertStringIncludes(source, '~/.aspire/logs/cli_*.log');
});

function count(source: string, needle: string): number {
  return source.split(needle).length - 1;
}
