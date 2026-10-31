import { runSagaProviderFixture } from '../../../../packages/plugin-sagas-core/tests/fixtures/transition-store/provider-fixture.ts';

Deno.test({
  name:
    'issue 2390: real Prisma projected atomic saga worker relay and stream receipt across restarts',
  ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET'),
  async fn() {
    await runSagaProviderFixture({
      repo: new URL('../../../../', import.meta.url),
      source: 'plugins/sagas/tests/runtime/fixtures/projected-receipt-postgres.ts.template',
      filterEnv: 'PROJECTED_RECEIPT_TEST_FILTER',
      evidenceEnv: 'PROJECTED_RECEIPT_EVIDENCE',
    });
  },
});
