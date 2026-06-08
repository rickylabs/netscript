import type { ContributionAxis } from '../domain/mod.ts';

/** Base class for plugin contribution extension axes. */
export abstract class PluginContribution {
  /** Contribution axis implemented by the concrete contribution. */
  abstract readonly axis: ContributionAxis;
}
