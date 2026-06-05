import { PluginContribution } from './plugin-contribution.ts';

/** Base class for background processor contribution implementations. */
export abstract class PluginBackgroundProcessorContribution extends PluginContribution {
  readonly axis = 'background-processor' as const;
  abstract readonly name: string;
  abstract readonly entrypoint: string;
}
