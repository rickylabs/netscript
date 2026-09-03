import { assertEquals } from '@std/assert';

import { captureDatabaseEndpointAllocation } from '../../../src/application/gates/scaffold/runtime/capture-db-endpoint-allocation.ts';

Deno.test('database allocation waits for endpoint evidence then captures one topology snapshot', async () => {
  const projectRoot = await Deno.makeTempDir();
  const calls: string[] = [];
  try {
    const path = await captureDatabaseEndpointAllocation(
      '/workspace/aspire/apphost.mts',
      projectRoot,
      'first',
      'postgres',
      (_appHost, resourceName) => {
        calls.push(`endpoint:${resourceName}`);
        return Promise.resolve(['tcp://127.0.0.1:5432']);
      },
      () => {
        calls.push('snapshot');
        return Promise.resolve(JSON.stringify({ resources: [{ displayName: 'postgres' }] }));
      },
    );

    assertEquals(calls, ['endpoint:postgres', 'snapshot']);
    assertEquals(path, `${projectRoot}/.netscript/e2e/db-allocation-first.json`);
    assertEquals(
      JSON.parse(await Deno.readTextFile(path)),
      { resources: [{ displayName: 'postgres' }] },
    );
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
