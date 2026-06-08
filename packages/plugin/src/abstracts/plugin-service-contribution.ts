import { PluginContribution } from './plugin-contribution.ts';

/** Base class for service contribution implementations. */
export abstract class PluginServiceContribution extends PluginContribution {
  /** Contribution axis for service modules. */
  readonly axis = 'service' as const;
  /** Stable service name registered by the plugin. */
  abstract readonly name: string;
  /** Module entrypoint that exports the service. */
  abstract readonly entrypoint: string;
}
