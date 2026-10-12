import type { Redis } from 'ioredis';
import { readDelayedEntries } from './_redis-delayed-promotion.ts';

const PROMOTE_DELAYED_MEMBER = `
local score = redis.call('ZSCORE', KEYS[1], ARGV[1])
if not score then return 0 end
if tonumber(score) > tonumber(ARGV[3]) then return 0 end
if KEYS[1] == KEYS[2] then
  return redis.error_reply('WRONGTYPE delayed and ready keys must differ')
end
if redis.call('ZREM', KEYS[1], ARGV[1]) == 1 then
  local pushed = redis.pcall('LPUSH', KEYS[2], ARGV[2])
  if type(pushed) == 'table' and pushed.err then
    redis.call('ZADD', KEYS[1], score, ARGV[1])
    return redis.error_reply(pushed.err)
  end
  return 1
end
return 0
`;

/** Promote a bounded batch with per-member atomic Lua, restoring failed pushes. */
export async function promoteDelayedScriptBatch(client: Redis, delayedKey: string): Promise<void> {
  const entries = await readDelayedEntries(client, delayedKey);
  if (entries.length === 0) return;
  const pipeline = client.pipeline();
  const dueAt = Date.now();
  for (const { entry, parsed } of entries) {
    pipeline.eval(
      PROMOTE_DELAYED_MEMBER,
      2,
      delayedKey,
      parsed.queueKey,
      entry,
      parsed.envelope,
      dueAt,
    );
  }
  const results = await pipeline.exec();
  if (!results) throw new Error('Redis did not return delayed promotion results');
  for (const [index, [error]] of results.entries()) {
    if (!error) continue;
    if (!error.message.includes('WRONGTYPE')) throw error;
    console.error('[RedisAdapter] Delayed target push failed; member retained:', {
      queueKey: entries[index].parsed.queueKey,
      error: error.message,
    });
  }
}
