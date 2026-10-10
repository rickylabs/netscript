import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { fromFileUrl } from '@std/path';
import { artifactText } from '@netscript/plugin/adapter';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import type { JobHandlerDefinition } from '@netscript/plugin-workers-core';
import type { DeadLetterStorePort } from '@netscript/queue';
import { MemoryDeadLetterStore } from '@netscript/queue/testing';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { jobScaffolder } from './job.ts';
import { parseJobInput } from '../input.ts';
import { LocalWorkersRuntimeBackend } from '../../../cli/local-runtime-backend.ts';
import { AddJobCommand } from '../../../cli/commands.ts';

interface Delivery {
  deliveryId: string;
  endpointId: string;
  enqueuedAt: string;
  body: string;
}
interface Config {
  endpoints: ReadonlyMap<string, { url: string; secret: string; active: boolean }>;
  deadLetters: DeadLetterStorePort<Delivery>;
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  attemptTimeoutMs: number;
  now?: () => number;
  random?: () => number;
  send?: typeof fetch;
  wait?: (ms: number, signal: AbortSignal) => Promise<void>;
}
interface DeliveryModule {
  createDeliveryHandler(config: Config): JobHandlerDefinition<Delivery>;
  backoffMs(attempt: number, base: number, cap: number, random: number): number;
  signDelivery(key: CryptoKey, timestamp: string, id: string, body: string): Promise<string>;
  default: JobHandlerDefinition<Delivery>;
  deliveryJob: { id: string; maxRetries?: number };
}
const payload: Delivery = {
  deliveryId: 'outbox-42',
  endpointId: 'billing',
  enqueuedAt: '2026-10-10T00:00:00.000Z',
  body: '{"event":"invoice.paid"}',
};
const root = fromFileUrl(new URL('../../../../../../', import.meta.url));

