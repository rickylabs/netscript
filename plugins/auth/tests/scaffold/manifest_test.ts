import { assert, assertEquals } from 'jsr:@std/assert@^1';

const pluginRoot = new URL('../../', import.meta.url);
const manifestUrl = new URL('scaffold.plugin.json', pluginRoot);
const prismaUrl = new URL('database/auth.prisma', pluginRoot);

const requiredProviderFields = {
  kind: 'string',
  displayName: 'string',
  category: 'string',
  portRangeKey: 'string',
  defaultPermissions: 'array',
  watchFlag: 'string',
  defaultEntrypoint: 'string',
  defaultServiceEntrypoint: 'string',
  defaultRequiresDb: 'boolean',
  defaultRequiresKv: 'boolean',
  pluginType: 'string',
  supportsConcurrency: 'boolean',
  concurrencyEnvVar: 'null',
  defaultConcurrency: 'null',
  defaultTelemetry: 'boolean',
  infrastructureRequires: 'array',
  infrastructureOptionalDeps: 'array',
} as const;

type Manifest = {
  provider: Record<string, unknown>;
  officialSource: Record<string, unknown>;
};

Deno.test('auth scaffold manifest satisfies plugin kind provider contract', async () => {
  const manifest = JSON.parse(await Deno.readTextFile(manifestUrl)) as Manifest;
  const provider = manifest.provider;

  assertEquals(provider.kind, 'auth');
  assertEquals(provider.category, 'plugin');
  assertEquals(provider.defaultServiceEntrypoint, 'services/src/main.ts');

  for (const [field, expectedType] of Object.entries(requiredProviderFields)) {
    assert(field in provider, `missing provider.${field}`);
    const value = provider[field];
    if (expectedType === 'array') {
      assert(Array.isArray(value), `provider.${field} must be an array`);
    } else if (expectedType === 'null') {
      assertEquals(value, null, `provider.${field} must be null`);
    } else {
      assertEquals(typeof value, expectedType, `provider.${field} type`);
    }
  }
});

Deno.test('auth official source and database contribution are discoverable', async () => {
  const manifest = JSON.parse(await Deno.readTextFile(manifestUrl)) as Manifest;
  const provider = manifest.provider;
  const officialSource = manifest.officialSource;

  assertEquals(officialSource.canonicalName, 'auth');
  assertEquals(officialSource.serviceEntrypoint, provider.defaultServiceEntrypoint);

  const prisma = await Deno.readTextFile(prismaUrl);
  for (const model of ['User', 'Session', 'Account', 'Verification']) {
    assert(prisma.includes(`model ${model}`), `missing model ${model}`);
  }
});
