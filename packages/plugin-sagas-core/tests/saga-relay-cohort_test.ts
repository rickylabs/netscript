import { runSagaProviderFixture } from './fixtures/transition-store/provider-fixture.ts';
Deno.test({
  name: 'real PostgreSQL saga commands consume the in-tree C5 relay and worker sink',
  ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET'),
  async fn() {
    await runSagaProviderFixture({
      repo: new URL('../../../', import.meta.url),
      source:
        'packages/plugin-sagas-core/tests/fixtures/transition-store/saga-relay-cohort.ts.template',
      filterEnv: 'SAGA_COHORT_TEST_FILTER',
      evidenceEnv: 'SAGA_COHORT_EVIDENCE',
    });
  },
});
