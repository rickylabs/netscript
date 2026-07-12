import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { streamsAdapterPlugin } from '../plugin.ts';
import {
  DEFAULT_STREAM_INPUT,
  streamConsumerScaffolder,
  streamProducerScaffolder,
  streamScaffolder,
  streamSchemaScaffolder,
} from './mod.ts';
import { writeStreamArtifacts } from '../../cli/adapters/artifact-writer.ts';
import { discoverStreamTopics } from '../../cli/adapters/topic-walker.ts';
import { streamDefinitionStub } from './stream/stream.stub.ts';

const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'contracts/',
  'src/runtime/',
  'src/aspire/',
  'bin/',
  'scaffold.plugin.json',
  'deno.json',
] as const;

Deno.test('streams install starter stream is byte-identical to add stream default emission', () => {
  const installStream = collectInstallArtifacts(streamsAdapterPlugin).find((artifact) =>
    artifact.path === 'streams/notifications-stream.ts'
  );
  const addStream = streamScaffolder.emit(DEFAULT_STREAM_INPUT)[0];

  assertEquals(installStream?.path, addStream.path);
  assertEquals(installStream ? artifactText(installStream) : undefined, artifactText(addStream));
});

Deno.test('streams add stream emits the same shape at the user-named path', () => {
  const artifacts = streamScaffolder.emit({
    id: 'invoice-events',
    eventType: 'invoice.events',
    streamPath: '/v1/streams/invoices/events',
    producerId: 'invoice-events-producer',
  });

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'streams/invoice-events-stream.ts',
  ]);
  assertStringIncludes(artifactText(artifacts[0]), 'InvoiceEventsStreamDefinition');
  assertStringIncludes(artifactText(artifacts[0]), 'invoiceEventsStreamSchema');
  assertStringIncludes(artifactText(artifacts[0]), 'invoiceEventsStream');
  assertStringIncludes(artifactText(artifacts[0]), "'/v1/streams/invoices/events'");
});

Deno.test('streams install emits only userland glue under streams', () => {
  const artifacts = collectInstallArtifacts(streamsAdapterPlugin);

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'streams/notifications-stream.ts',
    'streams/mod.ts',
  ]);
  for (const artifact of artifacts) {
    assertEquals(artifact.path.startsWith('streams/'), true);
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assertEquals(
        artifact.path.includes(forbidden),
        false,
        `artifact ${artifact.path} must not contain ${forbidden}`,
      );
    }
  }
});

Deno.test('streams resource token map rejects misspelled tokens at compile time', () => {
  // @ts-expect-error STREAM_DEFINITION is required by streamDefinitionStub.
  substituteTokens(streamDefinitionStub, {
    EVENT_TYPE: 'broken.event',
    PRODUCER_EXPORT: 'brokenStream',
    PRODUCER_ID: 'broken-producer',
    SCHEMA_EXPORT: 'brokenStreamSchema',
    STREAM_PATH: '/broken',
  });
  assertEquals(true, true);
});

Deno.test('schema and producer scaffolders emit discoverable compiling source shapes', () => {
  const schema = streamSchemaScaffolder.emit({
    name: 'invoice-events',
    collections: [{ name: 'invoice', type: 'invoice.changed', primaryKey: 'invoiceId' }],
  });
  const producer = streamProducerScaffolder.emit({
    name: 'invoice-events',
    streamPath: '/billing/invoices',
    producerId: 'billing-service',
  });

  assertEquals(schema.map((artifact) => artifact.path), ['streams/invoice-events-schema.ts']);
  assertStringIncludes(artifactText(schema[0]), 'defineStreamSchema');
  assertStringIncludes(artifactText(schema[0]), 'primaryKey: "invoiceId"');
  assertEquals(producer.map((artifact) => artifact.path), ['streams/invoice-events-producer.ts']);
  assertStringIncludes(artifactText(producer[0]), "const STREAM_PATH = '/billing/invoices'");
  assertStringIncludes(artifactText(producer[0]), "const PRODUCER_ID = 'billing-service'");
});

Deno.test('consumer scaffolder emits StreamDB, query island, and Fresh seed loader', () => {
  const artifacts = streamConsumerScaffolder.emit({ topic: '/billing/invoices' });
  assertEquals(artifacts.map((artifact) => artifact.path), [
    'streams/invoices-db.ts',
    'islands/InvoicesStream.tsx',
    'routes/api/streams/invoices/seed.ts',
  ]);
  assertStringIncludes(artifactText(artifacts[0]), 'createStreamDB');
  assertStringIncludes(artifactText(artifacts[1]), 'useLiveQuery');
  assertStringIncludes(artifactText(artifacts[2]), "import { createDefine } from 'fresh'");
});

Deno.test({
  name: 'generated schema, producer, and consumer modules type-check together',
  sanitizeOps: false,
  async fn() {
    const root = await Deno.makeTempDir({ prefix: 'streams-scaffold-check-' });
    try {
      const artifacts = [
        ...streamSchemaScaffolder.emit({
          name: 'invoices',
          collections: [{ name: 'event', type: 'invoice.changed', primaryKey: 'id' }],
        }),
        ...streamProducerScaffolder.emit({
          name: 'invoices',
          streamPath: '/billing/invoices',
          producerId: 'billing-service',
        }),
        ...streamConsumerScaffolder.emit({ topic: '/billing/invoices' }),
      ];
      const files = await writeStreamArtifacts(root, artifacts);
      assertEquals((await discoverStreamTopics(root)).map((topic) => topic.streamPath), [
        '/billing/invoices',
      ]);
      const repoRoot = new URL('../../../../../', import.meta.url);
      await Deno.writeTextFile(
        `${root}/deno.json`,
        JSON.stringify(
          {
            imports: {
              '@durable-streams/client': 'npm:@durable-streams/client@^0.2.6',
              '@durable-streams/state': 'npm:@durable-streams/state@^0.3.1',
              '@netscript/plugin-streams-core':
                new URL('packages/plugin-streams-core/mod.ts', repoRoot).href,
              '@netscript/telemetry/context':
                new URL('packages/telemetry/context.ts', repoRoot).href,
              '@netscript/telemetry/otel':
                new URL('packages/telemetry/src/adapters/otel/mod.ts', repoRoot).href,
              '@opentelemetry/api': 'npm:@opentelemetry/api@^1.9.1',
              '@tanstack/react-db': 'npm:@tanstack/react-db@^0.1.86',
              fresh: 'jsr:@fresh/core@^2.3.3',
              preact: 'npm:preact@^10.29.2',
              zod: 'jsr:@zod/zod@4.4.3',
            },
            compilerOptions: {
              strict: true,
              jsx: 'precompile',
              jsxImportSource: 'preact',
              lib: ['dom', 'deno.ns', 'deno.unstable'],
            },
          },
          null,
          2,
        ),
      );
      const output = await new Deno.Command(Deno.execPath(), {
        args: [
          'check',
          '--no-lock',
          '--unstable-kv',
          '--config',
          `${root}/deno.json`,
          ...files.map((file) => `${root}/${file}`),
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      if (output.code !== 0) {
        throw new Error(new TextDecoder().decode(output.stderr));
      }
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});
