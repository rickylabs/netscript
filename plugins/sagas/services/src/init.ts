/**
 * Sagas Plugin Initialization
 *
 * Registers saga definitions from configuration on startup.
 *
 * @module
 */

import {
  loadSagaRegistryModule,
  type SagaRuntimeModuleImporter,
} from '../../src/runtime/saga-runner.ts';
import {
  type ProjectRegistryModuleOptions,
  resolveProjectRegistryModule,
} from '../../src/runtime/project-registry-module.ts';
import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import { registerSagaDefinitions } from './saga-registry.ts';

/** Inputs used to load and register service-side saga definitions. */
export type RegisterSagasOptions =
  & ProjectRegistryModuleOptions
  & Readonly<{
    importer?: SagaRuntimeModuleImporter;
    registerDefinitions?: (definitions: readonly SagaDefinition[]) => Promise<unknown>;
  }>;

/**
 * Register sagas from netscript.config.ts on startup.
 *
 * This loads saga definitions and registers them with the SagaRegistry.
 * The actual saga processor runs separately (in the sagas/ directory).
 */
export async function registerSagas(
  options: RegisterSagasOptions = {},
): Promise<readonly SagaDefinition[]> {
  const registryModule = resolveProjectRegistryModule(options);
  const definitions = await loadSagaRegistryModule(registryModule, options.importer);
  await (options.registerDefinitions ?? registerSagaDefinitions)(definitions);
  return definitions;
}
