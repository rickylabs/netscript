import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { resolveSagaServicePrismaClient } from './database-client.ts';

Deno.test('KV saga service accepts a host client without saga Prisma delegates', () => {
  assertEquals(resolveSagaServicePrismaClient({ user: {} }, 'kv'), undefined);
});

Deno.test('Prisma saga service rejects a host client without saga Prisma delegates', () => {
  assertThrows(
    () => resolveSagaServicePrismaClient({ user: {} }, 'prisma'),
    Error,
    'Sagas database client is missing required Prisma delegates.',
  );
});

Deno.test('saga service accepts a complete saga Prisma client for either backend', () => {
  const client = {
    sagaInstance: { findMany() {}, count() {} },
    sagaExecutionHistory: { findMany() {}, count() {} },
    sagaRuntimeState: {},
    sagaRuntimeTransition: {},
    sagaRuntimeCorrelation: {},
    $transaction() {},
  };
  const input: unknown = client;

  assert(resolveSagaServicePrismaClient(input, 'kv') === input);
  assert(resolveSagaServicePrismaClient(input, 'prisma') === input);
});
