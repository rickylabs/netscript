/**
 * Fresh route-manifest staging adapter for scaffold workflows.
 *
 * @module
 */

import {
  discoverNetScriptRoutes,
  resolveNetScriptRouteManifestOptions,
  writeNetScriptRouteManifestSync,
} from '@netscript/fresh/vite';
import type {
  DiscoveredNetScriptRoute,
  NetScriptRouteManifestOptions,
  ResolvedNetScriptRouteManifestOptions,
  WriteNetScriptRouteManifestResult,
} from '@netscript/fresh/vite';

/** Generated route-manifest sources and the Fresh metadata used to derive them. */
export interface FreshRouteManifestWrite {
  /** Fully resolved Fresh manifest options. */
  readonly options: ResolvedNetScriptRouteManifestOptions;
  /** Fresh-discovered routes, including canonical route property paths. */
  readonly discoveredRoutes: readonly DiscoveredNetScriptRoute[];
  /** Fresh writer change summary. */
  readonly result: WriteNetScriptRouteManifestResult;
  /** Generated `manifest.ts` source for staging content comparison. */
  readonly manifestSource: string;
  /** Generated `routes.ts` source for staging content comparison. */
  readonly routesSource: string;
}

/**
 * Write Fresh-derived route modules and return their content-comparison snapshot.
 *
 * @param appRoot - Fresh application root used to resolve default paths.
 * @param options - Optional route discovery and output overrides for staging.
 * @returns Generated sources, Fresh discovery metadata, and the writer result.
 */
export function writeFreshRouteManifestSync(
  appRoot: string,
  options: NetScriptRouteManifestOptions = {},
): FreshRouteManifestWrite {
  const resolvedOptions = resolveNetScriptRouteManifestOptions(appRoot, options);
  const result = writeNetScriptRouteManifestSync(resolvedOptions);

  return {
    options: resolvedOptions,
    discoveredRoutes: discoverNetScriptRoutes(resolvedOptions),
    result,
    manifestSource: Deno.readTextFileSync(result.manifestOutputPath),
    routesSource: Deno.readTextFileSync(result.routesOutputPath),
  };
}
