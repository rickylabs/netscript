import { assertEquals, assertRejects } from '@std/assert';
import type { JobHandlerDefinition } from '@netscript/plugin-workers-core';

interface RpcOptions {
  context: { signal: AbortSignal };
}
interface Ports {
  orders: {
    getById(
      input: { id: number },
      options: RpcOptions,
    ): Promise<{ id: number; reference: string; status: string }>;
    update(input: { id: number; data: { status: string } }, options: RpcOptions): Promise<unknown>;
  };
  sagas: {
    publish(input: unknown, options: RpcOptions): Promise<{ published: boolean }>;
    getInstance(input: unknown, options: RpcOptions): Promise<{ status: string }>;
  };
}
interface WorkerModule {
  createFulfilOrderJob(ports: Ports): JobHandlerDefinition<{ orderId: number }>;
}

async function worker(): Promise<WorkerModule> {
  let source = await Deno.readTextFile(
    new URL(
      '../../src/kernel/assets/showcase/background/fulfil-order.ts.template',
      import.meta.url,
    ),
  );
  // Isolate the default client composition; the complete generated workspace checks its real contract.
  source = source.replace(
    "import { OrdersContractV1 } from '../../contracts/versions/v1/orders.contract.ts';",
    'const OrdersContractV1 = {};',
  );
  source = source.replace(
    'export const fulfilOrderJob = createFulfilOrderJob();',
    'export const fulfilOrderJob = undefined;',
  );
  for (
    const specifier of [
      '@netscript/plugin-workers-core',
      '@netscript/plugin-sagas-core/contracts/v1',
      '@netscript/sdk/client',
      'zod',
    ]
  ) {
    source = source.replaceAll(`'${specifier}'`, JSON.stringify(import.meta.resolve(specifier)));
  }
  return await import(
    'data:application/typescript;base64,' + new TextEncoder().encode(source).toBase64()
  );
}
function ports(): Ports {
  return {
    orders: {
      getById: () => Promise.resolve({ id: 40, reference: 'SO-10482', status: 'pending' }),
      update: () => Promise.resolve({}),
    },
    sagas: {
      publish: () => Promise.resolve({ published: true }),
      getInstance: () => Promise.resolve({ status: 'completed' }),
    },
  };
}

Deno.test('fulfilment propagates cancellation to a stalled upstream read and performs no writes', async () => {
  const module = await worker();
  const dependencies = ports();
  const controller = new AbortController();
  const started = Promise.withResolvers<void>();
  let writes = 0;
  dependencies.orders.getById = (_input, options) => {
    assertEquals(options.context.signal, controller.signal);
    started.resolve();
    return new Promise((_resolve, reject) =>
      options.context.signal.addEventListener(
        'abort',
        () => reject(options.context.signal.reason),
        { once: true },
      )
    );
  };
  dependencies.orders.update = () => {
    writes++;
    return Promise.resolve({});
  };
  const execution = module.createFulfilOrderJob(dependencies)({
    id: 'cancelled-read',
    payload: { orderId: 40 },
    signal: controller.signal,
  });
  await started.promise;
  controller.abort(new DOMException('Cancelled test execution', 'AbortError'));
  await assertRejects(() => Promise.resolve(execution), DOMException, 'Cancelled test execution');
  assertEquals(writes, 0);
});

Deno.test('fulfilment cannot write payment or shipping after a cancelled saga publication', async () => {
  const module = await worker();
  const dependencies = ports();
  const controller = new AbortController();
  const writes: string[] = [];
  dependencies.orders.update = (input, options) => {
    assertEquals(options.context.signal, controller.signal);
    writes.push(input.data.status);
    return Promise.resolve({});
  };
  dependencies.sagas.publish = (_input, options) => {
    assertEquals(options.context.signal, controller.signal);
    controller.abort(new DOMException('Cancelled publication', 'AbortError'));
    // A remote endpoint can ignore cancellation and acknowledge late.
    return Promise.resolve({ published: true });
  };
  await assertRejects(
    () =>
      Promise.resolve(
        module.createFulfilOrderJob(dependencies)({
          id: 'cancelled-publish',
          payload: { orderId: 40 },
          signal: controller.signal,
        }),
      ),
    DOMException,
    'Cancelled publication',
  );
  assertEquals(writes, ['awaiting_payment']);
});
