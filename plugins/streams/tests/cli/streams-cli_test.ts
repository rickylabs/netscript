import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { getAvailablePort } from '@std/net';
import { DurableStreamTestServer } from '@durable-streams/server';
import { inspectStreamTopic } from '@netscript/plugin-streams-core';
import { StreamsCli, streamsCli } from '../../src/cli/composition/main.ts';
import type { PluginCliArgs, PluginCliResult } from '../../src/cli/composition/main.ts';
import {
  clearStream,
  inspectDiscoveredTopic,
  publishStreamEvent,
  subscribeToStream,
} from '../../src/cli/adapters/runtime-client.ts';
import { discoverStreamTopics } from '../../src/cli/adapters/topic-walker.ts';
import type { DiscoveredStreamTopic, StreamsCliServices } from '../../src/cli/streams-types.ts';

const topic: DiscoveredStreamTopic = {
  name: '/orders/events',
  streamPath: '/orders/events',
  producerId: 'orders-test',
  producerFile: 'plugins/orders/streams/producer.ts',
  collections: [{ name: 'order', type: 'order.event', primaryKey: 'id' }],
};

Deno.test('StreamsCli executes discovery and diagnostic verbs through injected services', async () => {
  let cleared = false;
  const services = createServices({
    clear: () => {
      cleared = true;
      return Promise.resolve();
    },
  });
  const cli = new StreamsCli(services);

  assertEquals(cli.name, 'streams');
  assertEquals(cli.commands().map((command) => command.name), [
    'list-topics',
    'subscribe',
    'publish',
    'stats',
    'inspect',
    'clear',
    'add-schema',
    'add-producer',
    'add-consumer',
  ]);

  const listed = await runStreamsCommand(cli, { command: 'list-topics' });
  assertEquals(listed.data, { topics: [topic] });

  const inspected = await runStreamsCommand(cli, { command: 'inspect', values: [topic.name] });
  assertEquals(
    inspected.data,
    inspectStreamTopic({
      target: topic.name,
      schema: {} as never,
      streamPath: topic.streamPath,
      producerId: topic.producerId,
    }),
  );

  const stats = await runStreamsCommand(cli, { command: 'stats', values: [topic.name] });
  assertEquals(stats, inspected);

  const clearedResult = await runStreamsCommand(cli, { command: 'clear', values: [topic.name] });
  assertEquals(clearedResult.code, 0);
  assertEquals(cleared, true);
});

Deno.test('StreamsCli publishes and subscribes with structured command data', async () => {
  const services = createServices();
  const cli = new StreamsCli(services);

  const published = await runStreamsCommand(cli, {
    command: 'publish',
    values: [topic.name],
    flags: { collection: 'order', data: '{"id":"order-7","status":"paid"}' },
  });
  assertEquals(published, {
    code: 0,
    message: 'Published to /orders/events.',
    data: { id: 'order-7', status: 'paid' },
  });

  const subscribed = await runStreamsCommand(cli, {
    command: 'subscribe',
    values: [topic.name],
  });
  assertEquals(subscribed.data, { topic, items: [{ key: 'order-7' }] });

  const invalid = await runStreamsCommand(cli, {
    command: 'publish',
    values: [topic.name],
    flags: { data: '[]' },
  });
  assertEquals(invalid.code, 1);
  assertStringIncludes(invalid.message ?? '', '--data must be a JSON object');
});

