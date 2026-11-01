import { RedisAdapter } from '../../adapters/redis.adapter.ts';
import { delay } from '@std/async';

const [name, role, timeout, limit, grace] = Deno.args;
const url = Deno.env.get('NETSCRIPT_LEASE_TEST_URL');
if (!url) throw new Error('Missing lease test backend');
const queue = new RedisAdapter(url, name);
const controller = new AbortController();
try {
  await queue.listen(async (_message, context) => {
    const event = { deliveryCount: context.deliveryCount, messageId: context.messageId };
    if (role === 'heartbeat') {
      if (!await context.extendVisibility?.()) throw new Error('Heartbeat refused');
      console.log(JSON.stringify(event));
      for (;;) {
        await delay(40);
        if (!await context.extendVisibility?.()) throw new Error('Heartbeat expired');
      }
    }
    if (role === 'stop') {
      await queue.stop();
      console.log(JSON.stringify(event));
    } else if (role === 'once') {
      await context.ack();
      console.log(JSON.stringify(event));
      controller.abort();
    } else {
      console.log(JSON.stringify(event));
      await new Promise<void>(() => {});
    }
  }, {
    visibilityTimeout: Number(timeout),
    maxDeliveries: Number(limit),
    recoveryGrace: Number(grace),
    signal: controller.signal,
  });
} finally {
  await queue.stop();
}
