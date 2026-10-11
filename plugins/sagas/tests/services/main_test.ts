import { assertEquals, assertRejects } from '@std/assert';
import createSagasService from '../../services/src/main.ts';

Deno.test('Prisma projection API rejects missing host delegates before listening or registry loading', async () => {
  let dbCalls = 0;
  await assertRejects(
    () =>
      createSagasService({
        env: { PORT: '0', NETSCRIPT_SAGA_PROJECTION: 'prisma' },
        db: {
          getClient: () => {
            dbCalls++;
            return Promise.resolve({ user: {} });
          },
        },
        contracts: undefined,
        kv: undefined,
        logger: undefined,
      }),
    Error,
    'Sagas database client is missing required Prisma delegates.',
  );
  assertEquals(dbCalls, 1);
});
