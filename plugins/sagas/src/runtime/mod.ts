/**
 * @module @netscript/plugin-sagas/runtime
 *
 * Plugin-layer publisher, runner, and supervisor processes.
 */

export { createSagaPublisher, HttpSagaPublisher } from './saga-publisher.ts';
export { loadSagaRegistryModule, runSagaRunner, startSagaRunner } from './saga-runner.ts';
export { SagaRuntimeSupervisor } from './saga-supervisor.ts';
export type {
  HttpSagaPublisherOptions,
  SagaPublisherEnvReader,
  SagaPublisherFetch,
  SagaPublisherJsonObject,
  SagaPublisherJsonPrimitive,
  SagaPublisherJsonValue,
} from './saga-publisher.ts';
export type {
  RunSagaRunnerOptions,
  SagaRunnerEnvReader,
  SagaRuntimeModuleImporter,
  StartSagaRunnerOptions,
} from './saga-runner.ts';
export type {
  SagaDefinitionRegistryLoader,
  SagaRuntimeFactory,
  SagaRuntimeSupervisorOptions,
  SagaRuntimeSupervisorSnapshot,
  SagaRuntimeSupervisorStatus,
} from './saga-supervisor.ts';
export { SAGAS_API_DEFAULT_PORT, SAGAS_API_SERVICE_NAME, SAGAS_PLUGIN_ID } from '../constants.ts';
