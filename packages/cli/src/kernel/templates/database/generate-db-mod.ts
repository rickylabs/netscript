/**
 * @module templates/database/generate-db-mod
 */

import type { DbEngineProvider } from '../../domain/db-engine.ts';

/**
 * Generate the `database/mod.ts` facade for the active engine.
 *
 * @param provider - Engine provider metadata.
 * @returns TypeScript source with trailing newline.
 */
export function generateDatabaseFacadeMod(provider: DbEngineProvider): string {
  return `/**
 * Database facade for the scaffolded NetScript workspace.
 *
 * @module
 */

export * from './${provider.dirName}/mod.ts';
export { default } from './${provider.dirName}/mod.ts';
`;
}
