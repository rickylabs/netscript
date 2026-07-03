import { assertEquals } from 'jsr:@std/assert@^1';

import type { DeployTargetOperation, DeployTargetPort } from './deploy-target-port.ts';
import type { KnownDeployTargetKey } from './deploy-target-registry-port.ts';
import { DeployTargetRegistry } from '../../application/registries/deploy-target-registry.ts';

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
