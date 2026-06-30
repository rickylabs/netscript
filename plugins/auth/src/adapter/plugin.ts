/** NetScript adapter contract for the auth plugin.
 *
 * @module
 */

import type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';
import { authBarrelScaffolder, DEFAULT_AUTH_BARREL_INPUT } from './resources/mod.ts';

/** Starter resources emitted by the auth install command. */
export const authStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: authBarrelScaffolder, input: DEFAULT_AUTH_BARREL_INPUT },
];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const authAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-auth',
  kind: 'auth',
  displayName: 'Auth',
  install: {
    dependencySpecifier: 'jsr:@netscript/plugin-auth@^0.0.1-alpha.12',
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
    targetSpecifier: 'jsr:@netscript/plugin-auth@^0.0.1-alpha.12',
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [],
};
