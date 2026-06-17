import { PluginContribution } from './plugin-contribution.ts';

/** Base class for Aspire contribution implementations. */
export abstract class PluginAspireContribution extends PluginContribution {
  /** Contribution axis for Aspire host modules. */
  readonly axis = 'aspire' as const;
  /** Module path that exports the Aspire contribution. */
  abstract readonly modulePath: string;
}
