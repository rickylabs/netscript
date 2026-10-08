import { assert, assertEquals, assertThrows } from '@std/assert';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { z } from 'zod';
import * as publicCommands from '@netscript/service/commands';
import {
  canonicalCommandJson,
  type CommandDefinitionSpec,
  CommandError,
  type CommandFailure,
  defineCommand,
  jsonCodec,
  parseCanonicalCommandJson,
} from '@netscript/service/commands';
// The internal binding seam is exercised before an executor exists; definitions use real public exports.
import { commandHandler } from '../src/commands/application/define-command.ts';

Deno.test('canonical JSON matches RFC8785 number string and UTF16 ordering vectors', () => {
  // RFC 8785 Appendix B: finite IEEE 754 values, including rounding boundaries.
  const vectors = [
    ['0000000000000000', '0'],
    ['8000000000000000', '0'],
    ['0000000000000001', '5e-324'],
    ['8000000000000001', '-5e-324'],
    ['7fefffffffffffff', '1.7976931348623157e+308'],
    ['ffefffffffffffff', '-1.7976931348623157e+308'],
    ['4340000000000000', '9007199254740992'],
    ['c340000000000000', '-9007199254740992'],
    ['4430000000000000', '295147905179352830000'],
    ['44b52d02c7e14af5', '9.999999999999997e+22'],
    ['44b52d02c7e14af6', '1e+23'],
    ['44b52d02c7e14af7', '1.0000000000000001e+23'],
    ['444b1ae4d6e2ef4e', '999999999999999700000'],
    ['444b1ae4d6e2ef4f', '999999999999999900000'],
    ['444b1ae4d6e2ef50', '1e+21'],
    ['3eb0c6f7a0b5ed8c', '9.999999999999997e-7'],
    ['3eb0c6f7a0b5ed8d', '0.000001'],
    ['41b3de4355555553', '333333333.3333332'],
    ['41b3de4355555554', '333333333.33333325'],
    ['41b3de4355555555', '333333333.3333333'],
    ['41b3de4355555556', '333333333.3333334'],
    ['41b3de4355555557', '333333333.33333343'],
    ['becbf647612f3696', '-0.0000033333333333333333'],
    ['43143ff3c1cb0959', '1424953923781206.2'],
  ];
  for (const [hex, expected] of vectors) {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, BigInt('0x' + hex));
    assertEquals(canonicalCommandJson(view.getFloat64(0)), expected, hex);
  }
  const carriage = String.fromCharCode(13), control = String.fromCharCode(128);
  const keys = [carriage, '1', control, 'ö', '€', '😀', 'דּ'];
  const unordered = Object.fromEntries([...keys].reverse().map((key, index) => [key, index]));
  assertEquals(
    canonicalCommandJson(unordered),
    '{' + keys.map((key) => JSON.stringify(key) + ':' + unordered[key]).join(',') + '}',
  );
  assertEquals(canonicalCommandJson({ '2': true, '10': false }), '{"10":false,"2":true}');
  assertEquals(canonicalCommandJson({ z: [{ b: 2, a: 1 }], a: -0 }), '{"a":0,"z":[{"a":1,"b":2}]}');
  assertEquals(
    canonicalCommandJson(String.fromCharCode(0, 8, 9, 10, 12, 13, 34, 92)),
    '"\\u0000\\b\\t\\n\\f\\r\\"\\\\"',
  );
  assertEquals(canonicalCommandJson('é'), '"é"');
  assertEquals(canonicalCommandJson('e' + String.fromCharCode(769)), '"é"');
});

