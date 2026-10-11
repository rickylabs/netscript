import type { ChildHealthSnapshot } from './child-health.ts';

/** Plugin runtime verdict; degraded means APIs are declared but a child is not ready.
 * @example
 * ```ts
 * import type { PluginHealthStatus } from '@netscript/plugin/health';
 * const status: PluginHealthStatus = 'degraded';
 * ```
 */
export type PluginHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/** Resources declared by one installed plugin, using generated resource names.
 * @example
 * ```ts
 * import type { PluginHealthDeclaration } from '@netscript/plugin/health';
 * const declaration: PluginHealthDeclaration = {
 *   pluginName: 'jobs', apiResources: ['jobs-api'], childResources: ['jobs-runner'],
 * };
 * ```
 */
export interface PluginHealthDeclaration {
  /** Installed plugin identity. */ readonly pluginName: string;
  /** Enabled API resource names. */ readonly apiResources: readonly string[];
  /** Enabled children with the shared health capability. */ readonly childResources:
    readonly string[];
}

/** Runtime evidence for one declared resource; absence is supplied by omitting the observation.
 * @example
 * ```ts
 * import type { PluginHealthObservation } from '@netscript/plugin/health';
 * const observation: PluginHealthObservation = { name: 'jobs-runner', state: 'Stopped' };
 * ```
 */
export interface PluginHealthObservation {
  /** Generated resource name. */ readonly name: string;
  /** Observed process state. */ readonly state?: string;
  /** Orchestrator readiness verdict. */ readonly healthStatus?: string;
  /** Orchestrator readiness evidence. */ readonly healthReports?:
    | readonly unknown[]
    | Readonly<Record<string, unknown>>;
  /** Shared child payload when the declared endpoint was probed. */ readonly childHealth?:
    ChildHealthSnapshot;
  /** True when the child endpoint could not supply a valid payload. */ readonly childHealthUnavailable?:
    boolean;
}

/** One resource's normalized verdict, preserving named lifecycle failures.
 * @example
 * ```ts
 * import type { PluginResourceHealth } from '@netscript/plugin/health';
 * const resource: PluginResourceHealth = { name: 'jobs-runner', status: 'unhealthy', state: 'missing' };
 * ```
 */
export interface PluginResourceHealth {
  /** Declared resource name. */ readonly name: string;
  /** Readiness verdict. */ readonly status: 'healthy' | 'unhealthy' | 'unknown';
  /** Child vocabulary, orchestrator lifecycle, or missing. */ readonly state: string;
}

/** Shared health report consumed by CLI diagnostics and monitoring interfaces.
 * @example
 * ```ts
 * import { aggregatePluginHealth } from '@netscript/plugin/health';
 * const reports = aggregatePluginHealth([{ pluginName: 'jobs', apiResources: ['api'], childResources: ['runner'] }], []);
 * console.log(reports[0]?.status); // unhealthy
 * ```
 */
export interface PluginHealthSummary extends PluginHealthDeclaration {
  /** Aggregate runtime verdict. */ readonly status: PluginHealthStatus;
  /** Normalized API observations. */ readonly apis: readonly PluginResourceHealth[];
  /** Normalized child observations. */ readonly children: readonly PluginResourceHealth[];
}
