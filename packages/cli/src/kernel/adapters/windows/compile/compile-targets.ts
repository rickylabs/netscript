/** Derive Windows binary compile targets from resolved NetScript config. */
import { join } from '@std/path';
import {
  getPluginServiceLookupName,
  resolvePluginEnvironmentVariables,
} from '../../config/plugin-registry.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { ResolvedConfig } from '../../../domain/resolved-config.ts';

// ============================================================================
// TARGET EXTRACTION
// ============================================================================

/**
 * Derive all compile targets from a ResolvedConfig.
 *
 * Includes:
 * - All Deno microservices
 * - All enabled plugins
 * - All enabled background processor entrypoints
 * - All Deno apps (if apps.runtime === 'deno')
 */
function mergeEnvironment(
  ...sources: Array<Record<string, string> | undefined>
): Record<string, string> | undefined {
  const merged = Object.assign({}, ...sources.filter(Boolean));
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function getPluginTargetMetadata(
  config: ResolvedConfig,
  pluginName: string,
  entrypointName?: string,
): Pick<
  CompileTarget,
  | 'pluginName'
  | 'entrypointName'
  | 'manifestResourceName'
  | 'environment'
  | 'concurrencyEnvVar'
  | 'defaultConcurrency'
  | 'assignWorkerId'
  | 'include'
> {
  const plugin = config.registeredPlugins[pluginName];
  const entrypoint = entrypointName ? plugin?.entrypoints?.[entrypointName] : undefined;
  const resolvedBackgroundProcessor = config.backgroundProcessors[pluginName];
  const defaultConcurrency = plugin?.type === 'background-processor'
    ? resolvedBackgroundProcessor?.concurrency ?? plugin?.infrastructure?.defaultConcurrency
    : plugin?.infrastructure?.defaultConcurrency;

  return {
    pluginName,
    entrypointName,
    manifestResourceName: entrypoint?.manifestResourceName ??
      plugin?.infrastructure?.manifestResourceName,
    environment: mergeEnvironment(
      resolvePluginEnvironmentVariables(plugin?.infrastructure?.envVars),
      resolvePluginEnvironmentVariables(entrypoint?.envVars),
    ),
    concurrencyEnvVar: plugin?.infrastructure?.concurrencyEnvVar,
    defaultConcurrency,
    assignWorkerId: entrypoint?.assignWorkerId,
    include: entrypoint?.include,
  };
}

function getBackgroundCompileTargetName(
  processor: ResolvedConfig['backgroundProcessors'][string],
  entrypointName: string,
  entrypointPath: string,
): string {
  if (
    processor.name === 'triggers' &&
    entrypointPath.replace(/\\/g, '/').endsWith('src/runtime/trigger-processor.ts')
  ) {
    return 'trigger-processor';
  }

  return `${processor.name}-${entrypointName}`;
}

export function extractCompileTargets(config: ResolvedConfig): CompileTarget[] {
  const targets: CompileTarget[] = [];

  // Microservices
  for (const [name, svc] of Object.entries(config.services)) {
    targets.push({
      name,
      type: 'service',
      entrypoint: join(svc.workdir, svc.entrypoint),
      workdir: svc.workdir,
      permissions: svc.permissions,
      port: svc.port,
      dependsOn: svc.dependsOn,
      description: svc.description ?? `${name} service`,
    });
  }

  // Enabled plugins
  for (const [name, plugin] of Object.entries(config.plugins)) {
    if (!plugin.enabled) continue;
    const pluginName = getPluginServiceLookupName(name);
    targets.push({
      name,
      type: 'plugin',
      entrypoint: join(plugin.workdir, plugin.entrypoint),
      workdir: plugin.workdir,
      permissions: plugin.permissions,
      port: plugin.port,
      description: plugin.description ?? `${name} plugin`,
      ...getPluginTargetMetadata(config, pluginName),
    });
  }

  // Background processor entrypoints
  for (const processor of Object.values(config.backgroundProcessors)) {
    if (!processor.enabled) continue;

    for (const entrypoint of Object.values(processor.entrypoints)) {
      targets.push({
        name: getBackgroundCompileTargetName(processor, entrypoint.name, entrypoint.entrypoint),
        type: 'worker',
        entrypoint: join(processor.workdir, entrypoint.entrypoint),
        workdir: processor.workdir,
        permissions: entrypoint.permissions,
        description: entrypoint.description,
        pluginName: processor.name,
        entrypointName: entrypoint.name,
        manifestResourceName: entrypoint.manifestResourceName,
        environment: entrypoint.environment,
        concurrencyEnvVar: processor.concurrencyEnvVar,
        defaultConcurrency: processor.concurrency,
        assignWorkerId: entrypoint.assignWorkerId,
        include: entrypoint.include,
      });
    }
  }

  // Deno apps (Fresh, etc.)
  for (const [name, app] of Object.entries(config.apps)) {
    if (app.runtime !== 'deno') continue;
    if (!app.enabled) continue; // Skip disabled apps
    // Fresh/Vite-built apps need the client bundle and static assets embedded
    const appWorkdir = app.workdir; // e.g. "apps/frontend"
    targets.push({
      name,
      type: 'app',
      entrypoint: join(app.workdir, app.entrypoint),
      workdir: app.workdir,
      permissions: app.permissions,
      port: app.port,
      description: app.description ?? `${name} app`,
      include: [
        `${appWorkdir}/_fresh/client`,
        `${appWorkdir}/static`,
      ],
    });
  }

  return targets;
}
