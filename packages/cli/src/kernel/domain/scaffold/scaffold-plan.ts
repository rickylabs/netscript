/**
 * Structural plan for public init scaffolding.
 */

import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import type { DbEngineChoice } from '../db-engine.ts';
import type { ValidatedInitOptions } from './scaffold-options.ts';

/** Example service requested for the generated workspace. */
export interface ScaffoldServicePlan {
  /** Service workspace name. */
  readonly name: string;
  /**
   * Port baked into the service source as the non-Aspire fallback. Under
   * Aspire the injected `PORT` wins, so this is only what `deno task dev`
   * binds when the service runs standalone.
   */
  readonly port: number;
  /**
   * Aspire host port to pin, set only when `--service-port` was passed.
   * Undefined by default so `aspire start --isolated` can allocate it.
   */
  readonly hostPort?: number;
}

/** Public scaffold plan derived from validated init options. */
export interface ScaffoldPlan {
  /** Project package scope/name. */
  readonly name: string;
  /** Fresh application workspace name. */
  readonly appName: string;
  /** Workspace members that belong in the root `deno.json`. */
  readonly workspaceMembers: readonly string[];
  /** Selected database engines that require generated workspaces. */
  readonly dbEngines: readonly DbEngineChoice[];
  /** Optional example service. */
  readonly service?: ScaffoldServicePlan;
  /** Whether generated members should resolve through copied workspace packages. */
  readonly useWorkspacePackages: boolean;
}

/** Build the structural scaffold plan used by init render/write helpers. */
export function createScaffoldPlan(
  options: ValidatedInitOptions,
  flags: { readonly useWorkspacePackages: boolean },
): ScaffoldPlan {
  const service = options.includeExampleService && options.serviceName && options.servicePort
    ? {
      name: options.serviceName,
      port: options.servicePort,
      ...(options.serviceHostPort ? { hostPort: options.serviceHostPort } : {}),
    }
    : undefined;
  const dbEngines = options.dbEngine === 'none' ? [] : [options.dbEngine];
  const workspaceMembers = [
    `${SCAFFOLD_DIRS.APPS}/${options.appName}`,
    SCAFFOLD_DIRS.CONTRACTS,
    SCAFFOLD_DIRS.PLUGINS,
    ...(service ? [`${SCAFFOLD_DIRS.SERVICES}/${service.name}`] : []),
    ...dbEngines.map((engine) => `${SCAFFOLD_DIRS.DATABASE}/${engine}`),
  ];

  return {
    name: options.name,
    appName: options.appName,
    workspaceMembers,
    dbEngines,
    service,
    useWorkspacePackages: flags.useWorkspacePackages,
  };
}
