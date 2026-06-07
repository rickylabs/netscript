/**
 * Shared lifecycle helpers and internal utilities for `@netscript/kv`.
 *
 * Key utilities (`keyToString`, `generateVersionstamp`, `keyHasPrefix`,
 * `compareKeys`) are internal to the package and are **not** re-exported from
 * the public `mod.ts` entrypoint.
 *
 * @module
 */

export {
  closeKv,
  getActiveProvider,
  getKv,
  getKvPath,
  getRawKv,
  isKvInitialized,
  type KvAdapterFactory,
  type KvProvider,
  registerKvAdapter,
  resetKv,
  type SharedKvConfig,
} from './shared.ts';

export { getRedisConnectionFromEnv } from './auto-detect.ts';

export { compareKeys, generateVersionstamp, keyHasPrefix, keyToString } from './keys.ts';
