import { DenoKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { RedisAdapter } from '@netscript/queue/adapters/redis';
import { processWorkerJob, processWorkerTask } from '../job-dispatcher.ts';
import { recoveryContext } from './redis-worker-context.ts';
import type { MessageContext } from '@netscript/queue';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';

const [url, name, kvPath, concept] = Deno.args;
const kv = new DenoKvAdapter(await Deno.openKv(kvPath));
const context = recoveryContext(new KvWorkerIdempotencyStore({ kv }), {
  execute: () => {
    // The dispatcher has already persisted its active claim before reaching the executor.
    console.log('CLAIMED');
    return new Promise(() => {});
  },
});
const queue = new RedisAdapter<JobMessage & TaskMessage>(url, name);
await queue.listen((message, delivery) => {
  // Compress the worker's production renewal duration solely to bound this crash regression.
  const short: MessageContext = {
    ...delivery,
    extendVisibility: () => delivery.extendVisibility!(200),
  };
  return concept === 'job'
    ? processWorkerJob(context, message, short)
    : processWorkerTask(context, message, short);
}, { visibilityTimeout: 200, recoveryGrace: 20 });
