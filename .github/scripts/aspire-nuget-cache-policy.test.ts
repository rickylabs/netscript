import { assertEquals, assertStringIncludes } from '@std/assert';

const POLICY = {
  action: 'uses: actions/cache@v4',
  path: 'path: ~/.nuget/packages',
} as const;

Deno.test('every Aspire runtime workflow persists the exact pinned NuGet package train', async () => {
  for (
    const [path, expectedCaches, key] of [
      ['.github/workflows/e2e-cli.yml', 2, 'key: nuget-aspire-${{ runner.os }}-13.4.6-v1'],
      ['.github/workflows/e2e-cli-prod.yml', 2, 'key: nuget-aspire-${{ runner.os }}-13.4.6-v2'],
      [
        '.github/workflows/e2e-cli-prod-local.yml',
        1,
        'key: nuget-aspire-${{ runner.os }}-13.4.6-v1',
      ],
    ] as const
  ) {
    const source = await Deno.readTextFile(path);
    assertEquals(count(source, POLICY.action), expectedCaches, path);
    assertEquals(count(source, POLICY.path), expectedCaches, path);
    assertEquals(count(source, key), expectedCaches, path);
    assertStringIncludes(source, 'ASPIRE_CLI_VERSION:');
    assertStringIncludes(source, '13.4.6');
  }
});

Deno.test('production E2E seeds and verifies every exact Aspire integration package before runtime', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/e2e-cli-prod.yml');
  const project = await Deno.readTextFile('.github/aspire-cache/AspireSdkCache.csproj');
  for (
    const [name, version] of [
      ['Aspire.Hosting', '13.4.6'],
      ['Aspire.Hosting.PostgreSQL', '13.4.6'],
      ['Aspire.Hosting.Redis', '13.4.6'],
      ['Aspire.Hosting.Browsers', '13.4.6-preview.1.26319.6'],
      ['Aspire.Hosting.CodeGeneration.TypeScript', '13.4.6'],
    ] as const
  ) {
    assertStringIncludes(project, `Include="${name}" Version="${version}"`);
    assertStringIncludes(workflow, name.toLowerCase());
  }
  assertStringIncludes(workflow, 'needs: prepare-aspire-sdk-cache');
  assertStringIncludes(workflow, "steps.aspire-sdk-cache.outputs.cache-hit != 'true'");
  assertStringIncludes(workflow, 'Materialize pinned Aspire local package source');
  assertStringIncludes(workflow, 'timeout 5s aspire restore');
  assertStringIncludes(workflow, "-name '*.nupkg'");
  assertStringIncludes(workflow, '-name aspire-managed');
  assertStringIncludes(workflow, 'find "$HOME" -type f -name aspire-managed');
  assertStringIncludes(workflow, 'quickstart-only:');
});

Deno.test('published E2E artifacts retain Aspire CLI diagnostics', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/e2e-cli-prod.yml');
  assertStringIncludes(workflow, '~/.aspire/logs/cli_*.log');
});

function count(source: string, needle: string): number {
  return source.split(needle).length - 1;
}
