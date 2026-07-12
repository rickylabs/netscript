import { assertEquals } from '@std/assert';
import { createStateSchema } from '@durable-streams/state';
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
      return {
        collections: {
          events: { name: 'events' },
        },
        stop() {
          stopped = true;
        },
      };
    },
  });

  db.stop?.();

  assertEquals(
    captured?.streamOptions.url,
    'https://streams.example.test/v1/stream/netscript/workers/executions',
  );
  assertEquals(captured?.streamOptions.contentType, 'application/json');
  assertEquals(captured?.state, schema);
  assertEquals(db.collections.events, { name: 'events' });
  assertEquals(stopped, true);
});
