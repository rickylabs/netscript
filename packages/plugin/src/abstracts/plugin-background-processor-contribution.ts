import { PluginContribution } from './plugin-contribution.ts';

/** Base class for background processor contribution implementations. */
export abstract class PluginBackgroundProcessorContribution extends PluginContribution {
  /** Contribution axis for background processors. */
  readonly axis = 'background-processor' as const;
  /** Stable processor name registered by the plugin. */
  abstract readonly name: string;
  /** Module entrypoint that starts or defines the processor. */
  abstract readonly entrypoint: string;
}
