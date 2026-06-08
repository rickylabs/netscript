import { PluginContribution } from './plugin-contribution.ts';

/** Base class for end-to-end contribution implementations. */
export abstract class PluginE2eContribution extends PluginContribution {
  /** Contribution axis for end-to-end gates. */
  readonly axis = 'e2e' as const;
  /** Stable gate name exposed by the plugin. */
  abstract readonly name: string;
  /** Command that runs the contributed end-to-end gate. */
  abstract readonly command: string;
}
