/** Public types for NetScript route manifest generation. */

import type { PageModuleRouteForm } from './manifest-page-module.ts';

export type { PageModuleRouteForm } from './manifest-page-module.ts';

/** Options controlling the NetScript route manifest generator. */
export interface NetScriptRouteManifestOptions {
  /** Whether manifest generation is enabled. */
  enabled?: boolean;
  /** Directory containing Fresh route files. */
  routesDir?: string;
  /** Write destination for the generated routes module. */
  outputPath?: string;
  /** Verbosity of generator logging. */
  logLevel?: 'silent' | 'changes' | 'verbose';
}

/** Fully resolved options used by the manifest generator. */
export interface ResolvedNetScriptRouteManifestOptions {
  /** Absolute path to the application root. */
  appRoot: string;
  /** Absolute path to the routes directory. */
  routesDir: string;
  /** Absolute path to the generated manifest module. */
  manifestOutputPath: string;
  /** Absolute path to the generated routes module. */
  routesOutputPath: string;
  /** Resolved generator log level. */
  logLevel: 'silent' | 'changes' | 'verbose';
}

/** A route discovered by walking the routes directory. */
export interface DiscoveredNetScriptRoute {
  /** Absolute file path of the route module. */
  routeFilePath: string;
  /** Route file path relative to the routes directory. */
  relativeRouteFilePath: string;
  /** Fresh route pattern inferred from the file path. */
  routePattern: string;
  /** Nested property path used in the generated manifest tree. */
  routeKeyPath: string[];
  /** Relative import path to the route contract sidecar, if present. */
  routeContractImportPath?: string;
  /**
   * WI-12 page-module authoring form discovered by scanning the page module.
   *
   * - `inline`: page module has `.withRouteContract({...})` (Form A).
   * - `sidecar`: page module has a sibling `<page>.route.ts` (Form B).
   * - `default`: neither inline contract nor sidecar (Form C).
   */
  pageModuleForm?: PageModuleRouteForm;
  /**
   * Inline contract object body (schema fields, excluding `$route`) extracted
   * from the page module's `.withRouteContract({...})` call. Present only for
   * Form A routes.
   */
  inlineContractBody?: string;
}

/** Result returned after writing the generated route manifest files. */
export interface WriteNetScriptRouteManifestResult {
  /** Whether either generated file changed. */
  changed: boolean;
  /** Whether the manifest file changed. */
  manifestChanged: boolean;
  /** Whether the routes module changed. */
  routesChanged: boolean;
  /** Absolute path to the generated manifest file. */
  manifestOutputPath: string;
  /** Absolute path to the generated routes file. */
  routesOutputPath: string;
  /** Number of routes discovered. */
  routeCount: number;
  /** Number of routes bound to a route contract sidecar. */
  boundRouteCount: number;
}
