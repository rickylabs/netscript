/**
 * @module templates/database/generate-prisma-config
 */

import type { DbEngineProvider } from '../../domain/db-engine.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/** Options for generating `prisma.config.ts`. */
export interface PrismaConfigOptions {
  /** Database config key used for Aspire-injected environment variables. */
  readonly configKey: string;
  /** Concrete sqlite database file name when the engine is sqlite. */
  readonly databaseName?: string;
}

/**
 * Generate Prisma v7 configuration for a database workspace.
 *
 * @param provider - Engine provider metadata.
 * @param options - Database config options.
 * @returns TypeScript source with trailing newline.
 */
export function generatePrismaConfig(
  provider: DbEngineProvider,
  options: PrismaConfigOptions,
): string {
  const envKey = toEnvPrefix(options.configKey);
  const fallbackUrl = provider.engine === 'sqlite'
    ? `'file:./${options.databaseName ?? `${options.configKey}.db`}'`
    : "env('DATABASE_URL')";

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedDatabaseGeneratePrismaConfig1, {
    __slot0__: String(provider.displayName),
    __slot1__: String(provider.engine),
    __slot2__: String(envKey),
    __slot3__: String(fallbackUrl),
    __slot4__: String(provider.engine),
  });
}

function toEnvPrefix(configKey: string): string {
  return configKey.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toUpperCase();
}
