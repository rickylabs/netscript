/**
 * @module @netscript/plugin-workers
 *
 * Public plugin manifest for NetScript background workers.
 */

export { inspectWorkers, workersPlugin } from './src/public/mod.ts';
export type {
  WorkersPluginContributions,
  WorkersPluginDependencies,
  WorkersPluginDependencyManifest,
  WorkersPluginInspection,
  WorkersPluginManifest,
} from './src/public/mod.ts';
