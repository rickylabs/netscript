import { assert, assertEquals } from '@std/assert';
import { BaseQueryBuilder } from '@tanstack/react-db';
import { workersStreamSchema } from '../../../../plugin-workers-core/src/streams/schema.ts';
import { createQueryCollection } from '../../../../sdk/src/collections/create-query-collection.ts';
import { createNetScriptQueryClient } from '../../../../sdk/src/query-client/query-client-factory.ts';
import { createStateSchema } from '@durable-streams/state';
import { createStreamDB } from '@durable-streams/state/db';
import { z } from 'zod';
import { createNetScriptStreamDB, type NetScriptStreamDBFactoryInput } from './create-stream-db.ts';

const stateDefinition = {
  events: {
    schema: z.object({ id: z.string() }),
    type: 'event',
    primaryKey: 'id',
  },
};
type TestState = typeof stateDefinition;

Deno.test('createNetScriptStreamDB wires stream URL, schema, and lifecycle handle through the factory', () => {
  const schema = createStateSchema(stateDefinition);
  let captured: NetScriptStreamDBFactoryInput<TestState> | undefined;
  let stopped = false;

  const db = createNetScriptStreamDB<TestState>({
    baseUrl: 'https://streams.example.test',
    streamPath: '/workers/executions',
    schema,
    createStreamDB(input) {
      captured = input;
      return Object.assign(createStreamDB(input), {
        stop() {
          stopped = true;
        },
      });
    },
  });

  db.stop?.();

  assertEquals(
    captured?.streamOptions.url,
    'https://streams.example.test/v1/stream/netscript/workers/executions',
  );
  assertEquals(captured?.streamOptions.contentType, 'application/json');
  assertEquals(captured?.state, schema);
  assertEquals(Object.keys(db.collections), ['events']);
  assertEquals(stopped, true);
});

Deno.test('default worker stream Collection enters the actual Fresh adapter and SDK query family', async () => {
  const server = Deno.serve({ port: 0, onListen() {} }, () =>
    new Response('[]', {
      headers: {
        'Content-Type': 'application/json',
        'Stream-Next-Offset': '0',
        'Stream-Up-To-Date': 'true',
      },
    }));
  const baseUrl = new URL(`http://${server.addr.hostname}:${server.addr.port}`).origin;
  const db = createNetScriptStreamDB({
    baseUrl,
    streamPath: '/workers',
    schema: createStateSchema(workersStreamSchema),
  });
  const client = createNetScriptQueryClient({ gcTime: 0 });
  const query = createQueryCollection({
    resource: 'collection-identity',
    queryKey: ['collection-identity'],
    queryClient: client,
    queryFn: () => Promise.resolve([{ id: 'sdk-item' }]),
    getKey: (item) => item.id,
  });
  try {
    const builder = new BaseQueryBuilder().from({ execution: db.collections.execution });
    assert(builder !== undefined);
    const sdkConstructor: unknown = Reflect.get(query, 'constructor');
    assert(typeof sdkConstructor === 'function');
    assertEquals(Reflect.get(db.collections.execution, 'constructor'), sdkConstructor);
    assert(typeof db.preload === 'function');
    assert(typeof db.close === 'function');
    await db.preload();
    await query.preload();
    assertEquals(query.toArray.map((item) => item.id), ['sdk-item']);
    assertEquals(db.collections.execution.size, 0);
  } finally {
    db.close?.();
    const cleanup: unknown = Reflect.get(query, 'cleanup');
    assert(typeof cleanup === 'function');
    await cleanup.call(query);
    client.clear();
    await server.shutdown();
  }
  assertEquals(query.subscriberCount, 0);
  assertEquals(db.collections.execution.subscriberCount, 0);
});
