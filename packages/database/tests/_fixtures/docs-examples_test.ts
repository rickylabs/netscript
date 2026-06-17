import { assertEquals } from 'jsr:@std/assert@1';
import { buildPostgresConnectionString } from '../../mod.ts';
import { createMockDatabaseAdapter } from '../../testing/mod.ts';

Deno.test('docs: builds a PostgreSQL connection string from parts', () => {
  const url = buildPostgresConnectionString({
    host: 'localhost',
    port: 5432,
    database: 'app',
    user: 'app',
    password: 'secret',
  });

  assertEquals(url, 'postgresql://app:secret@localhost:5432/app');
});

Deno.test('docs: mock adapter follows basic lifecycle', async () => {
  const adapter = createMockDatabaseAdapter();

  await adapter.connect();
  assertEquals(await adapter.healthCheck(), true);

  const result = await adapter.executeRaw<{ query: string }>('select 1');
  assertEquals(result.query, 'select 1');

  await adapter.disconnect();
  assertEquals(await adapter.healthCheck(), false);
});
