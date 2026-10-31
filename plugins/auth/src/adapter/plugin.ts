/** NetScript adapter contract for the auth plugin.
 *
 * @module
 */

import {
  type InstallStarterResource,
  type ItemScaffolder,
  type NetScriptPlugin,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import {
  authBarrelScaffolder,
  authSdkClientScaffolder,
  DEFAULT_AUTH_BARREL_INPUT,
  DEFAULT_AUTH_SDK_CLIENT_INPUT,
} from './resources/mod.ts';

const controlPlaneModuleScaffolder: ItemScaffolder<Readonly<Record<string, never>>> = {
  name: 'control-plane-module',
  emit(): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'auth/plugin.ts',
        `/** Generated auth control-plane module. */\n\nexport { authPlugin } from '@netscript/plugin-auth';\n`,
      ),
    ];
  },
};

/** Starter resources emitted by the auth install command. */
export const authStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: controlPlaneModuleScaffolder, input: {} },
  { scaffolder: authBarrelScaffolder, input: DEFAULT_AUTH_BARREL_INPUT },
  { scaffolder: authSdkClientScaffolder, input: DEFAULT_AUTH_SDK_CLIENT_INPUT },
];

/** Backend selector shared with the auth service's environment seam. */
export const AUTH_BACKEND_ENV = 'NETSCRIPT_AUTH_BACKEND';
/** Auth's default storage stays entirely in KV. */
export const DEFAULT_AUTH_BACKEND = 'kv-oauth';
/** The one backend whose provider data is stored in SQL. */
export const AUTH_DATABASE_BACKEND = 'better-auth';
/** Package-relative schema contributed by the SQL backend. */
export const AUTH_PRISMA_CONTRACT = 'database/auth.prisma';

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const authAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-auth',
  kind: 'auth',
  displayName: 'Auth',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-auth@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: authStarterResources,
    configParams: [AUTH_BACKEND_ENV],
    wiringEntry: '@netscript/plugin-auth/services',
  },
  doctor: {
    healthEndpoint: '/health',
    requiredConfigKeys: ['NETSCRIPT_AUTH_BACKEND'],
  },
  info: {
    capabilities: [
      'unified auth API',
      'single-active backend selection',
      'auth database schema',
      'auth session streams',
    ],
    versionSource: 'package',
  },
  update: {
    strategy: 'dependency',
    targetSpecifier: `jsr:@netscript/plugin-auth@${PLUGIN_PACKAGE_VERSION}`,
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [],
};

/** Select install contributions for the active backend without reading ambient configuration. */
export function createAuthAdapterPlugin(backend: string = DEFAULT_AUTH_BACKEND): NetScriptPlugin {
  return {
    ...authAdapterPlugin,
    install: {
      ...authAdapterPlugin.install,
      ...(backend === AUTH_DATABASE_BACKEND ? { prismaContract: AUTH_PRISMA_CONTRACT } : {}),
    },
  };
}
