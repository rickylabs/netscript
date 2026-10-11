import { assertEquals, assertThrows } from '@std/assert';
import {
  resolveSagaProjectionBackend as resolve,
  SAGA_PROJECTION_BACKEND_ENV,
  SAGA_PROJECTION_BACKENDS,
  type SagaProjectionBackend,
} from './saga-store-backend.ts';

Deno.test('projection selector honors env, PascalCase/lowercase settings, none and KV default', () => {
  const defaultBackend: SagaProjectionBackend = resolve();
  assertEquals(defaultBackend, 'kv');
  assertEquals(SAGA_PROJECTION_BACKENDS, ['kv', 'prisma', 'none']);
  assertEquals(resolve(), 'kv');
  for (const backend of SAGA_PROJECTION_BACKENDS) {
    assertEquals(resolve({ appsettings: { sagas: { projection: { backend } } } }), backend);
    assertEquals(
      resolve({ appsettings: { Sagas: { Projection: { Backend: backend } } } }),
      backend,
    );
    assertEquals(
      resolve({
        env: { [SAGA_PROJECTION_BACKEND_ENV]: backend },
        appsettings: { Sagas: { Projection: { Backend: 'prisma' } } },
      }),
      backend,
    );
  }
  assertEquals(resolve({ env: { NETSCRIPT_SAGA_STORE: 'kv' } }), 'kv');
  assertEquals(resolve({ env: { NETSCRIPT_SAGA_STORE: 'prisma' } }), 'prisma');
  assertThrows(
    () => resolve({ env: { [SAGA_PROJECTION_BACKEND_ENV]: 'typo' } }),
    Error,
    'expected kv, prisma, none',
  );
});
