import workersPluginHealthCheck from '@netscript/plugin-workers/health-check';
import {
  startCombinedProcess,
  type StaticJobDefinitionRegistry,
} from '@netscript/plugin-workers/runtime';
import type { StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';
import {
  jobDefinitions,
  registry as generatedRegistry,
} from '../../../.netscript/generated/plugin-workers/job-registry.ts';

type StaticJobHandler = StaticJobRegistry extends ReadonlyMap<string, infer Handler> ? Handler
  : never;

const registry = new Map<string, StaticJobHandler>(generatedRegistry);
registry.set('workers-plugin-health-check', workersPluginHealthCheck);

await startCombinedProcess({
  definitions: jobDefinitions as StaticJobDefinitionRegistry,
  registry,
});
