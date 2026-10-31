import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { delay } from '@std/async';
import { z } from 'zod';
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import { DenoKvAdapter, resetKv } from '@netscript/kv';
import { createPluginService } from '@netscript/plugin/service';
import { defineSaga } from '@netscript/plugin-sagas-core';
import type {
  SagaCorrelationKey,
  SagaDefinition,
  SagaInstanceId,
  SagaMessage,
} from '@netscript/plugin-sagas-core/domain';
import type { SagaStorePort } from '@netscript/plugin-sagas-core/ports';
import { workerJobEffect } from '@netscript/plugin-sagas-core/integration/workers';
import { publishSagaOrThrow } from '@netscript/plugin-sagas-core/integration/publisher';
import { defineJob } from '@netscript/plugin-workers-core';
import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';
import {
  createWorkerCommandOutboxSink,
  type WorkerJobCommandRequest,
} from '@netscript/plugin-workers-core/integration/commands';
import { createCommandOutboxRelay } from '@netscript/service/commands/relay';
import type { CommandOutboxRelayStore } from '@netscript/database/commands';
import { KvPollingAdapter } from '@netscript/queue/adapters/kv-polling';
import {
  buildStreamUrl,
  createServiceStreamProducer,
  defineStreamSchema,
} from '@netscript/plugin-streams-core';
import { DurableStreamProducerTransport } from '../../../../../packages/plugin-streams-core/src/adapters/durable-stream-producer-transport.ts';
import { router } from '../../../services/src/router.ts';
import type {
  SagaServiceContext,
  SagaServiceRuntime,
} from '../../../services/src/routers/v1-types.ts';
import { createSagaPublisher } from '../../../src/runtime/saga-publisher.ts';
import {
  createSagaDeliveryPublisher,
  type SagaDeliveryMessage,
} from '../../../src/runtime/saga-delivery.ts';
import type {
  SagaInstanceProjectionPort,
  SagaInstanceReadModel,
} from '../../../src/runtime/saga-instance-projection.ts';
import { startSagaRunner } from '../../../src/runtime/saga-runner.ts';
import { withReceiptWorker } from './projected-receipt-worker.ts';

export const RECEIPT_SAGA_ID = 'projected-receipt' as const;
export const RECEIPT_CORRELATION = 'document-one' as SagaCorrelationKey;
export const RECEIPT_INSTANCE = `${RECEIPT_SAGA_ID}:${RECEIPT_CORRELATION}` as SagaInstanceId;
const ADMIT = 'receipt.admit';
const RECORDED = 'receipt.recorded';
const Document = z.object({ id: z.string(), status: z.enum(['admitted', 'recorded']) });
const streamSchema = defineStreamSchema({
  receipt: { schema: Document, type: 'receipt', primaryKey: 'id' },
});
const selectedJob = defineJob('publish-receipt').payload(z.object({ id: z.string() }))
  .entrypoint(import.meta.url).build();

/** Provider-specific persistence; all runtime behavior below stays first party. */
export interface ReceiptBackend {
  openStore(): SagaStorePort | Promise<SagaStorePort>;
  readCanonical(): ReturnType<SagaStorePort['load']>;
  projection: SagaInstanceProjectionPort;
  readProjection(): Promise<SagaInstanceReadModel | undefined>;
  relayStore?: CommandOutboxRelayStore;
  serviceContext: Pick<SagaServiceContext, 'db' | 'sagaStore' | 'useKvProjection'>;
  assertCommands(expected: number): Promise<void>;
}

/** Native saga definition shared by both providers and the KV capability refusal guard. */
export function receiptSaga(atomicWorker: boolean): SagaDefinition<
  typeof RECEIPT_SAGA_ID,
  { status: string; receipts: number },
  SagaMessage<typeof ADMIT> | SagaMessage<typeof RECORDED>
> {
  const builder = atomicWorker
    ? defineSaga(RECEIPT_SAGA_ID).durableWorkerCommands()
    : defineSaga(RECEIPT_SAGA_ID);
  return builder.state({ status: 'new', receipts: 0 })
    .on(ADMIT, (saga) => {
      saga.state.status = 'admitted';
      return atomicWorker
        ? [
          workerJobEffect(selectedJob, { id: RECEIPT_CORRELATION }, {
            destination: 'workers',
            topic: 'receipt',
          }),
        ]
        : [];
    })
    .on(RECORDED, (saga) => {
      saga.state = { status: 'recorded', receipts: saga.state.receipts + 1 };
      return [];
    }).build();
}

// Avoid idle Node HTTP keep-alive sockets holding the reference server open during teardown.
const referenceFetch: typeof fetch = (input, init) => {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  headers.set('connection', 'close');
  return fetch(input, { ...init, headers, signal: init?.signal ?? AbortSignal.timeout(5000) });
};