function assertConfiguredEndpoint(source: string): void {
  assertStringIncludes(source, "requiredConfig('WEBHOOK_ENDPOINT_URL')");
  assert(!/https?:\/\//.test(source), 'Generated delivery template must not embed an endpoint URL');
}

Deno.test('webhook delivery scaffold golden rejects hardcoded endpoint and unknown recipe', () => {
  const input = parseJobInput({
    command: 'add-job',
    values: ['deliver-webhook'],
    flags: { template: 'webhook-delivery' },
  });
  const source = artifactText(jobScaffolder.emit(input)[0]);
  assertConfiguredEndpoint(source);
  assertThrows(() =>
    assertConfiguredEndpoint(
      source.replace("requiredConfig('WEBHOOK_ENDPOINT_URL')", "'https://hardcoded.invalid'"),
    )
  );
  assertThrows(() =>
    parseJobInput({ command: 'add-job', values: ['delivery'], flags: { template: 'unknown' } })
  );
  assertThrows(() =>
    parseJobInput({
      command: 'add-job',
      values: ['delivery'],
      flags: { template: 'webhook-delivery', 'max-retries': 3 },
    })
  );
  assertStringIncludes(source, '"maxRetries":0');
});

Deno.test('generated webhook delivery compiles and executes signature, retry and DLQ contracts', async (t) => {
  const directory = await Deno.makeTempDir({ prefix: 'webhook-delivery-' });
  try {
    const command = new AddJobCommand(
      new LocalWorkersRuntimeBackend({ files: new LocalProjectFiles(directory) }),
    );
    const result = await command.run({
      command: 'add-job',
      values: ['deliver-webhook'],
      flags: { template: 'webhook-delivery' },
    });
    assertEquals(result.code, 0, result.message);
    const path = directory + '/workers/jobs/deliver-webhook.ts';
    const source = await Deno.readTextFile(path);
    const rootConfig = JSON.parse(await Deno.readTextFile(root + '/deno.json'));
    // Consumer import map uses the same catalog version; first-party imports remain public entrypoints.
    await Deno.writeTextFile(
      path,
      source.replace("from 'zod'", "from 'npm:zod@" + rootConfig.catalog.zod + "'"),
    );
    assertConfiguredEndpoint(source);
    const format = await new Deno.Command(Deno.execPath(), {
      args: ['fmt', '--check', '--config', root + '/deno.json', path],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(format.code, 0, new TextDecoder().decode(format.stderr));
    const check = await new Deno.Command(Deno.execPath(), {
      args: [
        'check',
        '--unstable-kv',
        '--config',
        root + '/deno.json',
        path,
        directory + '/.netscript/generated/plugin-workers/job-registry.ts',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(check.code, 0, new TextDecoder().decode(check.stderr));
    const module: DeliveryModule = await import('file://' + path);
    assertEquals(module.deliveryJob.id, 'deliver-webhook');
    assertEquals(module.deliveryJob.maxRetries, 0);
    const registry: { definitions: ReadonlyMap<string, { maxRetries: number }> } = await import(
      'file://' + directory + '/.netscript/generated/plugin-workers/job-registry.ts'
    );
    assertEquals(registry.definitions.get('deliver-webhook')?.maxRetries, 0);
    await t.step(
      'recipe samples compile against published entrypoints and receiver verifies raw signatures',
      async () => {
        const page = await Deno.readTextFile(
          root + '/docs/site/orchestration-runtime/how-to/outbound-webhooks.md',
        );
        assertStringIncludes(page, 'at-least-once, never exactly-once');
        assertStringIncludes(page, 'Inbound `defineWebhook`');
        const samples = Array.from(page.matchAll(/```ts\n([\s\S]*?)```/g), (match) => match[1]);
        assertEquals(samples.length, 2);
        for (const [index, sample] of samples.entries()) {
          const samplePath = directory + '/sample-' + index + '.ts';
          await Deno.writeTextFile(
            samplePath,
            sample + (index === 1 ? '\nexport { verifyDelivery };\n' : ''),
          );
          const output = await new Deno.Command(Deno.execPath(), {
            args: ['check', '--unstable-kv', '--config', root + '/deno.json', samplePath],
            stdout: 'piped',
            stderr: 'piped',
          }).output();
          assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
        }
        const receiver: {
          verifyDelivery(
            body: string,
            headers: Headers,
            secret: string,
            now: number,
          ): Promise<string>;
        } = await import('file://' + directory + '/sample-1.ts');
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode('test-secret'),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        );
        const headers = new Headers({
          'webhook-id': payload.deliveryId,
          'idempotency-key': payload.deliveryId,
          'webhook-timestamp': '123',
          'webhook-signature': 'v1=' +
            await module.signDelivery(key, '123', payload.deliveryId, payload.body),
        });
        assertEquals(
          await receiver.verifyDelivery(payload.body, headers, 'test-secret', 123),
          payload.deliveryId,
        );
        await assertRejects(() =>
          receiver.verifyDelivery(payload.body + ' ', headers, 'test-secret', 123)
        );
        await assertRejects(() =>
          receiver.verifyDelivery(payload.body, headers, 'test-secret', 424)
        );
        headers.set('idempotency-key', 'conflicting-envelope');
        await assertRejects(() =>
          receiver.verifyDelivery(payload.body, headers, 'test-secret', 123)
        );
      },
    );
    const config = (
      store: DeadLetterStorePort<Delivery>,
      overrides: Partial<Config> = {},
    ): Config => ({
      endpoints: new Map([['billing', {
        url: 'https://receiver.invalid/events',
        secret: 'test-secret',
        active: true,
      }]]),
      deadLetters: store,
      maxAttempts: 4,
      baseDelayMs: 100,
      maxDelayMs: 250,
      attemptTimeoutMs: 1000,
      now: () => Date.parse(payload.enqueuedAt),
      random: () => 0.5,
      wait: () => Promise.resolve(),
      ...overrides,
    });
    const context = (signal = new AbortController().signal) => ({ id: 'run-1', payload, signal });

    await t.step('signature uses raw body, timestamp and stable delivery ID', async () => {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('test-secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
      );
      const signature = await module.signDelivery(key, '123', payload.deliveryId, payload.body);
      // Independent Node implementation is a golden vector, not a copy of the signing function.
      const { createHmac } = await import('node:crypto');
      assertEquals(
        signature,
        createHmac('sha256', 'test-secret').update('123.outbox-42.{"event":"invoice.paid"}').digest(
          'hex',
        ),
      );
      assert(signature !== await module.signDelivery(key, '124', payload.deliveryId, payload.body));
      assert(signature !== await module.signDelivery(key, '123', 'outbox-other', payload.body));
    });
    await t.step('capped full-jitter backoff schedule', () => {
      assertEquals([1, 2, 3, 4].map((n) => module.backoffMs(n, 100, 250, 0.5)), [
        50,
        100,
        125,
        125,
      ]);
      assertEquals(module.backoffMs(100, 100, 250, 0.999), 249);
    });
    await t.step(
      'attempt cap routes exhausted delivery into existing DLQ before success',
      async () => {
        const store = new MemoryDeadLetterStore<Delivery>();
        let calls = 0;
        const waits: number[] = [];
        const handler = module.createDeliveryHandler(config(store, {
          send: (_input, init) => {
            calls++;
            const headers = new Headers(init?.headers);
            assertEquals(headers.get('webhook-id'), payload.deliveryId);
            assertEquals(headers.get('idempotency-key'), payload.deliveryId);
            assertEquals(init?.body, payload.body);
            assertEquals(init?.redirect, 'error');
            assert(init?.signal);
            return Promise.resolve(new Response('', { status: 503 }));
          },
          wait: (ms) => {
            waits.push(ms);
            return Promise.resolve();
          },
        }));
        const result = await handler(context());
        assertEquals(calls, 4);
        assertEquals(waits, [50, 100, 125]);
        assertEquals(result.success, true);
        assertEquals(await store.depth(), 1);
        const [record] = await store.list();
        assertEquals(record.messageId, payload.deliveryId);
        assertEquals(record.payload, payload);
        assertEquals(record.deliveryCount, 4);
        assertEquals(record.reason, 'max_attempts_exceeded');
      },
    );
    await t.step(
      'default entrypoint reads injected config and persists exhausted delivery across KV reopen',
      async () => {
        const settings = {
          WEBHOOK_ENDPOINT_ID: 'billing',
          WEBHOOK_ENDPOINT_URL: 'https://configured.invalid/events',
          WEBHOOK_SIGNING_SECRET: 'injected-secret',
          WEBHOOK_DLQ_PATH: directory + '/delivery.sqlite',
          WEBHOOK_MAX_ATTEMPTS: '1',
        };
        const previous = new Map(Object.keys(settings).map((name) => [name, Deno.env.get(name)]));
        const originalFetch = globalThis.fetch;
        try {
          for (const [name, value] of Object.entries(settings)) Deno.env.set(name, value);
          globalThis.fetch = (input) => {
            assertEquals(String(input), settings.WEBHOOK_ENDPOINT_URL);
            return Promise.resolve(new Response(null, { status: 502 }));
          };
          await module.default(context());
          const kv = await Deno.openKv(settings.WEBHOOK_DLQ_PATH);
          try {
            const store = new KvDeadLetterStore<Delivery>({
              queueName: 'deliver-webhook',
              denoKv: kv,
            });
            assertEquals(await store.depth(), 1);
            const [record] = await store.list();
            assertEquals(record.payload, payload);
            assertEquals(record.deliveryCount, 1);
            assertEquals(record.reason, 'max_attempts_exceeded');
            assert(!JSON.stringify(record).includes(settings.WEBHOOK_SIGNING_SECRET));
          } finally {
            kv.close();
          }
        } finally {
          globalThis.fetch = originalFetch;
          for (const [name, value] of previous) {
            if (value === undefined) Deno.env.delete(name);
            else Deno.env.set(name, value);
          }
        }
      },
    );
    await t.step('success stops retries and does not dead-letter', async () => {
      const store = new MemoryDeadLetterStore<Delivery>();
      let calls = 0;
      await module.createDeliveryHandler(config(store, {
        send: () => {
          calls++;
          return Promise.resolve(new Response(null, { status: 204 }));
        },
      }))(context());
      assertEquals(calls, 1);
      assertEquals(await store.depth(), 0);
    });
    await t.step(
      'DLQ write failure propagates instead of acknowledging a dropped delivery',
      async () => {
        const store = new MemoryDeadLetterStore<Delivery>();
        store.append = () => Promise.reject(new Error('store unavailable'));
        await assertRejects(
          async () =>
            await module.createDeliveryHandler(config(store, {
              maxAttempts: 1,
              send: () => Promise.reject(new Error('offline')),
            }))(context()),
          Error,
          'store unavailable',
        );
      },
    );
    await t.step('job cancellation interrupts fetch without dead-lettering', async () => {
      const controller = new AbortController();
      const store = new MemoryDeadLetterStore<Delivery>();
      await assertRejects(
        async () =>
          await module.createDeliveryHandler(config(store, {
            send: (_input, init) => {
              controller.abort(new Error('shutdown'));
              return Promise.reject(init?.signal?.reason);
            },
          }))(context(controller.signal)),
        Error,
        'shutdown',
      );
      assertEquals(await store.depth(), 0);
    });
    await t.step('deadline prevents a retry whose delay consumes remaining budget', async () => {
      const store = new MemoryDeadLetterStore<Delivery>();
      let calls = 0;
      await assertRejects(
        async () =>
          await module.createDeliveryHandler(config(store, {
            send: () => {
              calls++;
              return Promise.resolve(new Response(null, { status: 500 }));
            },
          }))({ ...context(), deadlineAt: Date.parse(payload.enqueuedAt) + 25 }),
        DOMException,
        'deadline',
      );
      assertEquals(calls, 1);
      assertEquals(await store.depth(), 0);
    });
    await t.step('attempt timeout aborts network and bounded exhaustion writes DLQ', async () => {
      const store = new MemoryDeadLetterStore<Delivery>();
      await module.createDeliveryHandler(
        config(store, {
          maxAttempts: 1,
          attemptTimeoutMs: 5,
          send: (_input, init) =>
            new Promise((_resolve, reject) => {
              init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), {
                once: true,
              });
            }),
        }),
      )(context());
      assertEquals((await store.list())[0].errorCode, 'attempt_timeout');
    });
    await t.step('invalid policies and inactive endpoints fail before network', async () => {
      const store = new MemoryDeadLetterStore<Delivery>();
      assertThrows(() => module.createDeliveryHandler(config(store, { maxAttempts: Infinity })));
      await assertRejects(
        async () =>
          await module.createDeliveryHandler(config(store, { endpoints: new Map() }))(context()),
        TypeError,
      );
    });
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
