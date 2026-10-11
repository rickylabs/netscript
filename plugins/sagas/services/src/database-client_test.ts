import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { resolveSagaServicePrismaClient } from './database-client.ts';
import { RunnerPrismaClient } from '../../tests/runtime/fixtures/runner-prisma-client.ts';

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
  const client = new RunnerPrismaClient();
  const input: unknown = client;

  assert(resolveSagaServicePrismaClient(input, 'kv') === input);
  assert(resolveSagaServicePrismaClient(input, 'prisma') === input);
});

Deno.test('saga service validates the shared canonical-store delegate subset', () => {
  const client = new RunnerPrismaClient();
  Reflect.deleteProperty(client.sagaRuntimeState, 'create');
  assertThrows(
    () => resolveSagaServicePrismaClient(client, 'prisma'),
    Error,
    'Sagas database client is missing required Prisma delegates.',
  );
});
