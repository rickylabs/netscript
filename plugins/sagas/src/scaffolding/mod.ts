/**
 * Scaffolding helpers for generated saga definitions and runtime registries.
 *
 * @module
 */

export {
  createSagaEntrypoint,
  isSagasScaffoldInput,
  renderStringArray,
  resolveCompletedStatus,
  resolveInitialStatus,
  resolveMessageType,
  SAGAS_SCAFFOLD_DURABILITY_TIERS,
  toSagaExportName,
  toSagaFileStem,
} from './input.ts';
export type { SagasScaffoldDurabilityTier, SagasScaffoldInput } from './input.ts';
export { SagaConfigScaffolder, SagaDefinitionScaffolder } from './saga-scaffolders.ts';
export { SagasItemScaffolder } from './sagas-item-scaffolder.ts';
export { SAGAS_RUNTIME_SCAFFOLD_MANIFEST } from './runtime-scaffold.ts';
export type {
  SagasBackgroundSampleRule,
  SagasManagedSampleMatcher,
  SagasRuntimeRegistryGenerator,
  SagasRuntimeRegistryTarget,
  SagasRuntimeScaffoldManifest,
} from './runtime-scaffold.ts';
export { createSagasItemScaffolders } from './starter.ts';
export { SAGAS_PLUGIN_ID, SAGAS_PLUGIN_VERSION } from '../constants.ts';
