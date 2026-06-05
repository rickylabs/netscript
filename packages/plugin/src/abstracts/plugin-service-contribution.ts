import { PluginContribution } from './plugin-contribution.ts';

/** Base class for service contribution implementations. */
export abstract class PluginServiceContribution extends PluginContribution {
  readonly axis = 'service' as const;
  abstract readonly name: string;
  abstract readonly entrypoint: string;
}
