/**
 * @module templates/aspire/helpers/generators-config-infra_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import { generateConfigSchema } from '../generate-config-schema.ts';
import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';
import * as fixtures from './generators-test-support.ts';

describe('generateConfigSchema', () => {
  const emptyOptions = {
    services: {},
    apps: {},
    plugins: {},
    backgroundProcessors: {},
    databases: {},
    caches: {},
    tools: {},
  };

  it('should return a non-empty string', () => {
    const output = generateConfigSchema({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateConfigSchema(emptyOptions);
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'config-schema.ts');
  });

  it('should import zod and NetScriptConfigSchema from _aspire-compat', () => {
    const output = generateConfigSchema(emptyOptions);
    assertStringIncludes(output, "import { z } from 'zod'");
    assertStringIncludes(output, 'NetScriptConfigSchema,');
    assertStringIncludes(output, "from './_aspire-compat.ts'");
  });

  it('should export ProjectConfigSchema and ProjectConfig type', () => {
    const output = generateConfigSchema(emptyOptions);
    assertStringIncludes(
      output,
      'export const ProjectConfigSchema = NetScriptConfigSchema.extend(',
    );
    assertStringIncludes(
      output,
      'export type ProjectConfig = z.infer<typeof ProjectConfigSchema>',
    );
  });

  it('should include section entries as literal keys', () => {
    const output = generateConfigSchema({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE, orders: fixtures.SERVICE_WITH_REFS },
      databases: { main: fixtures.MINIMAL_DATABASE },
    });
    assertStringIncludes(output, 'Services: z.object({');
    assertStringIncludes(output, 'users: ServiceEntrySchema,');
    assertStringIncludes(output, 'orders: ServiceEntrySchema,');
    assertStringIncludes(output, 'Databases: z.object({');
    assertStringIncludes(output, 'main: DatabaseEntrySchema,');
  });

  it('should import entry schemas only for populated sections', () => {
    const output = generateConfigSchema({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
      plugins: { auth: fixtures.MINIMAL_PLUGIN },
    });
    assertStringIncludes(output, 'ServiceEntrySchema,');
    assertStringIncludes(output, 'PluginEntrySchema,');
    // Empty sections should not trigger schema imports
    assert(!output.includes('AppEntrySchema'));
    assert(!output.includes('CacheEntrySchema'));
  });

  it('should quote property keys with special characters', () => {
    const output = generateConfigSchema({
      ...emptyOptions,
      services: { 'workers-api': fixtures.MINIMAL_SERVICE },
    });
    assertStringIncludes(output, "'workers-api': ServiceEntrySchema,");
  });

  it('should handle all empty sections with no z.object blocks', () => {
    const output = generateConfigSchema(emptyOptions);
    assert(!output.includes('Services: z.object('));
    assert(!output.includes('Apps: z.object('));
    assert(!output.includes('Plugins: z.object('));
    assert(!output.includes('Databases: z.object('));
    assert(!output.includes('Cache: z.object('));
    assert(!output.includes('Tools: z.object('));
    // Should still have the extend wrapper
    assertStringIncludes(output, 'NetScriptConfigSchema.extend(');
  });
});
// generateRegisterInfrastructure
// --------------------------------------------------------------------------

describe('generateRegisterInfrastructure', () => {
  const emptyOptions = { databases: {}, caches: {} };

  it('should return a non-empty string', () => {
    const output = generateRegisterInfrastructure({
      databases: { main: fixtures.MINIMAL_DATABASE },
      caches: {},
    });
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateRegisterInfrastructure(emptyOptions);
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'register-infrastructure.ts');
  });

  it('should export registerInfrastructure async function', () => {
    const output = generateRegisterInfrastructure(emptyOptions);
    assertStringIncludes(output, 'export async function registerInfrastructure(');
  });

  it('should export InfrastructureContext interface', () => {
    const output = generateRegisterInfrastructure(emptyOptions);
    assertStringIncludes(output, 'export interface InfrastructureContext');
    assertStringIncludes(output, 'type AspireResource = Parameters<');
    assertStringIncludes(output, 'readonly databases: Map<string, AspireResource>');
    assertStringIncludes(output, 'type CacheResource = AspireResource | CacheContainerResource;');
    assertStringIncludes(output, 'readonly caches: Map<string, CacheResource>');
    assertStringIncludes(output, 'readonly cacheEndpoints: Map<string, EndpointReference>');
    assertStringIncludes(output, 'readonly primaryDatabase: AspireResource | null');
    assertStringIncludes(output, 'readonly primaryCache: CacheResource | null');
    assertStringIncludes(output, 'readonly primaryCacheEndpoint: EndpointReference | null');
  });

  it('should import ContainerLifetime and resolveDataPath', () => {
    const output = generateRegisterInfrastructure(emptyOptions);
    assertStringIncludes(output, "import { ContainerLifetime } from '../.modules/aspire.ts'");
    assertStringIncludes(output, "import { resolveDataPath } from './_aspire-compat.ts'");
  });

  it('should use addPostgres for Postgres Container mode', () => {
    const output = generateRegisterInfrastructure({
      databases: { main: fixtures.MINIMAL_DATABASE },
      caches: {},
    });
    assertStringIncludes(output, "builder.addPostgres('main')");
    assertStringIncludes(output, "databases.set('main',");
    assertStringIncludes(output, '(Postgres, Container)');
  });

  it('should use addConnectionString for External mode', () => {
    const output = generateRegisterInfrastructure({
      databases: { 'ext-db': fixtures.DATABASE_EXTERNAL },
      caches: {},
    });
    assertStringIncludes(output, "builder.addConnectionString('ext-db')");
    assertStringIncludes(output, '(Postgres, External)');
  });

  it('should include withLifetime for persistent databases', () => {
    const output = generateRegisterInfrastructure({
      databases: { main: fixtures.DATABASE_WITH_OPTIONS },
      caches: {},
    });
    assertStringIncludes(output, '.withLifetime(ContainerLifetime.Persistent)');
  });

  it('should include withDataBindMount for databases with DataPath', () => {
    const output = generateRegisterInfrastructure({
      databases: { main: fixtures.DATABASE_WITH_OPTIONS },
      caches: {},
    });
    assertStringIncludes(
      output,
      ".withDataBindMount(resolveDataPath(appHostDir, '.data/postgres', 'main'))",
    );
  });

  it('should include addDatabase when DatabaseName is specified', () => {
    const output = generateRegisterInfrastructure({
      databases: { main: fixtures.DATABASE_WITH_OPTIONS },
      caches: {},
    });
    assertStringIncludes(output, "main_server.addDatabase('app_db')");
  });

  it('should assign server directly when no DatabaseName', () => {
    const output = generateRegisterInfrastructure({
      databases: { main: fixtures.MINIMAL_DATABASE },
      caches: {},
    });
    assertStringIncludes(output, 'const main = main_server;');
  });

  it('should use a Redis-compatible Garnet container for Garnet cache engine', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: { kv: fixtures.MINIMAL_CACHE },
    });
    assertStringIncludes(
      output,
      "builder.addContainer('kv', 'ghcr.io/microsoft/garnet:1.1.1')",
    );
    assertStringIncludes(
      output,
      ".withEndpoint({ name: 'tcp', targetPort: 6379, scheme: 'tcp' })",
    );
    assertStringIncludes(output, "const kv_tcpEndpoint = await kv.getEndpoint('tcp');");
    assertStringIncludes(output, "cacheEndpoints.set('kv', kv_tcpEndpoint);");
    assertStringIncludes(output, "caches.set('kv',");
  });

  it('should resolve primary database from config', () => {
    const output = generateRegisterInfrastructure({
      databases: { main: fixtures.MINIMAL_DATABASE },
      caches: {},
      primaryDatabase: 'main',
    });
    assertStringIncludes(output, "const primaryDatabase = databases.get('main')");
  });

  it('should resolve primary cache from config', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: { kv: fixtures.MINIMAL_CACHE },
      primaryCache: 'kv',
    });
    assertStringIncludes(output, "const primaryCache = caches.get('kv')");
    assertStringIncludes(output, "const primaryCacheEndpoint = cacheEndpoints.get('kv')");
  });

  it('should set null primaries when not configured', () => {
    const output = generateRegisterInfrastructure(emptyOptions);
    assertStringIncludes(output, 'const primaryDatabase = null;');
    assertStringIncludes(output, 'const primaryCache = null;');
    assertStringIncludes(output, 'const primaryCacheEndpoint = null;');
  });

  it('should handle empty databases and caches', () => {
    const output = generateRegisterInfrastructure(emptyOptions);
    assertStringIncludes(output, '// No databases configured');
    assertStringIncludes(output, '// No caches configured');
  });
});
// generateRegisterServices
// --------------------------------------------------------------------------
