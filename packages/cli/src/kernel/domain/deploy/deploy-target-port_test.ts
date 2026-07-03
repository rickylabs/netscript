import { assertEquals } from 'jsr:@std/assert@^1';

import type { DeployTargetOperation, DeployTargetPort } from './deploy-target-port.ts';
import type { KnownDeployTargetKey } from './deploy-target-registry-port.ts';
import { DeployTargetRegistry } from '../../application/registries/deploy-target-registry.ts';
import { WindowsServiceDeployTarget } from './windows-service-deploy-target.ts';
import { LinuxServiceDeployTarget } from './linux-service-deploy-target.ts';

Deno.test('deploy target contract exposes the canonical 7-op names', () => {
  const canonical: readonly DeployTargetOperation[] = [
    'plan',
    'emit',
    'up',
    'down',
    'status',
    'logs',
    'rollback',
    'secrets',
  ];

  assertEquals(canonical, ['plan', 'emit', 'up', 'down', 'status', 'logs', 'rollback', 'secrets']);
});

Deno.test('deploy target contract retains the legacy build/install/uninstall verb aliases', () => {
  const legacy: readonly DeployTargetOperation[] = ['build', 'install', 'uninstall'];

  assertEquals(legacy, ['build', 'install', 'uninstall']);
});

Deno.test('deploy target port accepts an adapter that implements only the canonical subset', () => {
  const target: DeployTargetPort = {
    key: 'linux-service',
    label: 'Linux service',
    operations: ['plan', 'up', 'down', 'status', 'logs'],
    up: (request) =>
      Promise.resolve({
        target: 'linux-service',
        operation: 'up',
        message: `up for ${request.projectRoot}`,
      }),
  };

  assertEquals(target.operations.includes('up'), true);
  assertEquals(typeof target.up, 'function');
  assertEquals(target.rollback, undefined);
});

Deno.test('deploy target registry reserves the linux-service key at the type level', () => {
  const reserved: KnownDeployTargetKey = 'linux-service';
  const registry = new DeployTargetRegistry([]);
  const linuxTarget: DeployTargetPort = {
    key: reserved,
    label: 'Linux service',
    operations: ['up', 'down'],
  };

  registry.register(reserved, linuxTarget);

  assertEquals(registry.get(reserved)?.key, 'linux-service');
  assertEquals(registry.entries().map(([key]) => key), ['linux-service']);
});

Deno.test('bare-metal service targets declare the canonical 6-op subset (F-DEPLOY-1)', () => {
  const canonical: readonly DeployTargetOperation[] = ['plan', 'emit', 'up', 'down', 'status', 'logs'];

  const targets: readonly DeployTargetPort[] = [
    new WindowsServiceDeployTarget(),
    new LinuxServiceDeployTarget(),
  ];
  for (const target of targets) {
    // Declared operations are exactly the canonical subset (rollback/secrets omitted).
    assertEquals(target.operations, canonical);
    // Every declared operation resolves to an implemented handler method.
    assertEquals(typeof target.plan, 'function');
    assertEquals(typeof target.emit, 'function');
    assertEquals(typeof target.up, 'function');
    assertEquals(typeof target.down, 'function');
    assertEquals(typeof target.status, 'function');
    assertEquals(typeof target.logs, 'function');
    // Legacy verb aliases stay callable (LD-3) without being declared.
    assertEquals(typeof target.build, 'function');
    assertEquals(typeof target.install, 'function');
    assertEquals(typeof target.uninstall, 'function');
    // Unsupported operations are omitted, not shipped as silent no-ops (LD-4, #341).
    assertEquals(target.rollback, undefined);
    assertEquals(target.secrets, undefined);
  }
});

Deno.test('a bare-metal service operation resolves a target-scoped descriptor result', async () => {
  const linux = new LinuxServiceDeployTarget();
  const result = await linux.up({ projectRoot: '/srv/app' });

  assertEquals(result.target, 'linux-service');
  assertEquals(result.operation, 'up');
  assertEquals(result.message.includes('/srv/app'), true);
});

Deno.test('the default deploy target registry seeds both bare-metal OS targets', () => {
  const registry = new DeployTargetRegistry();

  assertEquals(registry.entries().map(([key]) => key), ['linux-service', 'windows-service']);
  assertEquals(registry.get('linux-service')?.label, 'Linux service');
  assertEquals(registry.get('windows-service')?.label, 'Windows service');
});
