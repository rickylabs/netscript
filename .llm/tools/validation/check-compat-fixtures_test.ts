import { assertEquals, assertStringIncludes } from '@std/assert';

type CompatFixtureState = 'required' | 'pending-lease';

interface CompatFixtureExpectation {
  readonly path: string;
  readonly state: CompatFixtureState;
}

// D-13's complete compat-fixture row set from aspire-surface-manifest.tsv. The telemetry row is
// `required`: the 13.5.3 dashboard envelopes were captured under the phase-B runtime lease (S3
// attempt 3, 2026-08-30; see packages/mcp/tests/fixtures/telemetry/README.md).
const COMPAT_FIXTURES: readonly CompatFixtureExpectation[] = [
  {
    path: '.llm/tools/agentic/teardown/probes_test.ts',
    state: 'required',
  },
  {
    path:
      'packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts',
    state: 'required',
  },
  {
    path: 'packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts',
    state: 'required',
  },
  {
    path: 'packages/mcp/tests/service-endpoint-source-fixtures.ts',
    state: 'required',
  },
  {
    path: 'packages/mcp/tests/telemetry-live-fixture_test.ts',
    state: 'required',
  },
];

const REPOSITORY_ROOT = new URL('../../../', import.meta.url);

Deno.test('every compat-fixture row keeps 13.4.6 and carries its phase-appropriate 13.5.3 case', async () => {
  const failures: string[] = [];

  for (const expectation of COMPAT_FIXTURES) {
    const source = await Deno.readTextFile(new URL(expectation.path, REPOSITORY_ROOT));
    assertStringIncludes(source, '13.4.6', `${expectation.path} lost its compatibility case`);

    const hasAspire1353Case = source.includes('13.5.3');
    if (expectation.state === 'required' && !hasAspire1353Case) {
      failures.push(`${expectation.path}: missing required 13.5.3 case`);
    }
    if (expectation.state === 'pending-lease' && hasAspire1353Case) {
      failures.push(
        `${expectation.path}: phase-B fixture landed; change pending-lease to required`,
      );
    }
  }

  assertEquals(failures, []);
});
