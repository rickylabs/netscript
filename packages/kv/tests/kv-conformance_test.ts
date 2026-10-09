/**
 * Runs the shared KV port contract against the memory and Redis adapters.
 *
 * The Redis half needs `NETSCRIPT_TEST_REDIS_URL` (CI provides a Redis
 * service); each scenario gets its own namespace.
 */

import { RedisKvAdapter } from '../redis.ts';
import {
  createMemoryKvAdapter,
  runKvStoreContract,
  runWatchableKvContract,
} from '../src/testing/mod.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

const memory = { name: 'MemoryKvAdapter contract', make: createMemoryKvAdapter };
const redis = {
  name: 'RedisKvAdapter contract',
  ignore: !redisUrl,
  make: () => new RedisKvAdapter({ url: redisUrl, namespace: `contract-${crypto.randomUUID()}` }),
};

runKvStoreContract(memory);
runWatchableKvContract(memory);
runKvStoreContract(redis);
runWatchableKvContract(redis);
