import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import type { ValidatedPluginDescriptor } from '../../features/plugins/install/jsr-plugin-validator-port.ts';
import { buildPluginScaffoldPermissionFlags } from './plugin-scaffold-permissions.ts';

describe('buildPluginScaffoldPermissionFlags', () => {
  it('uses the trusted deno x permission level for first-party plugins', () => {
    const flags = buildPluginScaffoldPermissionFlags({
      descriptor: descriptorFor('netscript', 'plugin-workers'),
      projectRoot: '/workspace/alpha',
      pluginName: 'workers',
    });

    assertEquals(flags, ['-A']);
  });

  it('allows the fresh alpha dependency-age exception only for first-party opt-in', () => {
    const flags = buildPluginScaffoldPermissionFlags({
      descriptor: descriptorFor('netscript', 'plugin-workers'),
      projectRoot: '/workspace/alpha',
      pluginName: 'workers',
      allowFreshFirstPartyDependency: true,
    });

    assertEquals(flags, ['-A', '--minimum-dependency-age=0']);
  });

  it('confines third-party plugins to project reads, scoped writes, and denied net/run', () => {
    const flags = buildPluginScaffoldPermissionFlags({
      descriptor: descriptorFor('acme', 'plugin-billing'),
      projectRoot: '/workspace/alpha',
      pluginName: 'billing',
    });

    assertEquals(flags, [
      '--allow-read=/workspace/alpha',
      '--allow-write=/workspace/alpha/plugins/billing,/workspace/alpha/services,/workspace/alpha/database,/workspace/alpha/aspire,/workspace/alpha/.aspire',
      '--deny-net',
      '--deny-run',
    ]);
  });

  it('does not inject the minimum dependency age bypass for third-party plugins', () => {
    const flags = buildPluginScaffoldPermissionFlags({
      descriptor: descriptorFor('acme', 'plugin-billing'),
      projectRoot: '/workspace/alpha',
      pluginName: 'billing',
      allowFreshFirstPartyDependency: true,
    });

    assertEquals(flags.includes('--minimum-dependency-age=0'), false);
  });
});

function descriptorFor(scope: string, packageName: string): ValidatedPluginDescriptor {
  const packageSpecifier = `@${scope}/${packageName}`;
  return {
    package: {
      requestedSpec: packageSpecifier,
      source: 'scoped-name',
      scope,
      packageName,
      packageSpecifier,
      jsrSpecifier: `jsr:${packageSpecifier}`,
    },
    version: '1.2.3',
    manifest: {
      schemaVersion: 1,
      name: packageSpecifier,
      version: '1.2.3',
      displayName: packageName,
      description: `${packageName} plugin`,
      peerDependencies: {},
      capabilities: {
        hasDatabaseMigrations: false,
        hasRoutes: false,
        hasBackgroundWorkers: false,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: { net: [], read: [], write: [] },
      },
    },
    packageMetadata: { latest: '1.2.3', isYanked: false },
    versionMetadata: { exports: { './scaffold': './scaffold.ts' }, files: {} },
    details: {},
  };
}
