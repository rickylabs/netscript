/** NetScript adapter contract for the sagas plugin.
 *
 * @module
 */

import type {
  DoctorCheckSpec,
  InstallStarterResource,
  NetScriptPlugin,
  PluginCommandContext,
} from '@netscript/plugin/adapter';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import { SAGAS_REGISTRY_PATH } from '../cli/registry-generator.ts';
import {
  barrelScaffolder,
  DEFAULT_BARREL_INPUT,
  DEFAULT_RUNTIME_GLUE_INPUT,
  DEFAULT_SAGA_INPUT,
  runtimeGlueScaffolder,
  sagaResource,
} from './resources/mod.ts';

/** Starter resources emitted by the sagas install command. */
export const sagasStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: sagaResource.scaffolder, input: DEFAULT_SAGA_INPUT },
  { scaffolder: barrelScaffolder, input: DEFAULT_BARREL_INPUT },
  { scaffolder: runtimeGlueScaffolder, input: DEFAULT_RUNTIME_GLUE_INPUT },
];

const GENERATE_SAGA_REGISTRY = 'netscript plugin sagas generate-registry';

async function readSagaRegistry(context: PluginCommandContext): Promise<string | undefined> {
  if (!await context.fileSystem.exists(SAGAS_REGISTRY_PATH)) return undefined;
  return await context.fileSystem.readText(SAGAS_REGISTRY_PATH);
}

const sagaRegistryChecks: readonly DoctorCheckSpec[] = [{
  name: 'generated saga registry exists',
  async run(context) {
    const source = await readSagaRegistry(context);
    return {
      name: 'generated saga registry exists',
      ok: source !== undefined,
      message: source === undefined
        ? `Missing ${SAGAS_REGISTRY_PATH}. Run: ${GENERATE_SAGA_REGISTRY}`
        : SAGAS_REGISTRY_PATH,
    };
  },
}, {
  name: 'generated saga registry is non-empty',
  async run(context) {
    const source = await readSagaRegistry(context);
    const populated = source !== undefined && /const entries[^=]*=\s*\[\s*\[/.test(source);
    return {
      name: 'generated saga registry is non-empty',
      ok: populated,
      message: populated
        ? 'Generated saga definitions are present.'
        : `No generated sagas are registered. Run: ${GENERATE_SAGA_REGISTRY}`,
    };
  },
}, {
  name: 'every declared saga is registered',
  async run(context) {
    const source = await readSagaRegistry(context);
    const declared = source?.match(/import \* as saga\d+ /g)?.length ?? 0;
    const registered = source?.match(/resolveSagaDefinition\(saga\d+,/g)?.length ?? 0;
    const loadable = source !== undefined &&
      source.includes('export const sagaRegistry') &&
      source.includes('export const registry') &&
      declared > 0 && registered === declared * 2;
    return {
      name: 'every declared saga is registered',
      ok: loadable,
      message: loadable
        ? `${declared} declared saga(s) are present in the runtime map.`
        : `Registry is incomplete for saga runners. Run: ${GENERATE_SAGA_REGISTRY}`,
    };
  },
}];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const sagasAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-sagas',
  kind: 'sagas',
  displayName: 'Saga Orchestrator',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-sagas@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: sagasStarterResources,
    configParams: ['SAGAS_API_URL', 'SAGA_CONCURRENCY'],
    wiringEntry: '@netscript/plugin-sagas-core/stores',
  },
  doctor: {
    healthEndpoint: '/sagas/health',
    requiredConfigKeys: ['SAGAS_API_URL'],
    extraChecks: sagaRegistryChecks,
  },
  info: {
    capabilities: [
      'durable saga orchestration',
      'saga API endpoints',
      'saga runtime registries',
      'database-backed saga state',
    ],
    versionSource: 'package',
  },
  update: {
    strategy: 'dependency',
    targetSpecifier: `jsr:@netscript/plugin-sagas@${PLUGIN_PACKAGE_VERSION}`,
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [sagaResource],
};
