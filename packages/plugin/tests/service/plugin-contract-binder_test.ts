import { assert } from '@std/assert';
import { workersContractV1 } from '@netscript/plugin-workers-core/contracts/v1';
import { bindPluginContract } from '../../src/service/mod.ts';

Deno.test('bindPluginContract binds handlers and assembles a versioned router', () => {
  const bound = bindPluginContract(workersContractV1).context<Record<string, unknown>>();
  const handlers = bound.handlers({
    describe: bound.router.describe.handler(() => ({
      pluginName: '@netscript/plugin-workers',
      contractVersions: ['v1'],
      routeGroups: ['workers'],
      capabilities: ['background-processor'],
    })),
  });

  const router = bound.assemble({
    version: 'v1',
    namespace: 'workers',
    handlers,
  });

  assert('v1' in router);
});
