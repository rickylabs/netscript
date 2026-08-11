/**
 * @module templates/aspire/helpers/service-environment_test
 *
 * Cross-seam regression guard for #1447: declared resource environment, from the
 * `appsettings.json` a consumer writes through to the generated Aspire
 * registration.
 *
 * The defect crossed two seams, which is why this file starts at the config text
 * rather than at a typed fixture. `Services[].Env` was accepted by the JSON file,
 * silently stripped by the config schema, and therefore invisible to the
 * generator — a service could declare a runtime switch, parse without a warning,
 * and start with different behavior from its declared topology. A generator test
 * built on a typed fixture cannot see that: it would hand the generator a field
 * the parser never produces.
 *
 * The same shape as `pristine-scaffold-ports_test.ts` (#952): parse what a
 * consumer would actually write, then assert on what the generator emits for it.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { parseAppSettings } from '@netscript/aspire/config';
import type { NetScriptConfig } from '@netscript/aspire/types';
import { generateRegisterServices } from '../register/generate-register-services.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

/** The service #1447 reports, and the two entries its topology depends on. */
const MCP_SERVICE = 'excalidraw-mcp';
const MCP_ENV = {
  MCP_TRANSPORT: 'http',
  MCP_SESSION_MODE: 'stateless',
} as const;

/** A second service, so "applies to the correct resource" is falsifiable. */
const REPORTS_SERVICE = 'reports';
const REPORTS_ENV = {
  REPORTS_EXPORT_FORMAT: 'parquet',
  REPORTS_LOCALE: 'fr-CH',
} as const;

/** Keys the generator owns: the collision half of the precedence rule. */
const GENERATED_DATABASE_URL_KEY = 'DATABASE_URL';

/**
 * Writes an `appsettings.json` and parses it through the real parser, so the
 * test exercises the schema seam instead of assuming it.
 */