Deno.test('topic walker discovers project producers and schema collections', async () => {
  const root = await Deno.makeTempDir({ prefix: 'streams-topic-walker-' });
  try {
    const directory = `${root}/plugins/billing/streams`;
    await Deno.mkdir(directory, { recursive: true });
    await Deno.writeTextFile(
      `${directory}/schema.ts`,
      `const validator = {};
       export const billingStreamSchema = defineStreamSchema({
         invoice: {
           schema: validator,
           type: 'billing.invoice',
           primaryKey: 'invoiceId',
         },
       });`,
    );
    await Deno.writeTextFile(
      `${directory}/producer.ts`,
      `import { billingStreamSchema } from './schema.ts';
       const STREAM_PATH = '/billing/invoices';
       const PRODUCER_ID = 'billing-service';
       createDurableStream({ streamPath: STREAM_PATH, schema: billingStreamSchema, producerId: PRODUCER_ID });`,
    );

    assertEquals(await discoverStreamTopics(root), [{
      name: '/billing/invoices',
      streamPath: '/billing/invoices',
      producerId: 'billing-service',
      producerFile: 'plugins/billing/streams/producer.ts',
      collections: [{ name: 'invoice', type: 'billing.invoice', primaryKey: 'invoiceId' }],
    }]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test({
  name: 'publish and subscribe commands round-trip against DurableStreamTestServer',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const port = await getAvailablePort();
    const server = new DurableStreamTestServer({ port, host: '127.0.0.1' });
    const baseUrl = await server.start();
    try {
      const cli = new StreamsCli({
        workspaceRoot: () => Deno.cwd(),
        discoverTopics: () => Promise.resolve([topic]),
        publish: publishStreamEvent,
        subscribe: subscribeToStream,
        inspect: inspectDiscoveredTopic,
        clear: clearStream,
        writeArtifacts: () => Promise.resolve([]),
      });
      const id = crypto.randomUUID();
      const published = await runStreamsCommand(cli, {
        command: 'publish',
        values: [topic.name],
        flags: { url: baseUrl, collection: 'order', data: JSON.stringify({ id, status: 'new' }) },
      });
      assertEquals(published.code, 0);

      const subscribed = await runStreamsCommand(cli, {
        command: 'subscribe',
        values: [topic.name],
        flags: { url: baseUrl },
      });
      const items = (subscribed.data as { items: Array<{ key?: string }> }).items;
      assertEquals(items.some((item) => item.key === id), true);

      assertEquals(
        (await runStreamsCommand(cli, {
          command: 'clear',
          values: [topic.name],
          flags: { url: baseUrl },
        })).code,
        0,
      );
    } finally {
      await server.stop();
      Deno.env.delete('DURABLE_STREAMS_URL');
    }
  },
});

Deno.test('streamsCli composition root provides the default CLI instance', () => {
  assertEquals(streamsCli.name, 'streams');
  assertEquals(streamsCli.commands().length, 9);
});

Deno.test('StreamsCli add verbs write schema, producer, and consumer artifacts', async () => {
  const written: string[] = [];
  const cli = new StreamsCli(createServices({
    writeArtifacts: (_root, artifacts) => {
      written.push(...artifacts.map((artifact) => artifact.path));
      return Promise.resolve(artifacts.map((artifact) => artifact.path));
    },
  }));

  assertEquals(
    (await runStreamsCommand(cli, {
      command: 'add-schema',
      values: ['orders'],
      flags: { collection: 'order=order.changed:id' },
    })).code,
    0,
  );
  assertEquals(
    (await runStreamsCommand(cli, {
      command: 'add-producer',
      values: ['orders'],
      flags: { 'stream-path': '/orders/events', 'producer-id': 'orders-service' },
    })).code,
    0,
  );
  assertEquals(
    (await runStreamsCommand(cli, {
      command: 'add-consumer',
      values: ['/orders/events'],
    })).code,
    0,
  );
  assertEquals(written, [
    'streams/orders-schema.ts',
    'streams/orders-producer.ts',
    'streams/events-db.ts',
    'islands/EventsStream.tsx',
    'routes/api/streams/events/seed.ts',
  ]);
});

function createServices(overrides: Partial<StreamsCliServices> = {}): StreamsCliServices {
  return {
    workspaceRoot: () => '/project',
    discoverTopics: () => Promise.resolve([topic]),
    publish: (input) => Promise.resolve(input.value),
    subscribe: () => Promise.resolve([{ key: 'order-7' }]),
    inspect: (value) =>
      inspectStreamTopic({
        target: value.name,
        schema: {} as never,
        streamPath: value.streamPath,
        producerId: value.producerId,
      }),
    clear: () => Promise.resolve(),
    writeArtifacts: (_root, artifacts) =>
      Promise.resolve(artifacts.map((artifact) => artifact.path)),
    ...overrides,
  };
}

async function runStreamsCommand(
  cli: StreamsCli,
  args: PluginCliArgs,
): Promise<PluginCliResult> {
  const command = cli.commands().find((item) => item.name === args.command);
  return command
    ? await command.run(args)
    : { code: 1, message: `Unknown streams command: ${args.command}` };
}
