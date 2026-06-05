import { PluginContribution } from './plugin-contribution.ts';

/** Base class for migration contribution implementations. */
export abstract class PluginMigrationContribution extends PluginContribution {
  readonly axis = 'migration' as const;
  abstract readonly name: string;
  abstract readonly path: string;
}
