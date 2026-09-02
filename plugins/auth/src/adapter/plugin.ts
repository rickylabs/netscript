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

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const authAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-auth',
  kind: 'auth',
  displayName: 'Auth',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-auth@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: authStarterResources,
    configParams: ['NETSCRIPT_AUTH_BACKEND'],
    prismaContract: 'database/auth.prisma',
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
