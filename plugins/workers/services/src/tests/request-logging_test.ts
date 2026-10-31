/** Native workers request log level forwarding and defaults. */
import { assertPluginRequestLogging } from '../../../../streams/services/src/tests/test_utils/request-logging-fixture.ts';

Deno.test('workers defaults HTTP records to debug and forwards each configured level', async () => {
  await assertPluginRequestLogging(
    'workers',
    `import { closeKv, getRawKv } from '@netscript/kv';
import { startWorkersService } from '@netscript/plugin-workers/service';
import createWorkersService from '@netscript/plugin-workers/services';
import { startStreamsService } from '@netscript/plugin-streams/service';`,
    `await getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite', skipServiceDiscovery: true });
const dependency = await startStreamsService({
  auth: { public: true, reason: 'Logging test dependency' },
  serve: { hostname: '127.0.0.1', port: 0, handleSignals: false },
});
Deno.env.set('DURABLE_STREAMS_URL', 'http://127.0.0.1:' + dependency.addr.port);
const context = { env: { PORT: '0' }, db: { getClient: () => Promise.resolve({}) }, contracts: {}, kv: {}, logger: {} };
`,
    `startWorkersService(context, { ...options, auth: { public: true, reason: 'Logging fixture' }, serve: { hostname: '127.0.0.1', port: 0, handleSignals: false } })`,
    `await dependency.stop(); await closeKv();`,
  );
});

Deno.test('legacy workers defaults HTTP records to debug and forwards each configured level', async () => {
  await assertPluginRequestLogging(
    'workers',
    `import { closeKv, getRawKv } from '@netscript/kv';
import { startWorkersService } from '@netscript/plugin-workers/service';
import createWorkersService from '@netscript/plugin-workers/services';
import { startStreamsService } from '@netscript/plugin-streams/service';`,
    `await getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite', skipServiceDiscovery: true });
const dependency = await startStreamsService({
  auth: { public: true, reason: 'Logging test dependency' },
  serve: { hostname: '127.0.0.1', port: 0, handleSignals: false },
});
Deno.env.set('DURABLE_STREAMS_URL', 'http://127.0.0.1:' + dependency.addr.port);
const context = { env: { PORT: '0' }, db: { getClient: () => Promise.resolve({}) }, contracts: {}, kv: {}, logger: {} };
`,
    `createWorkersService(context, options)`,
    `await dependency.stop(); await closeKv();`,
  );
});
