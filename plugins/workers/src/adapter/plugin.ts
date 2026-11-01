/** NetScript adapter contract for the workers plugin.
 *
 * @module
 */

import { fromFileUrl } from '@std/path';
import {
  type DoctorCheckSpec,
  type InstallStarterResource,
  type ItemScaffolder,
  type NetScriptPlugin,
  type PluginCommandContext,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';
import { NETSCRIPT_CONTRIBUTION_BUILDERS } from '@netscript/plugin-workers-core/discovery';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import { WORKERS_CONCURRENCY_ENV } from '../runtime/concurrency.ts';
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
        `/** Generated workers control-plane module. */\n\nexport const NETSCRIPT_CONTRIBUTION_BUILDERS = [\n${
          NETSCRIPT_CONTRIBUTION_BUILDERS.map((builder) =>
            `  { callee: '${builder.callee}', axis: ${
              builder.axis === null ? 'null' : `'${builder.axis}'`
            } },`
          ).join('\n')
        }\n] as const;\n\nexport { workersPlugin } from '@netscript/plugin-workers';\n`,
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

/** Prefer project-local CLI exports; a package version is only a published-workspace fallback. */
async function registryRemediation(context: PluginCommandContext): Promise<string> {
  const candidates: string[] = [];
  const sourceCli = new URL('../../../../packages/cli/bin/netscript-dev.ts', import.meta.url);
  if (sourceCli.protocol === 'file:') candidates.push(fromFileUrl(sourceCli));
  candidates.push('packages/cli/bin/netscript-dev.ts', 'packages/cli/bin/netscript.ts');
  for (const entrypoint of candidates) {
    if (await context.fileSystem.exists(entrypoint)) {
      const quote = (path: string): string => JSON.stringify(path.replaceAll('\\', '/'));
      return `deno run -A ${quote(entrypoint)} generate plugins --project-root ${
        quote(context.workspaceRoot)
      }`;
    }
  }
  return `deno run -A jsr:@netscript/plugin-workers@${PLUGIN_PACKAGE_VERSION}/cli compile-registry`;
}

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
        ? `Missing ${WORKERS_JOB_REGISTRY_PATH}. Run: ${await registryRemediation(context)}`
        : WORKERS_JOB_REGISTRY_PATH,
    };
  },
}, {
  name: 'generated job registry is initialized',
  async run(context) {
    const source = await readWorkersRegistry(context);
    const hasLegacyEntries = source !== undefined &&
      /jobDefinitionEntries[\s\S]*?\[\s*\[/.test(source);
    const hasLiteralDefinitions = source !== undefined &&
      /export const jobDefinitionsById[\s\S]*?\[[^\]]+\]\s*:\s*create(?:Local|Configured|Plugin)JobDefinition\(/
        .test(
          source,
        );
    const populated = hasLegacyEntries || hasLiteralDefinitions;
    return {
      name: 'generated job registry is initialized',
      ok: populated || isEmptyWorkersRegistry(source),
      message: populated
        ? 'Generated job definitions are present.'
        : isEmptyWorkersRegistry(source)
        ? 'Empty job registry; the processors can start idle with zero definitions.'
        : `Job registry is incomplete. Run: ${await registryRemediation(context)}`,
    };
  },
}, {
  name: 'every declared job is registered',
  async run(context) {
    const source = await readWorkersRegistry(context);
    const declared = source?.match(/^import (?:\* as )?(?:job\d+|\w+Handler) from /gm)
      ?.length ?? 0;
    const compiledHandlers = source?.match(/\bresolveJobHandler\(/g)?.length ?? 0;
    const generatedHandlers = source?.match(/\[job\d+\.id, job\d+\]/g)?.length ?? 0;
    const definitions =
      source?.match(/(?:[:,])\s*create(?:Local|Configured|Plugin)JobDefinition\(/g)?.length ?? 0;
    const loadable = source !== undefined &&
      source.includes('export const jobDefinitions') &&
      source.includes('export const registry') &&
      (declared > 0 || isEmptyWorkersRegistry(source)) &&
      compiledHandlers + generatedHandlers === declared &&
      definitions === declared;
    return {
      name: 'every declared job is registered',
      ok: loadable,
      message: loadable
        ? `${declared} declared job(s) are present in handler and definition maps.`
        : `Registry is incomplete for worker processors. Run: ${await registryRemediation(
          context,
        )}`,
    };
  },
}];

/** Recognize complete empty handler and definition maps emitted by both job writers. */
function isEmptyWorkersRegistry(source: string | undefined): boolean {
  return source !== undefined &&
    /export const jobHandlersById[^=]*=\s*Object\.freeze\(\s*\{\s*\}\s*\)/.test(source) &&
    /export const jobDefinitionsById[^=]*=\s*Object\.freeze\(\s*\{\s*\}\s*\)/.test(source) &&
    source.includes('export const jobDefinitions') &&
    source.includes('export const registry');
}

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const workersAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-workers',
  kind: 'workers',
  displayName: 'Background Workers',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-workers@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: workersStarterResources,
    configParams: ['WORKERS_API_URL', WORKERS_CONCURRENCY_ENV],
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
