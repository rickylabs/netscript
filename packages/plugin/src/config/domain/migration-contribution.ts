/** Data or schema migration contribution. */
export interface MigrationContribution {
  /** Migration name. */
  readonly name: string;
  /** Path to the migration module or asset. */
  readonly path: string;
}
