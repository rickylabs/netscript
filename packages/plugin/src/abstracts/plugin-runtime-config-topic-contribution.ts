import { PluginContribution } from './plugin-contribution.ts';

/** Base class for runtime config topic contribution implementations. */
export abstract class PluginRuntimeConfigTopicContribution extends PluginContribution {
  /** Contribution axis for runtime configuration topics. */
  readonly axis = 'runtime-config-topic' as const;
  /** Runtime configuration topic name. */
  abstract readonly name: string;
  /** Optional schema module path for validating the topic. */
  abstract readonly schemaPath?: string;
}
