/** Native sagas request log level forwarding and defaults. */
import { assertPluginRequestLogging } from '../../../streams/services/src/tests/test_utils/request-logging-fixture.ts';

Deno.test('sagas defaults HTTP records to debug and forwards each configured level', async () => {
  await assertPluginRequestLogging(
    'sagas',
    `import { closeKv } from '@netscript/kv';
import createSagasService from '@netscript/plugin-sagas/services';`,
    `Deno.env.set('NETSCRIPT_SAGA_KV_PATH', scratch + '/owned.sqlite');
const context = { env: { PORT: '0', NETSCRIPT_SAGA_STORE: 'kv', NETSCRIPT_SAGA_PROJECTION: 'kv' }, db: { getClient: () => Promise.reject(new Error('No DB needed')) }, kv: {}, contracts: {}, logger: {} };`,
    `createSagasService(context, options)`,
    `await closeKv();`,
  );
});
