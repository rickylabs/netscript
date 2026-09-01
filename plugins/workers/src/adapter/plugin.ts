/** NetScript adapter contract for the workers plugin.
 *
 * @module
 */

import {
  type DoctorCheckSpec,
  type InstallStarterResource,
  type ItemScaffolder,
  type NetScriptPlugin,
  type PluginCommandContext,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import { WORKERS_JOB_REGISTRY_PATH } from '../runtime/generated-jobs.ts';
import {
  barrelScaffolder,
  DEFAULT_BARREL_INPUT,
  DEFAULT_JOB_INPUT,
  DEFAULT_RUNTIME_GLUE_INPUT,
  DEFAULT_TASK_INPUT,
  EMPTY_BARREL_INPUT,
  emptyBarrelScaffolder,
  jobResource,
  runtimeGlueScaffolder,
  taskResource,
  workflowResource,
} from './resources/mod.ts';

const controlPlaneModuleScaffolder: ItemScaffolder<Readonly<Record<string, never>>> = {
  name: 'control-plane-module',
  emit(): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'workers/plugin.ts',
        `/** Generated workers control-plane module. */\n\nexport const NETSCRIPT_CONTRIBUTION_BUILDERS = [\n  { callee: 'defineJob', axis: 'jobs' },\n] as const;\n\nexport { workersPlugin } from '@netscript/plugin-workers';\n`,
      ),
    ];
  },
};

/** Starter resources emitted by the workers install command. */
export const workersStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: controlPlaneModuleScaffolder, input: {} },
  { scaffolder: jobResource.scaffolder, input: DEFAULT_JOB_INPUT, samples: { kind: 'omit' } },
  { scaffolder: taskResource.scaffolder, input: DEFAULT_TASK_INPUT, samples: { kind: 'omit' } },
  {
    scaffolder: barrelScaffolder,
    input: DEFAULT_BARREL_INPUT,
    samples: {
      kind: 'alternate',
      scaffolder: emptyBarrelScaffolder,
      input: EMPTY_BARREL_INPUT,
    },
  },
  { scaffolder: runtimeGlueScaffolder, input: DEFAULT_RUNTIME_GLUE_INPUT },
];

const GENERATE_WORKERS_REGISTRY =
  `deno run -A jsr:@netscript/plugin-workers@${PLUGIN_PACKAGE_VERSION}/cli compile-registry`;

async function readWorkersRegistry(context: PluginCommandContext): Promise<string | undefined> {
  if (!await context.fileSystem.exists(WORKERS_JOB_REGISTRY_PATH)) return undefined;
  return await context.fileSystem.readText(WORKERS_JOB_REGISTRY_PATH);
}

const workersRegistryChecks: readonly DoctorCheckSpec[] = [{
  name: 'generated job registry exists',
  async run(context) {
    const source = await readWorkersRegistry(context);
    return {
      name: 'generated job registry exists',
      ok: source !== undefined,
      message: source === undefined
        ? `Missing ${WORKERS_JOB_REGISTRY_PATH}. Run: ${GENERATE_WORKERS_REGISTRY}`
        : WORKERS_JOB_REGISTRY_PATH,
    };
  },
}, {
  name: 'generated job registry is non-empty',
  async run(context) {
    const source = await readWorkersRegistry(context);
    const populated = source !== undefined && /jobDefinitionEntries[\s\S]*?\[\s*\[/.test(source);
    return {
      name: 'generated job registry is non-empty',
      ok: populated,
      message: populated
        ? 'Generated job definitions are present.'
        : `No generated jobs are registered. Run: ${GENERATE_WORKERS_REGISTRY}`,
    };
  },
}, {
  name: 'every declared job is registered',
  async run(context) {
    const source = await readWorkersRegistry(context);
    const declared = source?.match(/import (?:\* as )?job\d+ (?:from )?/g)?.length ?? 0;
    const compiledHandlers = source?.match(/resolveJobHandler\(job\d+,/g)?.length ?? 0;
    const generatedHandlers = source?.match(/\[job\d+\.id, job\d+\]/g)?.length ?? 0;
    const definitions = source?.match(/createLocalJobDefinition\(/g)?.length ?? 0;
    const loadable = source !== undefined &&
      source.includes('export const jobDefinitions') &&
      source.includes('export const registry') &&
      declared > 0 &&
      compiledHandlers + generatedHandlers === declared &&
      definitions === declared + 1;
    return {
      name: 'every declared job is registered',
      ok: loadable,
      message: loadable
        ? `${declared} declared job(s) are present in handler and definition maps.`
        : `Registry is incomplete for worker processors. Run: ${GENERATE_WORKERS_REGISTRY}`,
    };
  },
}];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const workersAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-workers',
  kind: 'workers',
  displayName: 'Background Workers',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-workers@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: workersStarterResources,
    configParams: ['WORKERS_API_URL', 'WORKER_CONCURRENCY'],
    wiringEntry: '@netscript/plugin-workers/worker',
  },
  doctor: {
    healthEndpoint: '/workers/health',
    requiredConfigKeys: ['WORKERS_API_URL'],
    extraChecks: workersRegistryChecks,
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
    targetSpecifier: `jsr:@netscript/plugin-workers@${PLUGIN_PACKAGE_VERSION}`,
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [jobResource, taskResource, workflowResource],
};
