import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { streamsAdapterPlugin } from '../plugin.ts';
import { DEFAULT_STREAM_INPUT, streamScaffolder } from './mod.ts';
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
