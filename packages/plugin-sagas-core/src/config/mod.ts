/**
 * @module @netscript/plugin-sagas-core/config
 *
 * Config-time saga builders and schema exports for `netscript.config.ts`.
 */

export { defineSagaConfig } from './define-saga-config.ts';
export type { ConfigSchema, ConfigSchemaResult } from './config-schema.ts';
export type { SagaId } from '../domain/mod.ts';
export type {
  SagaConfigBuilder,
  SagaConfigBuilderState,
  SagaConfigEntry,
  SagaConfigRetryOptions,
  SagaConfigTimeoutOptions,
} from './define-saga-config.ts';
export {
  SagaConfigSchema,
  SagaGroupSchema,
  SagaRetryConfigSchema,
  SagaTimeoutConfigSchema,
} from './saga-config-schema.ts';
export type {
  SagaConfig,
  SagaConfigData,
  SagaConfigInput,
  SagaGroupConfig,
  SagaGroupConfigData,
  SagaRetentionConfigData,
  SagaRetryConfig,
  SagaScalingConfigData,
  SagaStoreProvider,
  SagaTimeoutConfig,
  SagaTransportProvider,
} from './saga-config-schema.ts';
