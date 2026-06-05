/**
 * @module templates/database/generate-engine-mod
 */

import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import type { DbEngineProvider } from '../../domain/db-engine.ts';
import {
  readTemplateAssetSync,
  renderTemplateAssetSync,
} from '../../adapters/templates/template-asset.ts';

/** Options for generating an engine module. */
export interface EngineModOptions {
  /** Config key under `NetScript.Databases`. */
  readonly configKey: string;
}

/**
 * Generate `database/<engine>/mod.ts` for an engine workspace.
 *
 * @param provider - Engine provider metadata.
 * @param options - Config-key options.
 * @returns TypeScript source with trailing newline.
 */
export function generateEngineMod(
  provider: DbEngineProvider,
  options: EngineModOptions,
): string {
  const clientType = `${toPascalIdentifier(provider.engine)}Client`;
  const getterName = `get${toPascalIdentifier(provider.engine)}`;
  const envPrefix = toEnvPrefix(options.configKey);
  const adapterImport = buildAdapterImport(provider);
  const adapterFactory = buildAdapterFactory(provider, envPrefix);
  const connectionHelpers = buildConnectionHelpers();
  const healthQuery = provider.engine === 'sqlite' ? 'SELECT 1' : 'SELECT 1';
  const clientEntry = provider.capabilities.clientEntrypoint;

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedDatabaseGenerateEngineMod1, {
    __slot0__: String(provider.displayName),
    __slot1__: String(adapterImport),
    __slot2__: String(clientType),
    __slot3__: String(clientEntry),
    __slot4__: String(clientType),
    __slot5__: String(clientType),
    __slot6__: String(adapterFactory),
    __slot7__: String(provider.displayName),
    __slot8__: String(getterName),
    __slot9__: String(clientType),
    __slot10__: String(provider.engine),
    __slot11__: String(clientType),
    __slot12__: String(clientType),
    __slot13__: String(clientType),
    __slot14__: String(healthQuery),
    __slot15__: String(provider.engine),
    __slot16__: String(provider.engine),
    __slot17__: String(connectionHelpers),
    __slot18__: String(clientEntry),
    __slot19__: String(provider.engine),
    __slot20__: String(clientType),
    __slot21__: String(clientType),
    __slot22__: String(clientType),
  });
}

function buildAdapterImport(provider: DbEngineProvider): string {
  if (provider.engine === 'postgres') {
    return "import { PrismaPg } from '@prisma/adapter-pg';";
  }
  if (provider.engine === 'mysql') {
    return "import { PrismaMySql } from '@netscript/prisma-adapter-mysql';";
  }
  if (provider.engine === 'mssql') {
    return "import { PrismaMssql } from '@prisma/adapter-mssql';";
  }
  return '';
}

function buildAdapterFactory(provider: DbEngineProvider, envPrefix: string): string {
  if (provider.engine === 'postgres') {
    return `    const connectionString = resolveConnectionString('postgres', '${envPrefix}_URI');
    if (!connectionString) {
      throw new Error('${provider.displayName} connection string not found.');
    }
    Deno.env.set('${envPrefix}_URI', connectionString);
    Deno.env.set('DATABASE_URL', connectionString);
    client = new ${toPascalIdentifier(provider.engine)}Client({
      adapter: new PrismaPg({ connectionString }),
    });`;
  }
  if (provider.engine === 'mssql') {
    return `    const connectionString = resolveConnectionString('mssql', '${envPrefix}_URI');
    if (!connectionString) {
      throw new Error('${provider.displayName} connection string not found.');
    }
    Deno.env.set('${envPrefix}_URI', connectionString);
    Deno.env.set('DATABASE_URL', connectionString);
    client = new ${toPascalIdentifier(provider.engine)}Client({
      adapter: new PrismaMssql(connectionString),
    });`;
  }
  if (provider.engine === 'mysql') {
    return `    const connectionString = resolveConnectionString('mysql', '${envPrefix}_URI');
    if (!connectionString) {
      throw new Error('${provider.displayName} connection string not found.');
    }
    Deno.env.set('${envPrefix}_URI', connectionString);
    Deno.env.set('DATABASE_URL', connectionString);
    const url = new URL(connectionString);
    const adapter = new PrismaMySql({
      hostname: url.hostname || 'localhost',
      port: url.port ? parseInt(url.port, 10) : 3306,
      db: url.pathname.slice(1) || 'mysql',
      username: decodeURIComponent(url.username) || 'root',
      password: url.password ? decodeURIComponent(url.password) : undefined,
    });
    client = new ${toPascalIdentifier(provider.engine)}Client({ adapter });`;
  }
  return `    const connectionString = resolveConnectionString('${provider.engine}', '${envPrefix}_URI');
    if (connectionString) {
      Deno.env.set('${envPrefix}_URI', connectionString);
      Deno.env.set('DATABASE_URL', connectionString);
    }
    client = new ${toPascalIdentifier(provider.engine)}Client();`;
}

function buildConnectionHelpers(): string {
  return readTemplateAssetSync(TEMPLATE_KEYS.databaseConnectionHelpers);
}

function toPascalIdentifier(value: string): string {
  if (value === 'mssql') return 'Mssql';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toEnvPrefix(configKey: string): string {
  return configKey.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toUpperCase();
}
