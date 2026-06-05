/**
 * @module infra/database/providers/mysql
 */

import type { DbEngineProvider } from '../../../domain/db-engine.ts';

/** MySQL provider metadata. */
export const mysqlProvider: DbEngineProvider = Object.freeze({
  engine: 'mysql',
  prismaProvider: 'mysql',
  displayName: 'MySQL',
  dirName: 'mysql',
  aspireMethod: 'addMySql',
  supportsContainerMode: true,
  defaultImageTag: '8.4',
  capabilities: Object.freeze({
    hasZodGeneration: true,
    hasPrismaFormat: true,
    clientEntrypoint: 'client.server.ts',
  }),
});
