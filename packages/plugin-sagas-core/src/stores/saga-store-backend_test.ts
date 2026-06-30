import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';

import { resolveSagaStoreBackend } from './saga-store-backend.ts';

Deno.test('resolveSagaStoreBackend reads NETSCRIPT_SAGA_STORE', () => {
  assertEquals(
    resolveSagaStoreBackend({ env: { NETSCRIPT_SAGA_STORE: 'prisma' } }),
    'prisma',
  );
});

Deno.test('resolveSagaStoreBackend reads appsettings sagas.store.backend', () => {
  assertEquals(
    resolveSagaStoreBackend({
      appsettings: { sagas: { store: { backend: 'kv' } } },
    }),
    'kv',
  );
});

Deno.test('resolveSagaStoreBackend gives env precedence over appsettings', () => {
  assertEquals(
    resolveSagaStoreBackend({
      env: { NETSCRIPT_SAGA_STORE: 'prisma' },
      appsettings: { sagas: { store: { backend: 'kv' } } },
    }),
    'prisma',
  );
});

Deno.test('resolveSagaStoreBackend rejects invalid backend', () => {
  assertThrows(
    () => resolveSagaStoreBackend({ env: { NETSCRIPT_SAGA_STORE: 'sqlite' } }),
    Error,
    'expected kv or prisma',
  );
});

Deno.test('resolveSagaStoreBackend requires explicit selection', () => {
  assertThrows(
    () => resolveSagaStoreBackend(),
    Error,
    'Saga store backend is required',
  );
});
