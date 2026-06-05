/**
 * @module infra/database/providers/sqlite
 */

import type { DbEngineProvider } from '../../../domain/db-engine.ts';

/** SQLite provider metadata. */
export const sqliteProvider: DbEngineProvider = Object.freeze({
  engine: 'sqlite',
  prismaProvider: 'sqlite',
  displayName: 'SQLite',
  dirName: 'sqlite',
  aspireMethod: 'addConnectionString',
  supportsContainerMode: false,
  defaultImageTag: null,
  capabilities: Object.freeze({
    hasZodGeneration: true,
    hasPrismaFormat: true,
    clientEntrypoint: 'client.server.ts',
  }),
});
