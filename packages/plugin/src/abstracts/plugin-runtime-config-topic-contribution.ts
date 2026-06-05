import { PluginContribution } from './plugin-contribution.ts';

/** Base class for runtime config topic contribution implementations. */
export abstract class PluginRuntimeConfigTopicContribution extends PluginContribution {
  readonly axis = 'runtime-config-topic' as const;
  abstract readonly name: string;
  abstract readonly schemaPath?: string;
}
