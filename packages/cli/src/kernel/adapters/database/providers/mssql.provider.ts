/**
 * @module infra/database/providers/mssql
 */

import type { DbEngineProvider } from '../../../domain/db-engine.ts';

/** SQL Server provider metadata. */
export const mssqlProvider: DbEngineProvider = Object.freeze({
  engine: 'mssql',
  prismaProvider: 'sqlserver',
  displayName: 'SQL Server',
  dirName: 'mssql',
  aspireMethod: 'addSqlServer',
  supportsContainerMode: true,
  defaultImageTag: '2022-latest',
  capabilities: Object.freeze({
    hasZodGeneration: true,
    hasPrismaFormat: true,
    clientEntrypoint: 'client.server.ts',
  }),
});
