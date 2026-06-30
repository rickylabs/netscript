/** NetScript adapter contract for the workers plugin.
 *
 * @module
 */

import type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';
import {
  barrelScaffolder,
  DEFAULT_BARREL_INPUT,
  DEFAULT_JOB_INPUT,
  DEFAULT_RUNTIME_GLUE_INPUT,
  DEFAULT_TASK_INPUT,
  jobResource,
  runtimeGlueScaffolder,
  taskResource,
  workflowResource,
} from './resources/mod.ts';

/** Starter resources emitted by the workers install command. */
export const workersStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: jobResource.scaffolder, input: DEFAULT_JOB_INPUT },
  { scaffolder: taskResource.scaffolder, input: DEFAULT_TASK_INPUT },
  { scaffolder: barrelScaffolder, input: DEFAULT_BARREL_INPUT },
  { scaffolder: runtimeGlueScaffolder, input: DEFAULT_RUNTIME_GLUE_INPUT },
];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const workersAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-workers',
  kind: 'workers',
  displayName: 'Background Workers',
  install: {
    dependencySpecifier: 'jsr:@netscript/plugin-workers@^0.0.1-alpha.12',
    starterResources: workersStarterResources,
    configParams: ['WORKERS_API_URL', 'WORKER_CONCURRENCY'],
    wiringEntry: '@netscript/plugin-workers/worker',
  },
  doctor: {
    healthEndpoint: '/workers/health',
    requiredConfigKeys: ['WORKERS_API_URL'],
  },
  info: {
    capabilities: [
      'background jobs',
      'multi-runtime tasks',
      'workflow definitions',
      'worker API endpoints',
    ],
    versionSource: 'package',
  },
  update: {
    strategy: 'dependency',
    targetSpecifier: 'jsr:@netscript/plugin-workers@^0.0.1-alpha.12',
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [jobResource, taskResource, workflowResource],
};
