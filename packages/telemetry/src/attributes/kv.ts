/**
 * Semantic key-value store attribute names.
 */
export const KVAttributes = {
  KV_OPERATION: 'netscript.kv.operation',
  KV_KEY: 'netscript.kv.key',
  KV_KEY_COUNT: 'netscript.kv.key_count',
  KV_ATOMIC: 'netscript.kv.atomic',
  KV_VALUE_SIZE: 'netscript.kv.value_size_bytes',
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
