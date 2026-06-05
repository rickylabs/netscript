export type { AspireResource, AspireResourceKind } from './aspire-resource.ts';
export type { ContributionContext } from './contribution-context.ts';
export type {
  CacheSpec,
  ContainerSpec,
  DatabaseSpec,
  DenoBackgroundSpec,
  DenoServiceSpec,
} from './plugin-entry.ts';
export type { EnvSource } from './env-source.ts';
export type { HealthCheckSpec } from './health-check-spec.ts';
export type { ReferenceSpec } from './reference-spec.ts';
export { AspireError, DuplicateContributionError } from './errors.ts';
