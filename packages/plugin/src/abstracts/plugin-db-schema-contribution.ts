import { PluginContribution } from './plugin-contribution.ts';

/** Base class for database schema contribution implementations. */
export abstract class PluginDbSchemaContribution extends PluginContribution {
  /** Contribution axis for database schemas. */
  readonly axis = 'database-schema' as const;
  /** Path to the contributed schema file. */
  abstract readonly path: string;
  /** Optional database engine the schema targets. */
  abstract readonly engine?: 'postgres' | 'mysql' | 'mssql' | 'sqlite';
}