Deno.test('canonical JSON rejects non-IJSON values without invoking getters or toJSON', () => {
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  let invoked = 0;
  const getter = Object.defineProperty({}, 'value', {
    enumerable: true,
    get() {
      invoked++;
      return 1;
    },
  });
  const toJSON = {
    toJSON() {
      invoked++;
      return 1;
    },
  };
  const extra: unknown[] = [];
  Object.defineProperty(extra, 'extra', { value: 1 });
  const invalid = [
    undefined,
    NaN,
    Infinity,
    -Infinity,
    1n,
    Symbol(),
    () => 0,
    new Date(),
    new (class Value {})(),
    cycle,
    new Array(1),
    [undefined],
    { value: undefined },
    { value: () => 0 },
    { [Symbol()]: 1 },
    getter,
    toJSON,
    Object.defineProperty({}, 'hidden', { value: 1 }),
    new Uint8Array(1),
    new Map(),
    String.fromCharCode(0xd800),
    String.fromCharCode(0xdc00),
    { [String.fromCharCode(0xd800)]: 1 },
    extra,
  ];
  for (const value of invalid) assertThrows(() => canonicalCommandJson(value), TypeError);
  assertEquals(invoked, 0);
  assertEquals(canonicalCommandJson(Object.create(null)), '{}');
  const shared = { a: 1 };
  assertEquals(canonicalCommandJson([shared, shared]), '[{"a":1},{"a":1}]');
});

Deno.test('canonical JSON enforces tighten-only depth item and UTF8 byte limits before parsing', () => {
  let nested: unknown = 0;
  for (let index = 0; index < 64; index++) nested = [nested];
  canonicalCommandJson(nested);
  assertThrows(() => canonicalCommandJson([nested]), TypeError);
  canonicalCommandJson(new Array(9999).fill(0));
  assertThrows(() => canonicalCommandJson(new Array(10000).fill(0)), TypeError);
  canonicalCommandJson('a'.repeat(1048574));
  assertThrows(() => canonicalCommandJson('a'.repeat(1048575)), TypeError);
  assertThrows(() => canonicalCommandJson('é', { bytes: 3 }), TypeError);
  assertEquals(canonicalCommandJson(String.fromCharCode(0), { bytes: 8 }), '"\\u0000"');
  assertThrows(() => canonicalCommandJson(String.fromCharCode(0), { bytes: 7 }), TypeError);
  assertThrows(() => canonicalCommandJson({ a: 1 }, { items: 2 }), TypeError);
  assertThrows(() => canonicalCommandJson([[0]], { depth: 1 }), TypeError);
  for (
    const limits of [{ depth: 65 }, { items: 10001 }, { bytes: 1048577 }, { depth: 0 }, {
      items: 1.5,
    }, { bytes: NaN }]
  ) {
    assertThrows(() => jsonCodec(z.number(), limits), TypeError);
  }
  assertEquals(jsonCodec(z.number(), { bytes: 1 }).encode(0), 0);
  const parse = JSON.parse;
  let parsed = 0;
  JSON.parse = () => {
    parsed++;
    throw new Error('parser must not receive oversized input');
  };
  try {
    for (
      const text of [
        '['.repeat(65) + '0' + ']'.repeat(65),
        '[' + '0,'.repeat(10000) + '0]',
        '"' + 'a'.repeat(1048575) + '"',
      ]
    ) {
      assertThrows(() => parseCanonicalCommandJson(text), TypeError);
    }
  } finally {
    JSON.parse = parse;
  }
  assertEquals(parsed, 0);
});

Deno.test('stored canonical JSON rejects duplicate keys alternate spellings and corrupt receipts', () => {
  const negatives = [
    '{"a":1,"a":1}',
    '{"a":1,"a":2}',
    '{"b":2,"a":1}',
    ' {"a":1}',
    '{ "a":1}',
    '1.0',
    '-0',
    '1E+21',
    '"\\u0061"',
    '"\\/"',
    '"\\ud800"',
    '1e999',
    '[1,]',
    '{',
    '{"__proto__":1,"__proto__":2}',
  ];
  for (const text of negatives) assertThrows(() => parseCanonicalCommandJson(text));
  const text = canonicalCommandJson({ b: 2, a: 1 });
  assertEquals(parseCanonicalCommandJson(text), { a: 1, b: 2 });
  const result = parseCanonicalCommandJson('{"__proto__":{"safe":true}}');
  assert(Object.isFrozen(result));
  assertEquals(Object.getPrototypeOf(result), Object.prototype);
  assertEquals(Object.getOwnPropertyDescriptor(result, '__proto__')?.value, { safe: true });
});

