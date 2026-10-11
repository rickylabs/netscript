import type {
  PluginHealthDeclaration,
  PluginHealthObservation,
  PluginHealthSummary,
  PluginResourceHealth,
} from '../domain/plugin-health.ts';

/** Aggregate declared plugin resources in one indexed pass; traffic cannot make a dead child healthy.
 * @example
 * ```ts
 * import { aggregatePluginHealth } from '@netscript/plugin/health';
 * const reports = aggregatePluginHealth(
 *   [{ pluginName: 'jobs', apiResources: ['api'], childResources: ['runner'] }],
 *   [{ name: 'api', state: 'Running', healthStatus: 'Healthy', healthReports: { http: {} } }],
 * );
 * console.log(reports[0]?.status); // degraded
 * ```
 */
export function aggregatePluginHealth(
  declarations: readonly PluginHealthDeclaration[],
  observations: readonly PluginHealthObservation[],
): readonly PluginHealthSummary[] {
  const observed = new Map(observations.map((resource) => [resource.name, resource]));
  return declarations.map((declaration) => {
    const apis = declaration.apiResources.map((name) => resourceHealth(name, observed.get(name)));
    const children = declaration.childResources.map((name) =>
      resourceHealth(name, observed.get(name))
    );
    const status = apis.some((api) => api.status === 'unhealthy')
      ? 'unhealthy'
      : apis.some((api) => api.status === 'unknown')
      ? 'unknown'
      : children.some((child) => child.status !== 'healthy')
      ? 'degraded'
      : apis.length + children.length === 0
      ? 'unknown'
      : 'healthy';
    return { ...declaration, status, apis, children };
  });
}

function resourceHealth(name: string, observation?: PluginHealthObservation): PluginResourceHealth {
  if (!observation) return { name, status: 'unhealthy', state: 'missing' };
  const state = observation.childHealth?.state ?? observation.state ?? 'unknown';
  const childReady = !observation.childHealthUnavailable && (!observation.childHealth ||
    (observation.childHealth.state === 'ready' && observation.childHealth.registryReady &&
      observation.childHealth.dependencyReady));
  if (
    !childReady || observation.state?.toLowerCase() !== 'running' ||
    observation.healthStatus?.toLowerCase() !== 'healthy'
  ) {
    return { name, status: 'unhealthy', state };
  }
  const reports = observation.healthReports;
  const evidence = reports !== undefined &&
    (Array.isArray(reports) ? reports.length > 0 : Object.keys(reports).length > 0);
  return { name, status: evidence ? 'healthy' : 'unknown', state };
}
