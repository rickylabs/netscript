import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import type { ValidatedPluginDescriptor } from './jsr-plugin-validator-port.ts';
import { classifyPluginTrust } from './plugin-trust-tier.ts';

describe('classifyPluginTrust', () => {
  it('classifies @netscript packages as trusted first-party plugins', () => {
    const decision = classifyPluginTrust(descriptorFor('netscript', 'plugin-workers'));

    assertEquals(decision, {
      scope: 'netscript',
      packageSpecifier: '@netscript/plugin-workers',
      tier: 'first-party',
      trusted: true,
      confirmationRequired: false,
    });
  });

  it('classifies non-NetScript packages as third-party plugins requiring confirmation', () => {
    const decision = classifyPluginTrust(descriptorFor('acme', 'plugin-billing'));

    assertEquals(decision, {
      scope: 'acme',
      packageSpecifier: '@acme/plugin-billing',
      tier: 'third-party',
      trusted: false,
      confirmationRequired: true,
    });
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
