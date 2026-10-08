import { runSagaProviderFixture } from './fixtures/transition-store/provider-fixture.ts';
// Reviewed predecessor source cohort: production code is archived, never copied or stacked into this leaf.
const C5_READY_PIN = '1a93a6acb127f58cb5bb622223180ca5e5e9925e';
Deno.test({
  name: 'real PostgreSQL saga commands consume the pinned C5 relay cohort',
  ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET'),
  async fn() {
    await runSagaProviderFixture({
      repo: new URL('../../../', import.meta.url),
      source:
        'packages/plugin-sagas-core/tests/fixtures/transition-store/saga-relay-cohort.ts.template',
      filterEnv: 'SAGA_COHORT_TEST_FILTER',
      evidenceEnv: 'SAGA_COHORT_EVIDENCE',
      cohort: C5_READY_PIN,
    });
  },
});