async function parseFixture(
  services: Record<string, unknown>,
  plugins: Record<string, unknown> = {},
): Promise<NetScriptConfig> {
  const dir = await Deno.makeTempDir({ prefix: 'ns-1447-' });
  try {
    const path = `${dir}/appsettings.json`;
    await Deno.writeTextFile(
      path,
      JSON.stringify({
        NetScript: {
          Name: 'env-fixture',
          Version: '1.0.0',
          PrimaryDatabase: 'main',
          Databases: { main: { Engine: 'Postgres' } },
          Services: services,
          Plugins: plugins,
        },
      }),
    );
    const { config } = await parseAppSettings(path);
    return config;
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** Generates `register-services.mts` for a parsed config. */
function renderServices(config: NetScriptConfig): string {
  return generateRegisterServices({
    services: config.Services,
    version: config.Version,
    denoDefaults: config.Defaults.Deno,
    databaseEngine: 'Postgres',
  });
}

/** Generates `register-plugins.mts` for a parsed config. */
function renderPlugins(config: NetScriptConfig): string {
  return generateRegisterPlugins({
    plugins: config.Plugins,
    version: config.Version,
    denoDefaults: config.Defaults.Deno,
    databaseEngine: 'Postgres',
  });
}

/**
 * Extracts the generated registration block for one resource, so an assertion
 * about "this service" cannot be satisfied by another service's block.
 */
function resourceBlock(source: string, name: string, mapName: string): string {
  const start = source.indexOf(`  // --- ${name} ---`);
  assert(start >= 0, `generator emitted no block for ${name}`);
  const end = source.indexOf(`${mapName}.set('${name}'`, start);
  assert(end > start, `generator emitted no ${mapName}.set(...) for ${name}`);
  return source.slice(start, end);
}

const serviceBlock = (source: string, name: string) => resourceBlock(source, name, 'services');
const pluginBlock = (source: string, name: string) => resourceBlock(source, name, 'plugins');

const service = (extra: Record<string, unknown>) => ({
  Runtime: 'deno',
  Entrypoint: 'src/main.ts',
  ...extra,
});

const plugin = (extra: Record<string, unknown>) => ({
  Runtime: 'deno',
  Entrypoint: 'src/main.ts',
  RequiresDb: true,
  ...extra,
});

describe('declared service environment (#1447)', () => {
  it('should survive config parsing under the deprecated Env alias', async () => {
    const config = await parseFixture({
      [MCP_SERVICE]: service({ Env: MCP_ENV }),
    });

    assertEquals(config.Services[MCP_SERVICE].Env, MCP_ENV);
  });

  it('should apply every declared entry to the correct service resource', async () => {
    const config = await parseFixture({
      [MCP_SERVICE]: service({ Env: MCP_ENV }),
      [REPORTS_SERVICE]: service({ Environment: REPORTS_ENV }),
    });
    const output = renderServices(config);
    const mcp = serviceBlock(output, MCP_SERVICE);
    const reports = serviceBlock(output, REPORTS_SERVICE);

    for (const [key, value] of Object.entries(MCP_ENV)) {
      assertStringIncludes(mcp, key);
      assertStringIncludes(mcp, value);
      assert(!reports.includes(key), `${key} leaked into the ${REPORTS_SERVICE} resource`);
    }
    for (const [key, value] of Object.entries(REPORTS_ENV)) {
      assertStringIncludes(reports, key);
      assertStringIncludes(reports, value);
      assert(!mcp.includes(key), `${key} leaked into the ${MCP_SERVICE} resource`);
    }
  });

  it('should apply the declared entries through withEnvironment', async () => {
    const config = await parseFixture({ [MCP_SERVICE]: service({ Env: MCP_ENV }) });
    const block = serviceBlock(renderServices(config), MCP_SERVICE);

    assertStringIncludes(block, JSON.stringify(MCP_ENV));
    assertStringIncludes(block, 'await resource.withEnvironment(key, value);');
  });

  it('should let generated telemetry and database values win a declared collision', async () => {
    const config = await parseFixture({
      [MCP_SERVICE]: service({
        Env: { ...MCP_ENV, [GENERATED_DATABASE_URL_KEY]: 'postgres://stale/db' },
      }),
    });
    const block = serviceBlock(renderServices(config), MCP_SERVICE);

    const declared = block.indexOf('postgres://stale/db');
    const otel = block.indexOf('buildOtelEnvVars(');
    const database = block.indexOf(`withEnvironment('${GENERATED_DATABASE_URL_KEY}'`);

    assert(declared >= 0, 'declared environment was not emitted at all');
    assert(otel >= 0, 'generated OTEL block is missing');
    assert(database >= 0, 'generated DATABASE_URL assignment is missing');
    assert(
      declared < otel,
      'declared environment must be applied before generated telemetry so the generated value wins',
    );
    assert(
      declared < database,
      'declared environment must be applied before the generated DATABASE_URL so the generated value wins',
    );
  });

  it('should prefer Environment over the deprecated Env alias', async () => {
    const config = await parseFixture({
      [MCP_SERVICE]: service({
        Environment: { MCP_TRANSPORT: 'http' },
        Env: { MCP_TRANSPORT: 'stdio' },
      }),
    });
    const block = serviceBlock(renderServices(config), MCP_SERVICE);

    assertStringIncludes(block, '{"MCP_TRANSPORT":"http"}');
    assert(!block.includes('stdio'), 'the deprecated alias must not win over Environment');
  });

  it('should emit nothing extra for a service that declares no environment', async () => {
    const config = await parseFixture({ [MCP_SERVICE]: service({}) });
    const block = serviceBlock(renderServices(config), MCP_SERVICE);

    assert(
      !block.includes('configuredEnvironment'),
      'a service with no declared environment must not emit an environment binding',
    );
  });

  it('should regenerate byte-identical output', async () => {
    const config = await parseFixture({
      [MCP_SERVICE]: service({ Env: MCP_ENV }),
      [REPORTS_SERVICE]: service({ Environment: REPORTS_ENV }),
    });

    assertEquals(renderServices(config), renderServices(config));
  });
});

describe('declared plugin environment parity (#1447)', () => {
  it('should apply the declared entries to plugin resources the same way', async () => {
    const config = await parseFixture({}, {
      'excalidraw-plugin': plugin({ Environment: MCP_ENV }),
    });
    const block = pluginBlock(renderPlugins(config), 'excalidraw-plugin');

    assertStringIncludes(block, JSON.stringify(MCP_ENV));
    assertStringIncludes(block, 'await resource.withEnvironment(key, value);');
  });

  it('should read the deprecated Env alias on plugin entries too', async () => {
    const config = await parseFixture({}, {
      'excalidraw-plugin': plugin({ Env: MCP_ENV }),
    });
    const block = pluginBlock(renderPlugins(config), 'excalidraw-plugin');

    assertStringIncludes(block, JSON.stringify(MCP_ENV));
  });

  it('should place declared entries before generated values on plugins as well', async () => {
    const config = await parseFixture({}, {
      'excalidraw-plugin': plugin({
        Env: { ...MCP_ENV, [GENERATED_DATABASE_URL_KEY]: 'postgres://stale/db' },
      }),
    });
    const block = pluginBlock(renderPlugins(config), 'excalidraw-plugin');

    const declared = block.indexOf('postgres://stale/db');
    const database = block.indexOf(`withEnvironment('${GENERATED_DATABASE_URL_KEY}'`);

    assert(declared >= 0, 'declared plugin environment was not emitted');
    assert(database >= 0, 'generated plugin DATABASE_URL assignment is missing');
    assert(declared < database, 'generated values must win a declared collision on plugins too');
  });
});
