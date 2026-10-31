import { DenoKvAdapter, type KvStore } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { defineSaga } from '@netscript/plugin-sagas-core';
import {
  KvSagaAppliedKeyStore,
  KvSagaIdempotencyStore,
  KvSagaStore,
} from '@netscript/plugin-sagas-core/stores';
import {
  sagaMessageIdempotencyTarget,
  type SagaRuntime,
} from '@netscript/plugin-sagas-core/runtime';
import type {
  SagaCorrelationKey,
  SagaInstanceId,
  SagaState,
} from '@netscript/plugin-sagas-core/domain';
import { SagaRuntimeSupervisor } from '../../../src/runtime/saga-supervisor.ts';

const [backend, root, phase, namespace] = Deno.args;
Deno.env.set('NETSCRIPT_SAGA_KV_PATH', root + '/supervisor.db');
const kv: KvStore = backend === 'redis'
  ? new RedisKvAdapter({ url: Deno.env.get('NETSCRIPT_TEST_REDIS_URL')!, namespace })
  : new DenoKvAdapter(await Deno.openKv(root + '/state.db'));
const store = new KvSagaStore({ kv });
const appliedKeys = new KvSagaAppliedKeyStore({ kv });
const idempotency = new KvSagaIdempotencyStore({ kv });
const instanceId = 'atomic-crash:case' as SagaInstanceId;
const message = {
  type: 'atomic.start',
  payload: {},
  correlationKey: 'case' as SagaCorrelationKey,
  idempotencyKey: 'delivery-1',
};
if (phase === 'orphan') {
  await appliedKeys.recordApplied(instanceId, message.idempotencyKey);
  await idempotency.reserve(sagaMessageIdempotencyTarget(message), message.idempotencyKey);
}
const definition = defineSaga('atomic-crash').state<SagaState>({ count: 0 }).on(
  message.type,
  (saga) => {
    Deno.writeTextFileSync(root + '/calls.txt', 'handled\n', { append: true });
    saga.state = { count: Number(saga.state.count) + 1 };
    return [];
  },
).build();
const pausedStore = new Proxy(store, {
  get(target, key) {
    const member = Reflect.get(target, key);
    if (phase === 'crash' && (key === 'commitTransition' || key === 'save')) {
      return async () => {
        await Deno.stdout.write(new TextEncoder().encode('PAUSED_AFTER_HANDLER\n'));
        await new Promise(() => setInterval(() => undefined, 60_000));
      };
    }
    return typeof member === 'function' ? member.bind(target) : member;
  },
});
const ready = Promise.withResolvers<SagaRuntime>();
const waiting = Promise.withResolvers<void>();
const supervisor = new SagaRuntimeSupervisor({
  definitions: [definition],
  runtimeOptions: { native: { store: pausedStore, idempotency, engineOptions: { appliedKeys } } },
  delivery: {
    start(runtime) {
      ready.resolve(runtime);
      return Promise.resolve();
    },
    stop() {
      waiting.resolve();
      return Promise.resolve();
    },
    wait() {
      return waiting.promise;
    },
  },
});
try {
  await supervisor.start();
  const runtime = await ready.promise;
  await runtime.publish(message);
  await runtime.publish(message);
  const result = {
    envelope: await store.load(instanceId),
    history: await store.transitions(instanceId),
  };
  await Deno.stdout.write(new TextEncoder().encode(JSON.stringify(result) + '\n'));
} finally {
  await supervisor.stop();
}
