import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { RedisConnectionManager } from '../adapters/redis/connection.ts';
import { WatchSubscriptions } from '../adapters/redis/watch-subscriptions.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

Deno.test({
  name: 'Redis watch leases: concurrent connection, final unsubscribe and reacquire are isolated',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const manager = new RedisConnectionManager(redisUrl, {});
    const channel = `leases-${crypto.randomUUID()}`;
    const otherChannel = `${channel}-other`;
    const parsed: string[] = [];
    const subscriptions = new WatchSubscriptions(
      () => manager.ensureSubscriber(),
      (message: string) => {
        parsed.push(message);
        return message;
      },
    );
    const first: string[] = [];
    let delivered = Promise.withResolvers<string>();
    const notify = (message: string): void => {
      delivered.resolve(message);
    };
    try {
      const clients = await Promise.all(
        Array.from({ length: 8 }, () => manager.ensureSubscriber()),
      );
      assert(clients.every((client) => client === clients[0]), 'one physical subscriber is shared');
      const client = await manager.ensureClient();
      const [releaseFirst, releaseSecond, releaseOther] = await Promise.all([
        subscriptions.acquire(channel, (message) => first.push(message)),
        subscriptions.acquire(channel, notify),
        subscriptions.acquire(otherChannel, () => {}),
      ]);
      assertEquals(await client.pubsub('NUMSUB', channel, otherChannel), [
        channel,
        1,
        otherChannel,
        1,
      ]);
      await client.publish(channel, 'both-live');
      assertEquals(await deadline(delivered.promise, 5_000), 'both-live');
      assertEquals(first, ['both-live']);
      assertEquals(parsed, ['both-live'], 'one parse for two live watchers');
      delivered = Promise.withResolvers<string>();
      await releaseFirst();
      await client.publish(channel, 'still-live');
      assertEquals(await deadline(delivered.promise, 5_000), 'still-live');
      assertEquals(first, ['both-live']);
      assertEquals(parsed, ['both-live', 'still-live']);

      // The last release racing a new lease cannot unsubscribe the new lease.
      const [, releaseNew] = await Promise.all([
        releaseSecond(),
        subscriptions.acquire(channel, notify),
      ]);
      await releaseSecond(); // An old release is idempotent even after reacquire.
      assertEquals(await client.pubsub('NUMSUB', channel, otherChannel), [
        channel,
        1,
        otherChannel,
        1,
      ]);
      await releaseNew();
      assertEquals(await client.pubsub('NUMSUB', channel, otherChannel), [
        channel,
        0,
        otherChannel,
        1,
      ]);
      await releaseOther();
      assertEquals(await client.pubsub('NUMSUB', otherChannel), [otherChannel, 0]);
    } finally {
      await manager.close();
    }
  },
});
