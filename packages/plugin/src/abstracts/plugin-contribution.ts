import type { ContributionAxis } from '../domain/mod.ts';

/** Base class for plugin contribution extension axes. */
export abstract class PluginContribution {
  abstract readonly axis: ContributionAxis;
}
