import { PluginContribution } from './plugin-contribution.ts';

/** Base class for Aspire contribution implementations. */
export abstract class PluginAspireContribution extends PluginContribution {
  readonly axis = 'aspire' as const;
  abstract readonly modulePath: string;
}
