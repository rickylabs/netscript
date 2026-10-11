import { assertEquals, assertThrows } from '@std/assert';
import { StandardRPCJsonSerializer } from '@orpc/client/standard';

Deno.test('RPC native-value decoding preserves the serialized input for repeated consumers', () => {
  const serializer = new StandardRPCJsonSerializer();
  const input = { at: new Date('2026-10-10T20:00:00Z'), count: 42n };
  const [json, meta] = serializer.serialize(input);
  const snapshot = structuredClone(json);
  assertEquals(serializer.deserialize(json, meta), input);
  assertEquals(json, snapshot);
  assertEquals(serializer.deserialize(json, meta), input);
});

Deno.test('RPC native-value decoding rejects mismatched serialized types', () => {
  const serializer = new StandardRPCJsonSerializer();
  const [, meta] = serializer.serialize({ count: 42n });
  assertThrows(() => serializer.deserialize({ count: {} }, meta));
});

Deno.test('RPC blob decoding rejects a non-Blob attachment', () => {
  const serializer = new StandardRPCJsonSerializer();
  const [json, meta, maps] = serializer.serialize({ file: new Blob(['hello']) });
  assertThrows(() => {
    // @ts-expect-error Deliberately violate the transport attachment contract.
    serializer.deserialize(json, meta, maps, () => 'not a blob');
  });
});
