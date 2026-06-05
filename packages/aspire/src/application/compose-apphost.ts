import type { AspireResource, ContributionContext } from '../domain/mod.ts';
import { ContributionRegistry } from '../runtime/mod.ts';
import type { AspireNSPluginContribution } from '../runtime/mod.ts';
import type { AspireBuilder } from '../ports/mod.ts';

/** Minimal manifest shape consumed by Aspire composition. */
export interface ComposePluginManifest {
  readonly name: string;
  readonly contributions?: {
    readonly aspire?: new () => AspireNSPluginContribution;
  };
}

/** Options for composing plugin Aspire contributions into an AppHost builder. */
export interface ComposeAppHostOptions {
  readonly builder: AspireBuilder;
  readonly context: ContributionContext;
  readonly plugins: readonly ComposePluginManifest[];
}

/** Result of composing an AppHost from plugin Aspire contributions. */
export interface ComposeAppHostResult {
  readonly resources: readonly AspireResource[];
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
