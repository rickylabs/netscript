import { assertEquals } from '@std/assert';

import { DeployTargetRegistry } from '../../../../kernel/application/registries/deploy-target-registry.ts';
import { listDeployTargets } from './list-deploy-targets.ts';

Deno.test('deploy list enumerates every registered target with advertised operations', () => {
  const registry = new DeployTargetRegistry([
    ['zeta', { key: 'zeta', label: 'Zeta', operations: ['status'] }],
    ['alpha', { key: 'alpha', label: 'Alpha', operations: ['plan', 'up'] }],
  ]);
  assertEquals(listDeployTargets(registry), [
    { key: 'alpha', label: 'Alpha', operations: ['plan', 'up'] },
    { key: 'zeta', label: 'Zeta', operations: ['status'] },
  ]);
});
