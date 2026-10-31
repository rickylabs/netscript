import { RedisAdapter } from '../../adapters/redis.adapter.ts';

const queue = new RedisAdapter('redis://unused');
await queue.listen(() => Promise.resolve(), { signal: AbortSignal.abort() });
console.log('scoped environment defaults remain compatible');
