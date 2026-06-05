import { PluginContribution } from './plugin-contribution.ts';

/** Base class for end-to-end contribution implementations. */
export abstract class PluginE2eContribution extends PluginContribution {
  readonly axis = 'e2e' as const;
  abstract readonly name: string;
  abstract readonly command: string;
}
