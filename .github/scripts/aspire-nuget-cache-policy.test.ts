import { assertEquals, assertStringIncludes } from '@std/assert';

const POLICY = {
  action: 'uses: actions/cache@v4',
  path: 'path: ~/.nuget/packages',
  key: 'key: nuget-aspire-${{ runner.os }}-13.5.3-v1',
  install: 'dotnet tool install Aspire.Cli --tool-path "$HOME/.aspire/bin" --version 13.5.3',
  preflight: '13.5.*',
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
    assertEquals(count(source, POLICY.install), expectedCaches, path);
    assertEquals(count(source, POLICY.preflight), expectedCaches, path);
  }
});

Deno.test('published E2E uses the stable tool install route and retains CLI diagnostics', async () => {
  const source = await Deno.readTextFile('.github/workflows/e2e-cli-prod.yml');
  assertStringIncludes(source, POLICY.install);
  assertEquals(source.includes('https://aspire.dev/install.sh'), false);
  assertStringIncludes(source, 'aspire doctor --non-interactive --nologo');
  assertStringIncludes(source, '~/.aspire/logs/cli_*.log');
});

function count(source: string, needle: string): number {
  return source.split(needle).length - 1;
}
