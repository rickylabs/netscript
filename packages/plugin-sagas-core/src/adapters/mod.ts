/**
 * @module @netscript/plugin-sagas-core/adapters
 *
 * Saga bus adapter implementations.
 */

export { createSagaBusLegacy, SagaBusLegacy } from './saga-bus-legacy.ts';
export { createSagaBusBridge, SagaBusBridge } from './saga-bus-bridge.ts';
export type { SagaBridgeCompensationResolver, SagaBusBridgeOptions } from './saga-bus-bridge.ts';
export type {
  SagaBusLegacyBus,
  SagaBusLegacyDefinitionMapper,
  SagaBusLegacyFactory,
  SagaBusLegacyLogger,
  SagaBusLegacyMachine,
  SagaBusLegacyOptions,
} from './saga-bus-legacy.ts';
