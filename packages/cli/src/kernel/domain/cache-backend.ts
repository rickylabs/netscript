/**
 * Cache backend vocabulary shared by CLI scaffold flows.
 */

/** Cache backends accepted by `netscript init`. */
export type CacheBackendChoice = 'redis' | 'garnet' | 'deno-kv';

/** Ordered cache backend choices accepted by init. */
export const CACHE_BACKEND_CHOICES: readonly CacheBackendChoice[] = [
  'redis',
  'garnet',
  'deno-kv',
] as const;
