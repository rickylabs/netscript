import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';

interface AspireFixtureExpectation {
  readonly path: string;
  readonly requiresBannerToleranceTest?: boolean;
}

const ASPIRE_17_FIXTURES: readonly AspireFixtureExpectation[] = [
  { path: '.llm/tools/maint/teardown/probes_test.ts' },
  {
    path:
      'packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts',
    requiresBannerToleranceTest: true,
  },
  {
    path: 'packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts',
    requiresBannerToleranceTest: true,
  },
  {
    path: 'packages/mcp/tests/service-endpoint-source-fixtures.ts',
    requiresBannerToleranceTest: true,
  },
  { path: 'packages/mcp/tests/telemetry-live-fixture_test.ts' },
];

const REPOSITORY_ROOT = new URL('../../../', import.meta.url);
const RETIRED_VERSIONS = ['13.4.6', '13.5.3'] as const;

Deno.test('every Aspire fixture row targets 17.0.0 with zero retired 13.x literals and preserves generic banner tests', async () => {
  const failures: string[] = [];

  for (const expectation of ASPIRE_17_FIXTURES) {
    const source = await Deno.readTextFile(new URL(expectation.path, REPOSITORY_ROOT));
    assertStringIncludes(source, '17.0.0', `${expectation.path} is missing its 17.0.0 case`);
    for (const retired of RETIRED_VERSIONS) {
      assertFalse(
        source.includes(retired),
        `${expectation.path} retained retired Aspire ${retired} literal`,
      );
    }
    if (expectation.requiresBannerToleranceTest) {
      const hasBannerTest = /banner|Aspire CLI 17\.0\.0|Scanning for running AppHosts/i.test(
        source,
      );
      if (!hasBannerTest) {
        failures.push(`${expectation.path}: lost generic leading-banner parser coverage`);
      }
    }
  }

  assertEquals(failures, []);
});
