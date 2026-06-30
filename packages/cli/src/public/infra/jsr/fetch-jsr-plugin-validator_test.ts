import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import { FetchJsrPluginValidator } from './fetch-jsr-plugin-validator.ts';
import type {
  JsrHttpClient,
  JsrHttpResponse,
} from '../../features/plugins/install/jsr-plugin-validator-port.ts';
import { resolvePluginPackageSpec } from '../../features/plugins/install/plugin-package-resolver.ts';

describe('FetchJsrPluginValidator', () => {
  it('returns a validated plugin descriptor for a published NetScript manifest', async () => {
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(validFixtures()));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.descriptor.package.packageSpecifier, '@netscript/plugin-workers');
      assertEquals(result.descriptor.version, '0.0.1-alpha.12');
      assertEquals(result.descriptor.manifest.provider?.kind, 'worker');
      assertEquals(result.descriptor.versionMetadata.files['/scaffold.plugin.json'], 'sha256-good');
      assertEquals(result.descriptor.details.score, 95);
    }
  });

  it('resolves the semver-greatest prerelease when JSR latest is null', async () => {
    const fixtures = validFixtures();
    fixtures.set('https://jsr.io/@netscript/plugin-workers/meta.json', {
      status: 200,
      body: {
        latest: null,
        versions: {
          '0.0.1-alpha.2': {},
          '0.0.1-alpha.9': {},
          '0.0.1-alpha.12': {},
        },
      },
    });
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(fixtures));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.descriptor.version, '0.0.1-alpha.12');
      assertEquals(result.descriptor.manifest.version, '0.0.1-alpha.12');
      assertEquals(result.descriptor.versionMetadata.files['/scaffold.plugin.json'], 'sha256-good');
    }
  });

  it('skips yanked versions when falling back from null latest', async () => {
    const fixtures = validFixtures();
    fixtures.set('https://jsr.io/@netscript/plugin-workers/meta.json', {
      status: 200,
      body: {
        latest: null,
        versions: {
          '0.0.1-alpha.2': {},
          '0.0.1-alpha.9': {},
          '0.0.1-alpha.12': { yanked: true },
        },
      },
    });
    fixtures.set('https://jsr.io/@netscript/plugin-workers/0.0.1-alpha.9_meta.json', {
      status: 200,
      body: {
        exports: {
          '.': './mod.ts',
          './scaffold': './src/scaffold/mod.ts',
        },
        manifest: {
          '/mod.ts': { checksum: 'sha256-mod' },
          '/scaffold.plugin.json': { checksum: 'sha256-alpha9' },
        },
      },
    });
    fixtures.set('https://jsr.io/@netscript/plugin-workers/0.0.1-alpha.9/scaffold.plugin.json', {
      status: 200,
      body: {
        ...validPluginManifest(),
        version: '0.0.1-alpha.9',
      },
    });
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(fixtures));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.descriptor.version, '0.0.1-alpha.9');
      assertEquals(result.descriptor.manifest.version, '0.0.1-alpha.9');
      assertEquals(result.descriptor.versionMetadata.files['/scaffold.plugin.json'], 'sha256-alpha9');
    }
  });

  it('reports invalid metadata when no non-yanked version is installable', async () => {
    const fixtures = validFixtures();
    fixtures.set('https://jsr.io/@netscript/plugin-workers/meta.json', {
      status: 200,
      body: {
        latest: null,
        versions: {
          '0.0.1-alpha.2': { yanked: true },
          '0.0.1-alpha.9': { yanked: true },
        },
      },
    });
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(fixtures));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result, {
      ok: false,
      error: {
        code: 'invalid-metadata',
        message: 'JSR package metadata for @netscript/plugin-workers is invalid.',
      },
    });
  });

  it('reports missing JSR packages as not found', async () => {
    const fixtures = validFixtures();
    fixtures.set('https://jsr.io/@netscript/plugin-workers/meta.json', {
      status: 404,
      body: {},
    });
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(fixtures));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result, {
      ok: false,
      error: {
        code: 'not-found',
        message: 'JSR package @netscript/plugin-workers was not found.',
      },
    });
  });

  it('reports yanked latest versions', async () => {
    const fixtures = validFixtures();
    fixtures.set('https://jsr.io/@netscript/plugin-workers/meta.json', {
      status: 200,
      body: {
        latest: '0.0.1-alpha.12',
        versions: {
          '0.0.1-alpha.12': { yanked: true },
        },
      },
    });
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(fixtures));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result, {
      ok: false,
      error: {
        code: 'version-yanked',
        message: 'JSR package @netscript/plugin-workers@0.0.1-alpha.12 is yanked.',
      },
    });
  });

  it('reports packages that do not publish scaffold.plugin.json', async () => {
    const fixtures = validFixtures();
    fixtures.set('https://jsr.io/@netscript/plugin-workers/0.0.1-alpha.12/scaffold.plugin.json', {
      status: 404,
      body: {},
    });
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(fixtures));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result, {
      ok: false,
      error: {
        code: 'manifest-missing',
        message: '@netscript/plugin-workers does not publish scaffold.plugin.json.',
      },
    });
  });

  it('reports invalid plugin manifests without executing package code', async () => {
    const fixtures = validFixtures();
    fixtures.set('https://jsr.io/@netscript/plugin-workers/0.0.1-alpha.12/scaffold.plugin.json', {
      status: 200,
      body: { schemaVersion: 1, name: '@netscript/plugin-workers' },
    });
    const validator = new FetchJsrPluginValidator(new FixtureHttpClient(fixtures));

    const result = await validator.validate(resolvePluginPackageSpec('workers'));

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.code, 'invalid-manifest');
    }
  });
});

