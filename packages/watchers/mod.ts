/**
 * @netscript/watchers — Reusable file-watching primitives.
 *
 * Provides composable strategies, filters, and a pipeline-based
 * {@linkcode FileWatcher} for detecting file system changes across
 * local and network filesystems.
 *
 * @example Basic file watching with lifecycle-safe cancellation
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const controller = new AbortController();
 * const watcher = createWatcher({
 *   paths: ['./incoming'],
 *   patterns: ['*.csv'],
 *   events: ['create'],
 *   processExisting: true,
 *   maxFileAge: 86400000,
 *   debounceMs: 500,
 *   stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
 *   signal: controller.signal,
 * });
 *
 * try {
 *   for await (const event of watcher.watch()) {
 *     console.log(`${event.kind}: ${event.path}`);
 *   }
 * } finally {
 *   watcher.stop();
 * }
 * ```
 *
 * @module
 */

export * from './src/public/mod.ts';
