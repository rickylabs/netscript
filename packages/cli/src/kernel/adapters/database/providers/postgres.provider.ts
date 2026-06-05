/**
 * @module infra/database/providers/postgres
 */

import type { DbEngineProvider } from '../../../domain/db-engine.ts';

/** PostgreSQL provider metadata. */
export const postgresProvider: DbEngineProvider = Object.freeze({
  engine: 'postgres',
  prismaProvider: 'postgresql',
  displayName: 'PostgreSQL',
  dirName: 'postgres',
  aspireMethod: 'addPostgres',
  supportsContainerMode: true,
  defaultImageTag: '17',
  capabilities: Object.freeze({
    hasZodGeneration: true,
    hasPrismaFormat: true,
    clientEntrypoint: 'client.server.ts',
  }),
});
