/**
 * Sagas Plugin Initialization
 *
 * Registers saga definitions from configuration on startup.
 *
 * @module
 */

import { loadSagaRegistryModule } from '../../src/runtime/saga-runner.ts';
import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import { registerSagaDefinitions } from './saga-registry.ts';

const DEFAULT_REGISTRY_MODULE = '../../../../.netscript/generated/plugin-sagas/sagas.registry.ts';

/**
 * Register sagas from netscript.config.ts on startup.
 *
 * This loads saga definitions and registers them with the SagaRegistry.
 * The actual saga processor runs separately (in the sagas/ directory).
 */
export async function registerSagas(): Promise<readonly SagaDefinition[]> {
  const definitions = await loadSagaRegistryModule(
    new URL(DEFAULT_REGISTRY_MODULE, import.meta.url).href,
  );
  await registerSagaDefinitions(definitions);
  return definitions;
}
