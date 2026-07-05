import { assertEquals } from 'jsr:@std/assert@^1';

import type { DeployTargetOperation, DeployTargetPort } from './deploy-target-port.ts';
import type { KnownDeployTargetKey } from './deploy-target-registry-port.ts';
import { DeployTargetRegistry } from '../../application/registries/deploy-target-registry.ts';
import { WindowsServiceDeployTarget } from './windows-service-deploy-target.ts';
import { LinuxServiceDeployTarget } from './linux-service-deploy-target.ts';

const DEFAULT_TARGET_KEYS = [
  'compose',
  'deno-deploy',
  'docker',
  'linux-service',
  'windows-service',
] as const satisfies readonly KnownDeployTargetKey[];

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

Deno.test('deploy target registry reserves all first-party target keys at the type level', () => {
  const registry = new DeployTargetRegistry([]);
  for (const key of DEFAULT_TARGET_KEYS) {
    registry.register(key, {
      key,
      label: key,
      operations: [],
    });
  }

  assertEquals(registry.entries().map(([key]) => key), [...DEFAULT_TARGET_KEYS].sort());
});

Deno.test('unwired bare-metal service targets advertise only the canonical 6-op subset (F-DEPLOY-1)', () => {
  const canonical: readonly DeployTargetOperation[] = [
    'plan',
    'emit',
    'up',
    'down',
    'status',
    'logs',
  ];

  const targets: readonly DeployTargetPort[] = [
    new WindowsServiceDeployTarget(),
    new LinuxServiceDeployTarget(),
  ];
  for (const target of targets) {
    // Advertised operations are exactly the canonical subset while no core ports
    // are wired: rollback/secrets are NOT advertised, so the router never exposes
    // an op the descriptor cannot really perform (LD-4: omit rather than no-op).
    assertEquals(target.operations, canonical);
    assertEquals(target.operations.includes('rollback'), false);
    assertEquals(target.operations.includes('secrets'), false);
    // Every advertised operation resolves to an implemented handler method.
    assertEquals(typeof target.plan, 'function');
    assertEquals(typeof target.emit, 'function');
    assertEquals(typeof target.up, 'function');
    assertEquals(typeof target.down, 'function');
    assertEquals(typeof target.status, 'function');
    assertEquals(typeof target.logs, 'function');
    // Legacy verb aliases stay callable (LD-3) without being advertised.
    assertEquals(typeof target.build, 'function');
    assertEquals(typeof target.install, 'function');
    assertEquals(typeof target.uninstall, 'function');
  }
});

Deno.test('wiring the core ports promotes a service target to the 7-op surface and delegates', async () => {
  const activated: string[] = [];
  const target = new LinuxServiceDeployTarget({
    activation: {
      activate: (id) => {
        activated.push(id);
        return Promise.resolve();
      },
      current: () => Promise.resolve('rel-current'),
      history: () =>
        Promise.resolve([
          { id: 'rel-prev', recordedAt: 1, healthy: true },
          { id: 'rel-current', recordedAt: 2, healthy: true },
        ]),
      record: () => Promise.resolve(),
    },
    secretsStore: {
      put: () => Promise.resolve(),
      list: () => Promise.resolve(['STALE']),
      clear: () => Promise.resolve(),
    },
    resolveSecrets: () => ({ target: 'linux-service', secrets: [{ key: 'API_KEY', value: 'v' }] }),
  });

  // rollback + secrets are now advertised because their core ports are wired.
  assertEquals(target.operations.includes('rollback'), true);
  assertEquals(target.operations.includes('secrets'), true);

  // rollback delegates to the core orchestrator (activates the previous healthy release).
  const rollback = await target.rollback({ projectRoot: '/srv/app' });
  assertEquals(rollback.operation, 'rollback');
  assertEquals(activated, ['rel-prev']);
  assertEquals(rollback.message.includes('rel-prev'), true);

  // secrets delegates to the core reconcile (writes the bundle key, prunes the stale one).
  const secrets = await target.secrets({ projectRoot: '/srv/app' });
  assertEquals(secrets.operation, 'secrets');
  assertEquals(secrets.message, 'Linux service secrets: wrote 1, pruned 1');
});

Deno.test('a bare-metal service operation resolves a target-scoped descriptor result', async () => {
  const linux = new LinuxServiceDeployTarget();
  const result = await linux.up({ projectRoot: '/srv/app' });

  assertEquals(result.target, 'linux-service');
  assertEquals(result.operation, 'up');
  assertEquals(result.message.includes('/srv/app'), true);
});

Deno.test('the default deploy target registry resolves every first-party target', () => {
  const registry = new DeployTargetRegistry();

  // entries() sorts keys with localeCompare for deterministic ordering.
  assertEquals(registry.entries().map(([key]) => key), [...DEFAULT_TARGET_KEYS].sort());
  for (const key of DEFAULT_TARGET_KEYS) {
    assertEquals(registry.get(key)?.key, key);
  }

  assertEquals(registry.get('linux-service')?.label, 'Linux service');
  assertEquals(registry.get('windows-service')?.label, 'Windows service');
  assertEquals(registry.get('deno-deploy')?.label, 'Deno Deploy');
  assertEquals(registry.get('compose')?.label, 'Docker Compose');
  assertEquals(registry.get('docker')?.label, 'Docker image');
});

Deno.test('the default deploy target registry exposes only operations with implemented handlers', () => {
  const registry = new DeployTargetRegistry();

  for (const [key, target] of registry.entries()) {
    for (const operation of target.operations) {
      assertEquals(
        typeof target[operation as keyof DeployTargetPort],
        'function',
        `${key}.${operation} should resolve to a handler`,
      );
    }
  }
});

Deno.test('compose and docker targets resolve the Aspire adapter operation subsets', () => {
  const registry = new DeployTargetRegistry();
  const compose = registry.get('compose');
  const docker = registry.get('docker');

  assertEquals(compose?.operations, ['plan', 'emit', 'up', 'down', 'status', 'logs']);
  assertEquals(docker?.operations, ['plan', 'emit', 'up', 'down', 'status', 'logs']);
  assertEquals(typeof compose?.plan, 'function');
  assertEquals(typeof docker?.up, 'function');
});
