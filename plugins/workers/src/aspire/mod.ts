/**
 * @module @netscript/plugin-workers/aspire
 *
 * Aspire contribution entrypoint for the workers plugin.
 */

export { WorkersAspireContribution } from './workers-contribution.ts';
export { AspireNSPluginContribution } from '@netscript/aspire';
export type {
  AspireBuilder,
  AspireResource,
  AspireResourceKind,
  CacheSpec,
  ContainerSpec,
  ContributionContext,
  DatabaseSpec,
  DenoBackgroundSpec,
  DenoServiceSpec,
  EnvSource,
  HealthCheckSpec,
} from '@netscript/aspire';
