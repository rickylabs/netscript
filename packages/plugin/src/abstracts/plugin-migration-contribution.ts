import { PluginContribution } from './plugin-contribution.ts';

/** Base class for migration contribution implementations. */
export abstract class PluginMigrationContribution extends PluginContribution {
  /** Contribution axis for migration modules. */
  readonly axis = 'migration' as const;
  /** Stable migration name exposed by the plugin. */
  abstract readonly name: string;
  /** Path to the migration module or artifact. */
  abstract readonly path: string;
}