Deno.test('JSON codecs validate both directions and refuse invalid schema outputs', () => {
  const codec = jsonCodec(z.object({ id: z.string(), count: z.number().int() }));
  assertEquals(codec.decode(codec.encode({ id: 'item', count: 2 })), { id: 'item', count: 2 });
  assertThrows(() => codec.decode({ id: 1, count: 2 }), TypeError, 'schema validation failed');
  assertThrows(() => codec.decode({ id: 'item', count: 1.5 }), TypeError);
  assertThrows(() => jsonCodec(z.unknown()).encode(new Date()), TypeError);
  assertThrows(
    () => jsonCodec(z.number().transform((value) => value + 1)).encode(1),
    TypeError,
    'canonical JSON identity',
  );
  assertThrows(
    () => jsonCodec(z.number().transform((value) => value + 1)).decode(2),
    TypeError,
    'canonical JSON identity',
  );
  assertEquals(jsonCodec(z.number().transform((value) => value)).decode(2), 2);
  assertThrows(() => jsonCodec(z.string().transform(() => new Date())).decode('value'), TypeError);
  assertThrows(
    () => jsonCodec(z.string().transform(() => 'long'), { bytes: 3 }).decode('a'),
    TypeError,
  );
});

Deno.test('JSON codecs require synchronous schema validation with a configuration diagnostic', async () => {
  const schema: StandardSchemaV1<unknown, unknown> = {
    '~standard': { version: 1, vendor: 'fixture', validate: (value) => Promise.resolve({ value }) },
  };
  const codec = jsonCodec(schema);
  assertThrows(() => codec.encode(0), TypeError, 'synchronous schema validation required');
  assertThrows(() => codec.decode(0), TypeError, 'synchronous schema validation required');
  const rejecting: StandardSchemaV1<unknown, unknown> = {
    '~standard': {
      version: 1,
      vendor: 'fixture',
      validate: () => Promise.reject(new Error('fixture rejection')),
    },
  };
  assertThrows(
    () => jsonCodec(rejecting).decode(0),
    TypeError,
    'synchronous schema validation required',
  );
  await Promise.resolve();
});

Deno.test('JSON codec encoding takes bounded immutable snapshots before schema work', () => {
  let validations = 0;
  const schema: StandardSchemaV1<unknown, unknown> = {
    '~standard': {
      version: 1,
      vendor: 'fixture',
      validate: (value) => {
        validations++;
        return { value };
      },
    },
  };
  const codec = jsonCodec(schema, { items: 5 });
  const source = { values: [1] };
  const encoded = codec.encode(source);
  source.values[0] = 2;
  assertEquals(encoded, { values: [1] });
  assert(Object.isFrozen(codec));
  assert(Object.isFrozen(encoded));
  assert(typeof encoded === 'object' && encoded !== null && !Array.isArray(encoded));
  assert(Object.isFrozen(Reflect.get(encoded, 'values')));
  const prior = validations;
  assertThrows(() => codec.encode(new Array(6).fill(0)), TypeError);
  assertEquals(validations, prior);
});

function specification(): CommandDefinitionSpec<
  'items.update',
  { id: string },
  { updated: boolean },
  unknown
> {
  return {
    name: 'items.update',
    definitionVersion: 1,
    idempotency: {
      scope: ({ input }) => input.id,
      fingerprint: (input) => input,
      response: jsonCodec(z.object({ updated: z.boolean() })),
    },
    records: { audit: 'required', outbox: 'optional' },
    handle: () => Promise.resolve({ updated: true }),
  };
}

