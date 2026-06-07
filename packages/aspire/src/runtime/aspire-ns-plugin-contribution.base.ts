import type {
  AspireResource,
  ContributionContext,
  EnvSource,
  HealthCheckSpec,
} from '../domain/mod.ts';
import type { AspireBuilder } from '../ports/mod.ts';

/** Base class plugins extend to contribute Aspire resources to an AppHost. */
export abstract class AspireNSPluginContribution {
  /** Plugin package name. */
  abstract readonly pluginName: string;

  /**
   * Register this plugin's resources with the AppHost builder.
   *
   * @param builder - Aspire builder port for the current composition.
   * @param ctx - Contribution context supplied by the host.
   * @returns Resources created by the contribution.
   *
   * @example
   * ```ts
   * class EmptyContribution extends AspireNSPluginContribution {
   *   readonly pluginName = "@acme/plugin-empty";
   *   contribute(): readonly AspireResource[] {
   *     return [];
   *   }
   * }
   * ```
   */
  abstract contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[];

  /**
   * Declare additional environment values required by this contribution.
   *
   * @param _ctx - Contribution context supplied by the host.
   * @returns Environment variable sources keyed by variable name.
   */
  declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {};
  }

  /**
   * Declare health checks used by plugin doctor commands.
   *
   * @param _ctx - Contribution context supplied by the host.
   * @returns Health check specs for contributed resources.
   */
  declareHealthChecks(_ctx: ContributionContext): readonly HealthCheckSpec[] {
    return [];
  }
}
