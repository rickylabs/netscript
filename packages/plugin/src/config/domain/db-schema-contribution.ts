/** Database schema file contributed by a plugin. */
export interface DbSchemaContribution {
  /** Path to the contributed schema file. */
  readonly path: string;
  /** Database engine targeted by the schema. */
  readonly engine?: 'postgres' | 'mysql' | 'mssql' | 'sqlite';
}
