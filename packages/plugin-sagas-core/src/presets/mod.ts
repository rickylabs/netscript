/**
 * Preset composition helpers for starting saga handlers and runtimes.
 *
 * @module
 */

export type { SagaDefinition } from '../domain/mod.ts';
export type {
  CreateSagaRuntimeOptions,
  SagaRuntime,
  SagaRuntimeAdapter,
  SagaRuntimeNativeOptions,
} from '../runtime/mod.ts';
export { startSagaHandlers, startSagas } from './start-sagas.ts';
export type { StartSagasOptions, StartSagasResult } from './start-sagas.ts';