/** Minimal first-party admission → worker → stream readback → projected receipt reproduction. */
export async function runProjectedReceiptFlow(backend: ReceiptBackend): Promise<void> {
  const temp = await Deno.makeTempDir();
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  const previousKv = Deno.env.get('NETSCRIPT_SAGA_KV_PATH');
  const server = new DurableStreamTestServer({ port: 0 });
  const kv = new DenoKvAdapter(await Deno.openKv(temp + '/fixture.db'));
  let producer: ReturnType<typeof createServiceStreamProducer<typeof streamSchema>> | undefined;
  let supervisor: Awaited<ReturnType<typeof startSagaRunner>> | undefined;
  let http: Deno.HttpServer<Deno.NetAddr> | undefined;
  const atomicWorker = backend.relayStore !== undefined;
  const definition = receiptSaga(atomicWorker);
  const message = (type: string) => ({
    type,
    payload: { id: RECEIPT_CORRELATION },
    correlationKey: RECEIPT_CORRELATION,
    idempotencyKey: type + ':one',
  });
  let workerCalls = 0;
  let sessions = 0;
  let delivery: ReturnType<typeof createSagaDeliveryPublisher> | undefined;
  let activeQueue: KvPollingAdapter<SagaDeliveryMessage>;

  async function startProcessor() {
    const queue = new KvPollingAdapter<SagaDeliveryMessage>({
      kv,
      queueName: 'receipt-sagas',
      pollInterval: 5,
      deduplicationWindow: 0,
    });
    activeQueue = queue;
    delivery = createSagaDeliveryPublisher({ queue });
    supervisor = await startSagaRunner({
      deliveryQueue: queue,
      projection: backend.projection,
      runtimeOptions: { native: { store: await backend.openStore() } },
      importer: () => Promise.resolve({ definitions: [definition] }),
      readEnv: () => undefined,
    });
    sessions++;
    assertEquals(supervisor.snapshot().status, 'running');
  }
  async function waitForVersion(version: number) {
    for (let attempt = 0; attempt < 400; attempt++) {
      const value = await backend.readProjection();
      if (value?.version === version) return value;
      assertEquals(supervisor?.snapshot().status, 'running');
      await delay(5);
    }
    throw new Error(`Projection did not reach version ${version}`);
  }
  async function createProducer() {
    const key = ['receipt', 'epoch'];
    const previous = await kv.get<number>(key);
    const epoch = (previous?.value ?? -1) + 1;
    assert(
      (await kv.atomic([{ key, versionstamp: previous?.versionstamp ?? null }], [{
        type: 'set',
        key,
        value: epoch,
      }])).ok,
    );
    return createServiceStreamProducer({
      streamPath: '/issue-2390/receipts',
      producerId: 'receipt-publisher',
      initialEpoch: epoch,
      schema: streamSchema,
      transport: new DurableStreamProducerTransport(referenceFetch),
    });
  }
  async function streamSnapshot() {
    const response = await referenceFetch(buildStreamUrl('/issue-2390/receipts'));
    assertEquals(response.status, 200);
    return {
      events: z.array(z.object({ value: Document }).passthrough()).parse(await response.json()),
      offset: response.headers.get('stream-next-offset'),
    };
  }

  try {
    Deno.env.set('DURABLE_STREAMS_URL', await server.start());
    Deno.env.set('NETSCRIPT_SAGA_KV_PATH', temp + '/replay.db');
    await resetKv();
    await startProcessor();
    const app = createPluginService(router, {
      auth: { public: true, reason: 'Isolated first-party receipt regression' },
      name: 'projected-receipt',
      context: () => ({
        ...backend.serviceContext,
        sagaRuntime: {
          publish: (...[event, options]: Parameters<SagaServiceRuntime['publish']>) => {
            assert(delivery);
            return delivery.publish({
              ...event,
              payload: event.payload ?? {},
              correlationKey: event.correlationKey as SagaCorrelationKey,
            }, options);
          },
        },
      }),
    }).build();
    http = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, app.fetch);
    const publisher = createSagaPublisher({
      baseUrl: `http://127.0.0.1:${http.addr.port}`,
      readEnv: () => undefined,
      fetcher: referenceFetch,
    });
    producer = await createProducer();
    assertEquals(
      (await producer.upsert('receipt', { id: 'prior-document', status: 'admitted' }).completion)
        .status,
      'delivered',
    );
    const primed = await streamSnapshot();
    assertEquals(primed.events.length, 1);
    await publishSagaOrThrow(publisher, message(ADMIT));
    const admitted = await waitForVersion(1);
    assertEquals(admitted.state.status, 'admitted');
    assertEquals(admitted.status, 'running');
    assertEquals((await backend.readCanonical())?.state, { status: 'admitted', receipts: 0 });
    assertEquals((await backend.readCanonical())?.metadata.version, 1);
    await backend.assertCommands(atomicWorker ? 1 : 0);
    assertEquals(workerCalls, 0);

    // Both lifetimes end after durable admission/commit, before the receipt publication begins.
    await producer.stop();
    producer = undefined;
    await supervisor!.stop();
    supervisor = undefined;
    // A new process has a fresh module singleton; retain its on-disk KV replay database.
    await resetKv();
    await startProcessor();
    producer = await createProducer();
    const job: JobDefinition = {
      id: selectedJob.id,
      enabled: true,
      executionType: 'deno',
      entrypoint: import.meta.url,
      handler: async (context) => {
        workerCalls++;
        const document = {
          ...z.object({ id: z.string() }).parse(context.payload),
          status: 'recorded' as const,
        };
        assert(producer);
        const outcome = await producer.upsert('receipt', document).completion;
        assertEquals(outcome.status, 'delivered', 'receipt not delivered to the change log');
        const appended = await streamSnapshot();
        assertEquals(appended.events.map((event) => event.value), [{
          id: 'prior-document',
          status: 'admitted',
        }, document], 'acknowledged receipt must exist in the durable change log');
        assertNotEquals(appended.offset, primed.offset);
        await publishSagaOrThrow(publisher, message(RECORDED));
        return { success: true, data: { recorded: true } };
      },
    };
    await withReceiptWorker(kv, job, async (dispatch) => {
      if (backend.relayStore) {
        const sink = createWorkerCommandOutboxSink({
          id: 'workers',
          targets: new Map([['receipt', { kind: 'job', id: selectedJob.id }]]),
          workers: {
            triggerJob: dispatch,
            triggerTask: () => Promise.reject(new Error('Unexpected task')),
          },
        });
        const relay = createCommandOutboxRelay({
          store: backend.relayStore,
          sinks: new Map([['workers', sink]]),
          batchSize: 1,
          concurrency: 1,
          clock: { now: () => new Date() },
          ids: { next: () => crypto.randomUUID() },
          leaseMs: 5000,
          maxAttempts: 3,
          maxRetryDelayMs: 1000,
          classify: () => 'unavailable',
          retryAt: (_attempt, now) => new Date(now.getTime() + 1),
        });
        try {
          assertEquals(await relay.drainOnce(), 1);
          assertEquals(await relay.drainOnce(), 0);
        } finally {
          await relay.stop();
        }
      } else {
        // KV has no atomic command outbox. This explicitly tests only its supported receipt path.
        const request: WorkerJobCommandRequest = {
          jobId: selectedJob.id,
          payload: { id: RECEIPT_CORRELATION },
          correlationId: RECEIPT_CORRELATION,
          idempotencyKey: 'kv-supported-receipt',
        };
        await dispatch(request);
        await dispatch(request);
      }
    });
    const recorded = await waitForVersion(2);
    assertEquals(recorded.state, { status: 'recorded', receipts: 1 });
    assertEquals(recorded.status, 'running');
    const queried = await referenceFetch(
      `http://127.0.0.1:${http.addr.port}/api/v1/sagas/instances/${RECEIPT_SAGA_ID}/${RECEIPT_CORRELATION}`,
    );
    assertEquals(queried.status, 200);
    const view = z.object({
      state: z.record(z.string(), z.unknown()),
      status: z.string(),
      version: z.number(),
    }).parse(await queried.json());
    assertEquals(view.state, recorded.state);
    assertEquals(view.status, 'running');
    assertEquals(view.version, 2);
    assertEquals((await backend.readCanonical())?.state, recorded.state);
    assertEquals(workerCalls, 1);
    await supervisor!.stop();
    supervisor = undefined;
    // A new process has a fresh module singleton; retain its on-disk KV replay database.
    await resetKv();
    await startProcessor();
    // Queue deduplication is disabled: this reaches the persistent saga replay check.
    await publishSagaOrThrow(publisher, message(ADMIT));
    await publishSagaOrThrow(publisher, message(RECORDED));
    for (let attempt = 0; attempt < 100; attempt++) {
      const stats = await activeQueue!.getStats();
      if (stats.pending === 0 && stats.processing === 0) break;
      await delay(5);
    }
    assertEquals(await activeQueue!.getStats(), { pending: 0, processing: 0, dlq: 0 });
    assertEquals((await backend.readCanonical())?.metadata.version, 2);
    assertEquals((await backend.readProjection())?.state, recorded.state);
    await backend.assertCommands(atomicWorker ? 1 : 0);
    assertEquals(supervisor!.snapshot().status, 'running');
    assertEquals(sessions, 3);
    assertEquals(workerCalls, 1);
    assertEquals((await streamSnapshot()).events.length, 2);
  } finally {
    await http?.shutdown();
    await supervisor?.stop();
    await resetKv();
    await producer?.stop();
    await kv.close();
    await server.stop();
    if (previousUrl === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    if (previousKv === undefined) Deno.env.delete('NETSCRIPT_SAGA_KV_PATH');
    else Deno.env.set('NETSCRIPT_SAGA_KV_PATH', previousKv);
    await Deno.remove(temp, { recursive: true });
  }
}
