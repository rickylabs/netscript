/**
 * Value fixtures that every KV adapter must store and deliver unchanged.
 *
 * @module
 */

/**
 * Plain-JSON user values shaped like encoding markers or envelope metadata.
 *
 * An adapter that encodes values must not reinterpret any of them, at any depth.
 */
export const MARKER_SHAPED_VALUES: readonly unknown[] = [
  { '$kv:bigint': '123' },
  { '$kv:bigint': 'invalid' },
  { nested: { '$kv:bigint': '1' }, list: [{ '$kv:bigint': '2' }, [{ '$kv:bigint': 'x' }]] },
  { bigints: [['value']], value: { bigints: [['value']] } },
  ['$kv:bigint', { bigints: 'not-metadata', versionstamp: 'user-data' }],
];

/** Values carrying `bigint`, the operand and result type of `sum`/`min`/`max`. */
export const BIGINT_VALUES: readonly unknown[] = [
  9007199254740993n,
  { total: -12n, list: [1n, { n: 2n }], label: 'mixed' },
  { '$kv:bigint': 3n, bigints: [4n] },
];
