import type { Redis } from 'ioredis';
import { type ParsedDelayedEntry, readDelayedEntries } from './_redis-delayed-promotion.ts';

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

/** Cached Lua loading and bounded EVALSHA batches on one promotion client. */
export class RedisDelayedScript {
  #sha?: Promise<string>;

  /** Keep script state alongside its dedicated client. */
  constructor(private readonly client: Redis) {}

  /** Promote due members atomically, reloading once if the server evicted the script. */
  async promote(delayedKey: string): Promise<number> {
    const entries = await readDelayedEntries(this.client, delayedKey);
    if (entries.length === 0) return 0;
    const dueAt = Date.now();
    const results = await this.execute(entries, delayedKey, dueAt, await this.scriptSha());
    const missing = results.flatMap(([error], index) =>
      error?.message.startsWith('NOSCRIPT') ? [index] : []
    );
    if (missing.length > 0) {
      this.#sha = undefined;
      const retried = await this.execute(
        missing.map((index) => entries[index]),
        delayedKey,
        dueAt,
        await this.scriptSha(),
      );
      missing.forEach((index, retryIndex) => results[index] = retried[retryIndex]);
    }
    let promoted = 0;
    for (const [index, [error, result]] of results.entries()) {
      if (!error) {
        if (result === 1) promoted++;
        continue;
      }
      if (!error.message.includes('WRONGTYPE')) throw error;
      console.error('[RedisAdapter] Delayed target push failed; member retained:', {
        queueKey: entries[index].parsed.queueKey,
        error: error.message,
      });
    }
    return promoted;
  }

  /** Load the static script once; transport failures leave the load undetermined. */
  private scriptSha(): Promise<string> {
    return this.#sha ??= this.client.script('LOAD', PROMOTE_DELAYED_MEMBER).then((sha) => {
      if (typeof sha !== 'string') throw new Error('Redis did not return a script SHA');
      return sha;
    }).catch((error: unknown) => {
      this.#sha = undefined;
      throw error;
    });
  }

  /** Dispatch only script hashes, keys, and member arguments in one pipeline. */
  private async execute(
    entries: ParsedDelayedEntry[],
    delayedKey: string,
    dueAt: number,
    sha: string,
  ): Promise<[Error | null, unknown][]> {
    const pipeline = this.client.pipeline();
    for (const { entry, parsed } of entries) {
      pipeline.evalsha(sha, 2, delayedKey, parsed.queueKey, entry, parsed.envelope, dueAt);
    }
    const results = await pipeline.exec();
    if (!results) throw new Error('Redis did not return delayed promotion results');
    return results;
  }
}
