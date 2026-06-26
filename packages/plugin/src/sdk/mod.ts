/**
 * SDK discovery ports, alpha implementations, and runtime stubs for plugin hosts.
 *
 * `ModuleManifestResolver` dynamically imports plugin manifest modules at runtime. Static publish
 * checks may report that import as unanalyzable; host tooling is responsible for passing resolvable
 * package or file specifiers when using the resolver.
 *
 * @module
 */

export { AstExtractor } from './discovery/ast-extractor.ts';
export { FilesystemWalker } from './discovery/filesystem-walker.ts';
export { MemoryManifestResolver, ModuleManifestResolver } from './discovery/manifest-resolver.ts';
export type { ModuleManifestResolverOptions } from './discovery/manifest-resolver.ts';
export { RegistryEmitter } from './discovery/registry-emitter.ts';
export { createSourceGraph } from './discovery/source-graph.ts';
export type { SourceGraph } from './discovery/source-graph.ts';
export { createWatcherHandle } from './discovery/watcher.ts';
export type { WatcherHandle } from './discovery/watcher.ts';
export type { EmitterPort, RegistryEmission } from './discovery/ports/emitter-port.ts';
export type { ExtractedContribution, ExtractorPort } from './discovery/ports/extractor-port.ts';
export type { ManifestResolverPort } from './discovery/ports/manifest-resolver-port.ts';
export type { WalkedFile, WalkerPort } from './discovery/ports/walker-port.ts';
export { runWalkerPipeline } from './application/run-walker-pipeline.ts';
export type { RunWalkerPipelineOptions } from './application/run-walker-pipeline.ts';
export { startWalker } from './presets/start-walker.ts';
export { startWatcher } from './presets/start-watcher.ts';
export { createInstrumentationBridge } from './runtime/instrumentation-bridge.ts';
export type { InstrumentationBridge } from './runtime/instrumentation-bridge.ts';
export { createPluginContext } from './runtime/plugin-context.ts';
export type { PluginContext, PluginLogger } from '../domain/mod.ts';
export { createPluginHostBootstrap } from './runtime/plugin-host-bootstrap.ts';
export type { PluginHostBootstrap } from './runtime/plugin-host-bootstrap.ts';
export type {
  BackgroundProcessorContribution,
  ContractVersionContribution,
  DbSchemaContribution,
  E2eContribution,
  MigrationContribution,
  PluginContributions,
  PluginDependencies,
  PluginLifecycleHooks,
  PluginManifest,
  PluginMetadata,
  PluginMetadataValue,
  PluginType,
  RuntimeConfigTopicContribution,
  ServiceContribution,
  StreamTopicContribution,
  TelemetryContribution,
} from '../config/mod.ts';
export type { PluginServiceContext } from './runtime/plugin-service-context.ts';
export { runDoctorReport } from './runtime/doctor-runner.ts';
export type { DoctorCheck, DoctorReport } from '../cli/mod.ts';
