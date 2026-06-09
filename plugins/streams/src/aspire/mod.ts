/**
 * @module @netscript/plugin-streams/aspire
 *
 * Aspire contribution entrypoint for the streams plugin.
 */

export { StreamsAspireContribution } from './streams-contribution.ts';
export type {
  AspireBuilder,
  AspireNSPluginContribution,
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
