/** Native streams request log level forwarding and defaults. */
import { assertPluginRequestLogging } from './test_utils/request-logging-fixture.ts';

Deno.test('streams defaults HTTP records to debug and forwards each configured level', async () => {
  await assertPluginRequestLogging(
    'streams',
    `import { startStreamsService } from '@netscript/plugin-streams/service';`,
    ``,
    `startStreamsService({ ...options, auth: { public: true, reason: 'Logging fixture' }, serve: { hostname: '127.0.0.1', port: 0, handleSignals: false } })`,
    ``,
  );
});
