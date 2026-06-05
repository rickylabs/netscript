import { PluginContribution } from './plugin-contribution.ts';

/** Base class for database schema contribution implementations. */
export abstract class PluginDbSchemaContribution extends PluginContribution {
  readonly axis = 'database-schema' as const;
  abstract readonly path: string;
  abstract readonly engine?: 'postgres' | 'mysql' | 'mssql' | 'sqlite';
}
