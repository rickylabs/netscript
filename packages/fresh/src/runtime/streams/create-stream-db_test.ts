import { assertEquals } from '@std/assert';
import {
  createNetScriptStreamDB,
  type NetScriptStreamDBFactoryInput,
  type NetScriptStreamStateDefinition,
} from './create-stream-db.ts';

type TestState = NetScriptStreamStateDefinition & {
  readonly events: unknown;
};

Deno.test('createNetScriptStreamDB wires stream URL, schema, and lifecycle handle through the factory', () => {
  const schema = {
    events: { primaryKey: 'id' },
  };
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
