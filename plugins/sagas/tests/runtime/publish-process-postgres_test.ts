import { runSagaProviderFixture } from '../../../../packages/plugin-sagas-core/tests/fixtures/transition-store/provider-fixture.ts';

Deno.test({
  name: 'real HTTP saga process crash replay reversed delivery and stale PostgreSQL writer',
  ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET') && !Deno.env.get('SAGA_PROCESS_DATABASE_URL'),
  async fn() {
    await runSagaProviderFixture({
      repo: new URL('../../../../', import.meta.url),
      source: 'plugins/sagas/tests/runtime/fixtures/publish-process.ts.template',
      filterEnv: 'SAGA_PROCESS_TEST_FILTER',
      evidenceEnv: 'SAGA_PROCESS_EVIDENCE',
    });
  },
});
