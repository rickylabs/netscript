import { assertEquals } from 'jsr:@std/assert@^1';
import {
  type PluginExpectations,
  type VerifiablePluginManifest,
  verifyPlugin,
} from '../../src/diagnostics/mod.ts';

function noop(): void {}

const fullManifest: VerifiablePluginManifest & { readonly defineTopic: () => void } = {
  name: '@example/plugin-full',
  version: '1.2.3',
  dependencies: { streams: { version: '1.0.0' } },
  contributions: {
    services: [{ name: 'example-api', entrypoint: './services/src/main.ts', port: 4000 }],
    backgroundProcessors: [{ name: 'example-worker' }],
    streamTopics: [{ name: 'example.jobs' }],
    telemetry: [{ name: 'example' }],
    runtimeConfigTopics: [{ name: 'example', schemaPath: './runtime/example.schema.json' }],
    databaseSchemas: [{ path: './database/example.prisma', engine: 'postgres' }],
    contractVersions: [{ version: 'v1', loader: './contracts/v1/mod.ts' }],
    e2e: [{ name: 'example-health', command: 'deno task example:e2e' }],
    aspire: './src/aspire/mod.ts',
  },
  defineTopic: noop,
};

const fullExpectations: PluginExpectations = {
  name: '@example/plugin-full',
  version: '1.2.3',
  dependencies: [{ alias: 'streams', message: 'expected streams plugin dependency' }],
  services: [{
    name: 'example-api',
    entrypoint: './services/src/main.ts',
    port: 4000,
    message: 'expected the example-api service contribution',
  }],
  backgroundProcessors: [{
    name: 'example-worker',
    message: 'expected example-worker background processor contribution',
  }],
  streamTopics: [{
    name: 'example.jobs',
    message: 'expected example.jobs stream topic contribution',
  }],
  telemetry: [{ name: 'example', message: 'expected a example telemetry contribution' }],
  runtimeConfigTopics: [{
    name: 'example',
    schemaPath: './runtime/example.schema.json',
    message: 'expected the example runtime config topic contribution',
  }],
  databaseSchemas: [{
    path: './database/example.prisma',
    engine: 'postgres',
    message: 'expected the example database schema contribution',
  }],
  contractVersions: [{
    version: 'v1',
    loader: './contracts/v1/mod.ts',
    message: 'expected the v1 contract contribution',
  }],
  e2e: [{
    name: 'example-health',
    command: 'deno task example:e2e',
    message: 'expected the example-health E2E contribution',
  }],
  aspire: {
    module: './src/aspire/mod.ts',
    message: 'expected the example Aspire contribution module',
  },
  helpers: [{ key: 'defineTopic', message: 'expected defineTopic helper' }],
};

Deno.test('verifyPlugin passes when the manifest satisfies every expectation', () => {
  const result = verifyPlugin(fullManifest, fullExpectations);
  assertEquals(result.ok, true);
  assertEquals(result.findings, []);
  assertEquals(result.inspection.target, '@example/plugin-full');
  assertEquals(result.inspection.details.kind, 'manifest');
});

Deno.test('verifyPlugin attaches the inspection report even when checks fail', () => {
  const result = verifyPlugin({ name: 'mismatch' }, { name: '@example/plugin-full' });
  assertEquals(result.ok, false);
  assertEquals(result.inspection.target, 'mismatch');
});

Deno.test('verifyPlugin reports a name mismatch', () => {
  const result = verifyPlugin({ ...fullManifest, name: 'wrong' }, fullExpectations);
  assertEquals(result.ok, false);
  assertEquals(
    result.findings.includes('expected plugin name @example/plugin-full, got wrong'),
    true,
  );
});

Deno.test('verifyPlugin reports a version mismatch with both versions', () => {
  const result = verifyPlugin({ ...fullManifest, version: '9.9.9' }, fullExpectations);
  assertEquals(result.ok, false);
  assertEquals(result.findings.includes('expected version 1.2.3, got 9.9.9'), true);
});

Deno.test('verifyPlugin skips the version check when no version is expected', () => {
  const { version: _version, ...expectations } = fullExpectations;
  const result = verifyPlugin({ ...fullManifest, version: '9.9.9' }, expectations);
  assertEquals(result.ok, true);
});

Deno.test('verifyPlugin reports a missing dependency', () => {
  const result = verifyPlugin({ ...fullManifest, dependencies: {} }, fullExpectations);
  assertEquals(result.findings, ['expected streams plugin dependency']);
  assertEquals(result.ok, false);
});

Deno.test('verifyPlugin reports a missing service contribution', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: { ...fullManifest.contributions, services: [{ name: 'other' }] },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected the example-api service contribution']);
});

Deno.test('verifyPlugin reports a service entrypoint/port mismatch', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: {
      ...fullManifest.contributions,
      services: [{ name: 'example-api', entrypoint: './wrong.ts', port: 1 }],
    },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected the example-api service contribution']);
});

Deno.test('verifyPlugin reports a missing background processor', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: { ...fullManifest.contributions, backgroundProcessors: [] },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected example-worker background processor contribution']);
});

Deno.test('verifyPlugin reports a missing stream topic', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: { ...fullManifest.contributions, streamTopics: [] },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected example.jobs stream topic contribution']);
});

Deno.test('verifyPlugin reports a missing telemetry contribution', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: { ...fullManifest.contributions, telemetry: [] },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected a example telemetry contribution']);
});

Deno.test('verifyPlugin reports a runtime config topic schemaPath mismatch', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: {
      ...fullManifest.contributions,
      runtimeConfigTopics: [{ name: 'example', schemaPath: './wrong.json' }],
    },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected the example runtime config topic contribution']);
});

Deno.test('verifyPlugin reports a database schema mismatch', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: {
      ...fullManifest.contributions,
      databaseSchemas: [{ path: './database/example.prisma', engine: 'sqlite' }],
    },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected the example database schema contribution']);
});

Deno.test('verifyPlugin reports a contract version mismatch', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: {
      ...fullManifest.contributions,
      contractVersions: [{ version: 'v1', loader: './wrong.ts' }],
    },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected the v1 contract contribution']);
});

Deno.test('verifyPlugin reports an e2e gate command mismatch', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: {
      ...fullManifest.contributions,
      e2e: [{ name: 'example-health', command: 'wrong' }],
    },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected the example-health E2E contribution']);
});

Deno.test('verifyPlugin reports an aspire module mismatch', () => {
  const manifest: VerifiablePluginManifest = {
    ...fullManifest,
    contributions: { ...fullManifest.contributions, aspire: './wrong/mod.ts' },
  };
  const result = verifyPlugin(manifest, fullExpectations);
  assertEquals(result.findings, ['expected the example Aspire contribution module']);
});

Deno.test('verifyPlugin reports a missing helper', () => {
  const withoutHelper: VerifiablePluginManifest = {
    name: fullManifest.name,
    version: fullManifest.version,
    dependencies: fullManifest.dependencies,
    contributions: fullManifest.contributions,
  };
  const result = verifyPlugin(withoutHelper, fullExpectations);
  assertEquals(result.findings, ['expected defineTopic helper']);
});

Deno.test('verifyPlugin accumulates findings across multiple failing axes', () => {
  const result = verifyPlugin({ name: 'wrong', version: 'bad' }, fullExpectations);
  assertEquals(result.ok, false);
  // name + version + every present axis expectation fails.
  assertEquals(result.findings.length > 5, true);
  assertEquals(result.findings[0], 'expected plugin name @example/plugin-full, got wrong');
  assertEquals(result.findings[1], 'expected version 1.2.3, got bad');
});
