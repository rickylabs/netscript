import { assertEquals } from '@std/assert';
import { os } from '@orpc/server';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { RPCHandler } from '@orpc/server/fetch';
import { createServiceClient } from '../../src/client/mod.ts';
import { createQueryFactories } from '../../src/query/mod.ts';
import { resetCacheProvider, setCacheProvider } from '../../src/cache/cache-provider.ts';
import { CacheQuery } from '../../src/cache/cache-query.ts';
import { MemoryCacheStore } from '../test-helpers.ts';

Deno.test('query factories forward required bearer context through cached actions and query options', async () => {
  const received: Array<string | null> = [];
  const contract = {
    echo: os.handler(({ input }: { input: unknown }) => input),
  };
  const handler = new RPCHandler(contract);
  const server = Deno.serve({ port: 0, onListen: () => {} }, async (request) => {
    received.push(request.headers.get('authorization'));
    const result = await handler.handle(request, { prefix: '/api/rpc/v1/context-test' });
    return result.response ?? new Response('Not found', { status: 404 });
  });
  const bearer = createBearerSdkClientContribution<{ accessToken: string }>({
    context: { accessToken: 'required' },
    resolveCredential: ({ context }) => context.accessToken,
    responseCache: { mode: 'invariant' },
    unmarked: 'required',
  });
  const client = createServiceClient({
    contract,
    serviceName: 'context-test',
    contributions: [bearer] as const,
    resolveServiceUrl: () => `http://127.0.0.1:${server.addr.port}`,
  });
  const action = createQueryFactories({ secured: { contract, client } }).secured.echo;
  const credential = crypto.randomUUID();
  const options = { context: { accessToken: credential } };

  try {
    resetCacheProvider();
    assertEquals(await action.queryOptions({ message: 'browser' }, options).queryFn(), {
      message: 'browser',
    });
    setCacheProvider(new CacheQuery(new MemoryCacheStore()));
    const input = { message: 'server' };
    assertEquals(await action(input, options), input);
    assertEquals(await action.queryOptions(input, options).queryFn(), input);
    assertEquals(received.length, 2);
    assertEquals(received, [
      `Bearer ${credential}`,
      `Bearer ${credential}`,
    ]);
  } finally {
    resetCacheProvider();
    await server.shutdown();
  }
});