Deno.test('command definitions validate durable identities and freeze policies without execution', () => {
  const spec = specification();
  const definition = defineCommand(spec);
  assertEquals(definition.idempotency.mode, 'required');
  assertEquals(
    defineCommand({ ...spec, idempotency: { ...spec.idempotency, mode: 'optional' } }).idempotency
      .mode,
    'optional',
  );
  for (
    const value of [
      definition,
      definition.records,
      definition.idempotency,
      definition.idempotency.response,
    ]
  ) assert(Object.isFrozen(value));
  assert(!('handle' in definition));
  for (const name of ['', 'Uppercase', 'items..update', 'items_update', 'a'.repeat(121)]) {
    assertThrows(() => defineCommand({ ...spec, name }), TypeError);
  }
  for (const definitionVersion of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assertThrows(() => defineCommand({ ...spec, definitionVersion }), TypeError);
  }
  for (
    const invalid of [{ ...spec, isolationLevel: 'invalid' }, { ...spec, handle: undefined }, {
      ...spec,
      records: { audit: 'invalid', outbox: 'optional' },
    }, { ...spec, idempotency: { ...spec.idempotency, mode: 'invalid' } }]
  ) {
    assertThrows(() => Reflect.apply(defineCommand, undefined, [invalid]), TypeError);
  }
});

Deno.test('private command bindings reject copied definitions and unauthenticated reflection callers', () => {
  assert(!('commandHandler' in publicCommands));
  assert(!('commandDefinitionBinding' in publicCommands));
  assert(!('commandExecutorCapability' in publicCommands));
  let executions = 0;
  const original = () => {
    executions++;
    return Promise.resolve({ updated: true });
  };
  const definition = defineCommand({ ...specification(), handle: original });
  assertEquals(commandHandler(definition), original);
  assertThrows(() => commandHandler({ ...definition }), TypeError, 'foreign definition');
  const keys = Object.getOwnPropertySymbols(definition);
  assertEquals(keys.length, 1);
  const resolver: unknown = Reflect.get(definition, keys[0]);
  assert(typeof resolver === 'function');
  assertThrows(
    () => resolver(Symbol('caller'), definition),
    TypeError,
    'foreign binding capability',
  );
  assertEquals(executions, 0);
});

Deno.test('command errors freeze redacted failure data and exclude trusted causes from serialization', () => {
  const failures: CommandFailure[] = [
    { kind: 'invalid_envelope', retryable: false, reason: 'actor' },
    { kind: 'optimistic_conflict', retryable: false },
    { kind: 'idempotency_key_reuse', retryable: false },
    { kind: 'in_progress', retryable: true, retryAfterMs: 0 },
    { kind: 'unsupported_capability', retryable: false, capability: 'store_atomicity' },
    { kind: 'codec_failure', retryable: false, phase: 'response_decode' },
    { kind: 'receipt_corrupt', retryable: false },
    { kind: 'store_failure', retryable: true, phase: 'commit' },
    { kind: 'aborted', retryable: true },
  ];
  const cause = new Error('trusted detail');
  for (const failure of failures) {
    const error = new CommandError(failure, { cause });
    assert(Object.isFrozen(error));
    assert(Object.isFrozen(error.failure));
    assertEquals(error.cause, cause);
    assertEquals(JSON.stringify(error), JSON.stringify(failure));
    assertEquals(error.message, 'Command failure: ' + failure.kind);
  }
  const error = Reflect.construct(CommandError, [{
    kind: 'store_failure',
    retryable: false,
    phase: 'claim',
    request: 'private detail',
  }]);
  assert(error instanceof CommandError);
  assertEquals(error.failure, { kind: 'store_failure', retryable: false, phase: 'claim' });
  for (
    const invalid of [
      { kind: 'optimistic_conflict', retryable: true },
      { kind: 'in_progress', retryable: true, retryAfterMs: -1 },
      { kind: 'in_progress', retryable: true, retryAfterMs: 1.5 },
      { kind: 'codec_failure', retryable: false, phase: 'invalid' },
    ]
  ) {
    assertThrows(() => Reflect.construct(CommandError, [invalid]), TypeError);
  }
});
