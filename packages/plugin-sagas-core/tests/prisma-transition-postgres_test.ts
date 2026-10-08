import { runSagaProviderFixture } from './fixtures/transition-store/provider-fixture.ts';
Deno.test({
  name: 'real PostgreSQL generated-client atomic saga transition conformance',
  ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET'),
  async fn() {
    await runSagaProviderFixture({
      repo: new URL('../../../', import.meta.url),
      source:
        'packages/plugin-sagas-core/tests/fixtures/transition-store/postgres-conformance.ts.template',
      filterEnv: 'SAGA_POSTGRES_TEST_FILTER',
      evidenceEnv: 'SAGA_POSTGRES_EVIDENCE',
    });
  },
});
