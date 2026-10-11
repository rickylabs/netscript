import { assertEquals, assertThrows } from '@std/assert';
import * as stores from './saga-store-backend.ts';

Deno.test('projection selector honors env, PascalCase/lowercase settings, none and KV default', () => {
  const resolve = Reflect.get(stores, 'resolveSagaProjectionBackend');
  if (typeof resolve !== 'function') throw new Error('Projection selector missing');
  assertEquals(resolve(), 'kv');
  for (const backend of ['kv', 'prisma', 'none']) {
    assertEquals(resolve({ appsettings: { sagas: { projection: { backend } } } }), backend);
    assertEquals(
      resolve({ appsettings: { Sagas: { Projection: { Backend: backend } } } }),
      backend,
    );
    assertEquals(
      resolve({
        env: { NETSCRIPT_SAGA_PROJECTION: backend },
        appsettings: { Sagas: { Projection: { Backend: 'prisma' } } },
      }),
      backend,
    );
  }
  assertEquals(resolve({ env: { NETSCRIPT_SAGA_STORE: 'kv' } }), 'kv');
  assertEquals(resolve({ env: { NETSCRIPT_SAGA_STORE: 'prisma' } }), 'prisma');
  assertThrows(() => resolve({ env: { NETSCRIPT_SAGA_PROJECTION: 'typo' } }));
});