interface FixtureResponse {
  readonly status: number;
  readonly body: unknown;
}

class FixtureHttpClient implements JsrHttpClient {
  constructor(private readonly fixtures: ReadonlyMap<string, FixtureResponse>) {}

  fetch(url: string): Promise<JsrHttpResponse> {
    const fixture = this.fixtures.get(url) ?? { status: 500, body: {} };
    return Promise.resolve({
      status: fixture.status,
      ok: fixture.status >= 200 && fixture.status < 300,
      json: () => Promise.resolve(fixture.body),
    });
  }
}

function validFixtures(): Map<string, FixtureResponse> {
  return new Map([
    [
      'https://jsr.io/@netscript/plugin-workers/meta.json',
      {
        status: 200,
        body: {
          latest: '0.0.1-alpha.12',
          versions: {
            '0.0.1-alpha.12': { yanked: false },
          },
        },
      },
    ],
    [
      'https://jsr.io/@netscript/plugin-workers/0.0.1-alpha.12_meta.json',
      {
        status: 200,
        body: {
          exports: {
            '.': './mod.ts',
            './scaffold': './src/scaffold/mod.ts',
          },
          manifest: {
            '/mod.ts': { checksum: 'sha256-mod' },
            '/scaffold.plugin.json': { checksum: 'sha256-good' },
          },
        },
      },
    ],
    [
      'https://api.jsr.io/scopes/netscript/packages/plugin-workers',
      {
        status: 200,
        body: {
          description: 'Workers plugin',
          githubRepository: { owner: 'rickylabs', name: 'netscript' },
          score: 95,
          runtimeCompat: { deno: true },
        },
      },
    ],
    [
      'https://jsr.io/@netscript/plugin-workers/0.0.1-alpha.12/scaffold.plugin.json',
      {
        status: 200,
        body: validPluginManifest(),
      },
    ],
  ]);
}

function validPluginManifest(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    name: '@netscript/plugin-workers',
    version: '0.0.1-alpha.12',
    displayName: 'Background Worker',
    description: 'NetScript worker plugin.',
    peerDependencies: {
      '@netscript/plugin': '0.0.1-alpha.12',
    },
    capabilities: {
      hasDatabaseMigrations: true,
      hasRoutes: true,
      hasBackgroundWorkers: true,
    },
    scaffolder: {
      export: './scaffold',
      requiredPermissions: {
        net: [],
        read: ['<workspaceRoot>'],
        write: ['<workspaceRoot>'],
      },
    },
    provider: {
      kind: 'worker',
      displayName: 'Background Worker',
      category: 'background-processor',
      portRangeKey: 'INFRA_PLUGIN',
      defaultPermissions: ['--allow-net', '--allow-env', '--allow-read'],
      watchFlag: '--watch',
      defaultEntrypoint: 'bin/combined.ts',
      defaultServiceEntrypoint: 'services/src/main.ts',
      defaultRequiresDb: true,
      defaultRequiresKv: true,
      pluginType: 'background-processor',
      supportsConcurrency: true,
      concurrencyEnvVar: 'WORKER_CONCURRENCY',
      defaultConcurrency: 2,
      defaultTelemetry: true,
      infrastructureRequires: ['kv'],
      infrastructureOptionalDeps: ['db'],
    },
  };
}
