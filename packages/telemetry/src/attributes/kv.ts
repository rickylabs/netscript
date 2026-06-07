/**
 * Semantic key-value store attribute names.
 */
export const KVAttributes = {
  KV_OPERATION: 'kv.operation',
  KV_KEY: 'kv.key',
  KV_KEY_COUNT: 'kv.key_count',
  KV_ATOMIC: 'kv.atomic',
  KV_VALUE_SIZE: 'kv.value_size_bytes',
} as const;

/**
 * Key-value store operation names.
 */
export const KVOperations = {
  GET: 'get',
  SET: 'set',
  DELETE: 'delete',
  LIST: 'list',
  WATCH: 'watch',
  ATOMIC: 'atomic',
} as const;
