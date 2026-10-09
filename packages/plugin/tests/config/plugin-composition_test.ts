import { assertEquals, assertInstanceOf, assertThrows } from '@std/assert';
import {
  definePlugin,
  mergeContributions,
  type PluginCompositionDiagnostic,
  PluginCompositionError,
  type PluginManifest,
  PluginManifestSchema,
  validatePluginComposition,
} from '../../src/config/mod.ts';
import { PluginValidationError } from '../../src/domain/mod.ts';
import { createPluginHostBootstrap } from '../../src/sdk/mod.ts';
import { createPluginManifestFixture } from '../../src/testing/mod.ts';

function manifest(name: string, overrides: Partial<PluginManifest> = {}): PluginManifest {
  return createPluginManifestFixture({ name, version: '1.0.0', ...overrides });
}

function diagnosticsOf(plugins: readonly PluginManifest[]): PluginCompositionDiagnostic[] {
  const result = validatePluginComposition(plugins);
  if (result.ok) throw new Error('expected the composition to be rejected');
  return [...result.diagnostics];
}

function codesOf(plugins: readonly PluginManifest[]): string[] {
  return diagnosticsOf(plugins).map((diagnostic) => diagnostic.code);
}

const service = (name: string) => ({ name, entrypoint: `./${name}.ts` });

Deno.test('validatePluginComposition accepts a valid composition and merges collection axes', () => {
  const result = validatePluginComposition([
    manifest('@example/a', {
      contributions: { services: [service('a-api')], aspire: './a/aspire.ts' },
    }),
    manifest('@example/b', {
      contributions: { services: [service('b-api')], aspire: './b/aspire.ts' },
    }),
  ]);

  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(result.composition.plugins.map((plugin) => plugin.name), [
    '@example/a',
    '@example/b',
  ]);
  assertEquals(result.composition.contributions.services?.map((entry) => entry.name), [
    'a-api',
    'b-api',
  ]);
  assertEquals(result.composition.contributions.aspire, undefined);
});

Deno.test('duplicate manifest names fail', () => {
  const diagnostics = diagnosticsOf([manifest('@example/a'), manifest('@example/a')]);

  assertEquals(diagnostics, [{
    code: 'duplicate-plugin',
    plugin: '@example/a',
    conflictsWith: '@example/a',
    message: 'Plugin "@example/a" is declared more than once.',
  }]);
});

Deno.test('duplicate identities within one plugin fail on every axis scope', () => {
  const diagnostics = diagnosticsOf([manifest('@example/a', {
    contributions: {
      services: [service('api'), service('api')],
      databaseSchemas: [{ path: './db.prisma' }, { path: './db.prisma' }],
      contractVersions: [{ version: 'v1', loader: './v1.ts' }, {
        version: 'v1',
        loader: './v1b.ts',
      }],
    },
  })]);

  assertEquals(
    diagnostics.map(({ code, axis, identity, conflictsWith }) => ({
      code,
      axis,
      identity,
      conflictsWith,
    })),
    [
      {
        code: 'duplicate-contribution',
        axis: 'services',
        identity: 'api',
        conflictsWith: '@example/a',
      },
      {
        code: 'duplicate-contribution',
        axis: 'databaseSchemas',
        identity: './db.prisma',
        conflictsWith: '@example/a',
      },
      {
        code: 'duplicate-contribution',
        axis: 'contractVersions',
        identity: 'v1',
        conflictsWith: '@example/a',
      },
    ],
  );
});

Deno.test('duplicate identities across plugins fail on root-owned axes', () => {
  const diagnostics = diagnosticsOf([
    manifest('@example/a', {
      contributions: {
        services: [service('api')],
        sdkClients: [sdkClient('@example/shared:bearer')],
        backgroundProcessors: [{ name: 'worker', entrypoint: './a.ts' }],
        streamTopics: [{ name: 'jobs', subject: 'a.jobs' }],
        runtimeConfigTopics: [{ name: 'shared' }],
        e2e: [{ name: 'health', command: 'a' }],
        telemetry: [{ name: 'otel', module: './a.ts' }],
        cli: { doctorChecks: ['auth-backend'] },
      },
    }),
    manifest('@example/b', {
      contributions: {
        services: [service('api')],
        sdkClients: [sdkClient('@example/shared:bearer')],
        backgroundProcessors: [{ name: 'worker', entrypoint: './b.ts' }],
        streamTopics: [{ name: 'jobs', subject: 'b.jobs' }],
        runtimeConfigTopics: [{ name: 'shared' }],
        e2e: [{ name: 'health', command: 'b' }],
        telemetry: [{ name: 'otel', module: './b.ts' }],
        cli: { doctorChecks: ['auth-backend'] },
      },
    }),
  ]);

  assertEquals(
    diagnostics.map(({ code, plugin, axis, conflictsWith }) => [
      code,
      plugin,
      axis,
      conflictsWith,
    ]),
    [
      ['duplicate-contribution', '@example/b', 'services', '@example/a'],
      ['duplicate-contribution', '@example/b', 'sdkClients', '@example/a'],
      ['duplicate-contribution', '@example/b', 'backgroundProcessors', '@example/a'],
      ['duplicate-contribution', '@example/b', 'streamTopics', '@example/a'],
      ['duplicate-contribution', '@example/b', 'runtimeConfigTopics', '@example/a'],
      ['duplicate-contribution', '@example/b', 'e2e', '@example/a'],
      ['duplicate-contribution', '@example/b', 'telemetry', '@example/a'],
      ['duplicate-contribution', '@example/b', 'cli', '@example/a'],
    ],
  );
});

