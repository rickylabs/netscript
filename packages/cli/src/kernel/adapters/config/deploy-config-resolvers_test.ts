import { assertEquals } from 'jsr:@std/assert@^1';
import type { DeployConfig } from '@netscript/config';
import { resolveLinuxDeploy } from './deploy-config-resolvers.ts';

Deno.test('resolveLinuxDeploy applies Linux-sensible defaults', () => {
  const resolved = resolveLinuxDeploy(undefined);

  assertEquals(resolved.systemctlPath, 'systemctl');
  assertEquals(resolved.unitPrefix, 'netscript');
  assertEquals(resolved.installBase, '/opt/netscript');
  assertEquals(resolved.runtimeDir, '/run/netscript');
  assertEquals(resolved.compileTarget, 'x86_64-unknown-linux-gnu');
  assertEquals(resolved.mode, 'compile');
  assertEquals(resolved.user, undefined);
  assertEquals(resolved.group, undefined);
});

Deno.test('resolveLinuxDeploy honors user overrides from deploy.targets.linux', () => {
  const userDeploy: DeployConfig = {
    targets: {
      linux: {
        systemctlPath: '/usr/bin/systemctl',
        unitPrefix: 'acme',
        installBase: '/srv/acme',
        user: 'acme',
        group: 'acme',
        runtimeDir: '/run/acme',
        mode: 'script',
      },
    },
  };

  const resolved = resolveLinuxDeploy(userDeploy);

  assertEquals(resolved.systemctlPath, '/usr/bin/systemctl');
  assertEquals(resolved.unitPrefix, 'acme');
  assertEquals(resolved.installBase, '/srv/acme');
  assertEquals(resolved.user, 'acme');
  assertEquals(resolved.group, 'acme');
  assertEquals(resolved.runtimeDir, '/run/acme');
  assertEquals(resolved.mode, 'script');
});
