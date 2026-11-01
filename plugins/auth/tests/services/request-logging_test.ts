/** Native auth request log level forwarding and defaults. */
import { assertPluginRequestLogging } from '../../../streams/services/src/tests/test_utils/request-logging-fixture.ts';

Deno.test('auth defaults HTTP records to debug and forwards each configured level', async () => {
  await assertPluginRequestLogging(
    'auth',
    `import { MemoryKvAdapter } from '@netscript/kv';
import createAuthService from '@netscript/plugin-auth/services';`,
    `const kv = new MemoryKvAdapter();
const context = { env: { PORT: '0', NETSCRIPT_AUTH_BACKEND: 'kv-oauth', NETSCRIPT_AUTH_KV_OAUTH_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=' }, db: { getClient: () => Promise.resolve({}) }, kv, contracts: {}, logger: {} };`,
    `createAuthService(context, options)`,
    `await kv.close();`,
  );
});
