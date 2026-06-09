/**
 * @netscript/watchers — Reusable file-watching primitives.
 *
 * Provides composable strategies, filters, and a pipeline-based
 * {@linkcode FileWatcher} for detecting file system changes across
 * local and network filesystems.
 *
 * @example Basic file watching
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const watcher = createWatcher({
 *   paths: ['./incoming'],
 *   patterns: ['*.csv'],
 *   events: ['create'],
 *   stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
 * });
 *
 * for await (const event of watcher.watch()) {
 *   console.log(`${event.kind}: ${event.path}`);
 * }
 * ```
 *
 * @module
 */

export * from './src/public/mod.ts';
