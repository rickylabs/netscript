import type { AspireResource, ContributionContext } from '../domain/mod.ts';
import { ContributionRegistry } from '../runtime/mod.ts';
import type { AspireNSPluginContribution } from '../runtime/mod.ts';
import type { AspireBuilder } from '../ports/mod.ts';

/** Minimal manifest shape consumed by Aspire composition. */
export interface ComposePluginManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Optional contribution declarations. */
  readonly contributions?: {
    /** Aspire contribution constructor. */
    readonly aspire?: new () => AspireNSPluginContribution;
  };
}

/** Options for composing plugin Aspire contributions into an AppHost builder. */
export interface ComposeAppHostOptions {
  /** Builder receiving resources from plugin contributions. */
  readonly builder: AspireBuilder;
  /** Context passed to each plugin contribution. */
  readonly context: ContributionContext;
  /** Plugin manifests to compose. */
  readonly plugins: readonly ComposePluginManifest[];
}

/** Result of composing an AppHost from plugin Aspire contributions. */
export interface ComposeAppHostResult {
  /** Resources contributed by plugins. */
  readonly resources: readonly AspireResource[];
  /** Registry containing instantiated contributions. */
  readonly registry: ContributionRegistry;
}

/** Compose plugin Aspire contributions into a supplied builder. */
export function composeAppHost(options: ComposeAppHostOptions): ComposeAppHostResult {
  const registry = new ContributionRegistry();
  const resources: AspireResource[] = [];

  for (const plugin of options.plugins) {
    const Contribution = plugin.contributions?.aspire;
    if (!Contribution) {
      continue;
    }
    const contribution = new Contribution();
    registry.register(contribution);
    resources.push(...contribution.contribute(options.builder, options.context));
  }

  return { resources, registry };
}
