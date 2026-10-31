/** Native triggers request log level forwarding and defaults. */
import { assertPluginRequestLogging } from '../../../streams/services/src/tests/test_utils/request-logging-fixture.ts';

Deno.test('triggers defaults HTTP records to debug and forwards each configured level', async () => {
  await assertPluginRequestLogging(
    'triggers-api',
    `import { MemoryKvAdapter } from '@netscript/kv';
import { createTriggersService, createTriggersServiceContext } from '@netscript/plugin-triggers/services';`,
    `const kv = new MemoryKvAdapter();
const context = await createTriggersServiceContext({ definitions: [], kv });`,
    `createTriggersService(context, { port: 0, ...options }).serve({ hostname: '127.0.0.1', port: 0, handleSignals: false })`,
    `await kv.close();`,
  );
});

Deno.test('triggers startup forwards configured levels through the builder', async () => {
  await assertPluginRequestLogging(
    'triggers-api',
    `import { MemoryKvAdapter } from '@netscript/kv';
import { startTriggersService } from '@netscript/plugin-triggers/services';`,
    `const kv = new MemoryKvAdapter();
async function start(options: { requestLevel?: 'debug' | 'info'; responseLevel?: 'debug' | 'info' }) {
  const port = allocatedPorts.shift();
  if (port === undefined) throw new Error('Missing owned listener port');
  await startTriggersService({ ...options, port, kv, definitions: [] });
  // This legacy entrypoint returns no handle. All five owned listeners are bounded by the
  // sandbox child lifetime; it exits explicitly after checking every request record.
  return { addr: { port }, stop: () => Promise.resolve() };
}`,
    `start(options)`,
    `await kv.close();`,
    5,
  );
});
