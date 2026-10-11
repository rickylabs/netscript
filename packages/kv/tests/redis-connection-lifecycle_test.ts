import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import { deadline } from '@std/async';
import { spy, stub } from '@std/testing/mock';
import { Redis } from 'ioredis';
import { RedisConnectionManager } from '../adapters/redis/connection.ts';
import { KvClosedError } from '../application/errors.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

for (const method of ['ensureClient', 'ensureSubscriber'] as const) {
  Deno.test({
    name: `Redis connections: close during ${method} quits the late shared connection`,
    ignore: !redisUrl,
    async fn() {
      assert(redisUrl);
      const manager = new RedisConnectionManager(redisUrl, {});
      const connected = Promise.withResolvers<Redis>();
      const resume = Promise.withResolvers<void>();
      const originalOnce = Redis.prototype.once;
      // Pause readiness acknowledgement after the real server connection exists.
      const onceStub = stub(Redis.prototype, 'once', function (event, listener) {
        if (event === 'ready') {
          return originalOnce.call(this, event, () => {
            connected.resolve(this);
            resume.promise.then(() => listener());
          });
        }
        return originalOnce.call(this, event, listener);
      });
      const results = Promise.allSettled([manager[method](), manager[method]()]);
      let late: Redis | undefined;
      try {
        late = await deadline(connected.promise, 5_000);
        const ended = Promise.withResolvers<void>();
        late.once('end', () => ended.resolve());
        using quitSpy = spy(late, 'quit');
        await manager.close();
        resume.resolve();
        for (const result of await deadline(results, 5_000)) {
          assertEquals(result.status, 'rejected');
          if (result.status === 'rejected') assertInstanceOf(result.reason, KvClosedError);
        }
        assertEquals(quitSpy.calls.length, 1, 'concurrent callers must quit only once');
        await deadline(ended.promise, 5_000);
        assertEquals(late.status, 'end');
      } finally {
        resume.resolve();
        onceStub.restore();
        await manager.close();
        late?.disconnect();
      }
    },
  });
}
