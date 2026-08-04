import { assertEquals } from '@std/assert';
import { App } from 'fresh';
import { invalidateServerQueryCache } from '../../application/query/cache-invalidation/mod.ts';
import { registerQueryCacheInvalidationRoute } from './query-cache-invalidation.ts';

Deno.test('standard invalidation edge makes the next server read observe a committed mutation', async () => {
  const app = new App();
  let source = 'before mutation';
  let cached: string | undefined;
  let invalidatedKey: readonly (string | number | boolean | null)[] | undefined;
  const readPageData = (): string => cached ??= source;

  registerQueryCacheInvalidationRoute(app, {}, (queryKey) => {
    invalidatedKey = queryKey;
    cached = undefined;
    return Promise.resolve();
  });
  const handler = app.handler();

  assertEquals(readPageData(), 'before mutation');
  source = 'after mutation';
  assertEquals(readPageData(), 'before mutation');

  await invalidateServerQueryCache(['boards', 'board', 'acme'], {
    fetcher: (input, init) =>
      handler(new Request(new URL(String(input), 'http://localhost'), init)),
  });

  assertEquals(invalidatedKey, ['boards', 'board', 'acme']);
  assertEquals(readPageData(), 'after mutation');
});

Deno.test('standard invalidation edge rejects unsafe or malformed requests', async () => {
  const app = new App();
  registerQueryCacheInvalidationRoute(app, {}, () => Promise.resolve());
  const handler = app.handler();
  const endpoint = 'http://localhost/_netscript/query-cache/invalidate';

  const crossOrigin = await handler(
    new Request(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://attacker.example',
      },
      body: JSON.stringify({ queryKey: ['boards'] }),
    }),
  );
  assertEquals(crossOrigin.status, 403);

  const malformedKey = await handler(
    new Request(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ queryKey: [{ tenant: 'acme' }] }),
    }),
  );
  assertEquals(malformedKey.status, 400);

  const wrongContentType = await handler(
    new Request(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ queryKey: ['boards'] }),
    }),
  );
  assertEquals(wrongContentType.status, 415);
});