Deno.test('contract versions, schema paths, and migrations stay plugin-scoped', () => {
  const plugin = (name: string) =>
    manifest(name, {
      contributions: {
        contractVersions: [{ version: 'v1', loader: './contracts/v1/mod.ts' }],
        databaseSchemas: [{ path: './database/schema.prisma' }],
        migrations: [{ name: '0001_init', path: './migrations/0001.sql' }],
        aspire: './src/aspire/mod.ts',
        doctor: './src/adapter/plugin.ts',
      },
    });

  assertEquals(validatePluginComposition([plugin('@example/a'), plugin('@example/b')]).ok, true);
});

Deno.test('single-valued axes are a collision when merged, not last-wins', () => {
  const error = assertThrows(
    () => mergeContributions({ aspire: './a/aspire.ts' }, { aspire: './b/aspire.ts' }),
    PluginValidationError,
  );
  assertEquals(error.issues.length, 1);
  assertThrows(
    () => mergeContributions({ doctor: './a/doctor.ts' }, { doctor: './b/doctor.ts' }),
    PluginValidationError,
  );
  assertEquals(mergeContributions({}, { aspire: './b/aspire.ts' }).aspire, './b/aspire.ts');
});

Deno.test('missing contributing dependencies fail; library-only dependencies may be absent', () => {
  const library = definePlugin('@example/core', '1.0.0').build();
  const contributing = manifest('@example/streams', {
    contributions: { services: [service('s')] },
  });

  const diagnostics = diagnosticsOf([
    manifest('@example/workers', { dependencies: { streams: contributing, core: library } }),
  ]);

  assertEquals(diagnostics, [{
    code: 'missing-dependency',
    plugin: '@example/workers',
    identity: '@example/streams',
    message:
      'Plugin "@example/workers" depends on "@example/streams" (alias "streams"), which is not in the composition.',
  }]);
});

Deno.test('dependency versions must satisfy the declared semver range', () => {
  const declared = (version: string) => manifest('@example/streams', { version });
  const composed = (version: string) => manifest('@example/streams', { version });

  assertEquals(
    codesOf([
      manifest('@example/workers', { dependencies: { streams: declared('1.0.0') } }),
      composed('2.0.0'),
    ]),
    ['dependency-version-mismatch'],
  );
  assertEquals(
    codesOf([
      manifest('@example/workers', { dependencies: { streams: declared('1.0.0') } }),
      composed('1.0.1'),
    ]),
    ['dependency-version-mismatch'],
  );
  assertEquals(
    validatePluginComposition([
      manifest('@example/workers', { dependencies: { streams: declared('^1.0.0') } }),
      composed('1.4.2'),
    ]).ok,
    true,
  );
  assertEquals(
    validatePluginComposition([
      manifest('@example/workers', { dependencies: { streams: declared('0.0.8-canary.5') } }),
      composed('0.0.8-canary.5'),
    ]).ok,
    true,
  );
});

Deno.test('invalid dependency ranges and plugin versions fail', () => {
  assertEquals(
    codesOf([
      manifest('@example/workers', {
        dependencies: { streams: manifest('@example/streams', { version: 'latest' }) },
      }),
      manifest('@example/streams'),
    ]),
    ['invalid-version'],
  );
  assertEquals(
    codesOf([
      manifest('@example/workers', {
        dependencies: { streams: manifest('@example/streams', { version: '1.0.0' }) },
      }),
      manifest('@example/streams', { version: 'one' }),
    ]),
    ['invalid-version'],
  );
});

Deno.test('unknown contribution keys fail with the plugin and key named', () => {
  const typo = { servces: [service('api')] } as unknown as PluginManifest['contributions'];

  assertEquals(diagnosticsOf([manifest('@example/a', { contributions: typo })]), [{
    code: 'unknown-contribution-key',
    plugin: '@example/a',
    axis: 'servces',
    message: 'Plugin "@example/a" declares unknown contribution key "servces".',
  }]);
  assertThrows(() =>
    PluginManifestSchema.parse({ name: '@example/a', version: '1.0.0', contributions: typo })
  );
});

Deno.test('malformed contribution values fail', () => {
  const malformed = {
    services: [{ entrypoint: './api.ts' }],
    aspire: 42,
  } as unknown as PluginManifest['contributions'];

  assertEquals(codesOf([manifest('@example/a', { contributions: malformed })]), [
    'invalid-contribution',
    'invalid-contribution',
  ]);
});

Deno.test('validatePluginComposition reports every failure in one pass', () => {
  assertEquals(
    codesOf([
      manifest('@example/a', { contributions: { services: [service('api')] } }),
      manifest('@example/a'),
      manifest('@example/b', {
        contributions: { services: [service('api')] },
        dependencies: {
          c: manifest('@example/c', { contributions: { e2e: [], aspire: './x.ts' } }),
        },
      }),
    ]),
    ['duplicate-plugin', 'duplicate-contribution', 'missing-dependency'],
  );
});

Deno.test('createPluginHostBootstrap throws PluginCompositionError on an invalid composition', () => {
  const error = assertThrows(
    () => createPluginHostBootstrap([manifest('@example/a'), manifest('@example/a')]),
    PluginCompositionError,
  );
  assertInstanceOf(error, PluginValidationError);
  assertEquals(error.diagnostics.map((diagnostic) => diagnostic.code), ['duplicate-plugin']);

  const valid = [manifest('@example/a'), manifest('@example/b')];
  assertEquals(createPluginHostBootstrap(valid).plugins, valid);
});

function sdkClient(id: `${string}:${string}`) {
  return {
    protocol: { family: 'netscript.sdk-client' as const, major: 1 as const },
    id,
    module: '@example/sdk',
    export: 'factory',
    targets: ['server' as const],
  };
}
