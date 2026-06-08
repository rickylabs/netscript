/**
 * FileWatcher — Composable File-Watching Pipeline
 *
 * Composes a watch strategy with a filter pipeline to produce a single
 * stream of validated, deduplicated, and stable file events.
 *
 * Pipeline: Strategy → Glob → Size → Stability → Dedup → Yield
 *
 * @module
 */

import type { WatcherOptions, WatchEvent, WatchFilter, WatchStrategyHandler } from './types.ts';
import { PollingStrategy } from './strategies/polling.ts';
import { HybridStrategy } from './strategies/hybrid.ts';
import { GlobFilter } from './filters/glob.ts';
import { StabilityFilter } from './filters/stability.ts';
import { DedupFilter } from './filters/dedup.ts';
import { isAbsolute, normalize, resolve, toNamespacedPath } from '@std/path';

/**
 * Detect whether a path is likely a network mount (UNC path, SMB, NFS).
 *
 * Uses `@std/path/to-namespaced-path` on Windows to detect UNC paths
 * via the `\\?\UNC\` prefix that Windows applies to network locations.
 * On POSIX, checks for protocol-style network URIs.
 *
 * @param watchPath - Filesystem path to check.
 * @returns `true` if the path appears to be a network location.
 */
function isNetworkPath(watchPath: string): boolean {
  const normalized = normalize(watchPath);

  if (Deno.build.os === 'windows') {
    // toNamespacedPath converts UNC paths (\\server\share) to \\?\UNC\server\share
    const namespaced = toNamespacedPath(normalized);
    if (namespaced.startsWith('\\\\?\\UNC\\')) return true;
    // Also detect raw UNC that normalize preserves
    if (normalized.startsWith('\\\\')) return true;
  } else {
    // POSIX: double-slash UNC-style mounts
    if (normalized.startsWith('//')) return true;
  }

  // Protocol-style network URIs (platform-agnostic)
  return normalized.startsWith('smb://') || normalized.startsWith('nfs://');
}

/**
 * Resolve and validate watch paths, ensuring they exist and are accessible.
 *
 * Resolves relative paths to absolute, follows symlinks via `Deno.realPath()`,
 * and verifies directory access with typed `Deno.errors` for clear diagnostics.
 *
 * **Network paths** (UNC `\\server\share`, `//server/share`) are treated
 * leniently: if validation fails (e.g. the service account lacks network
 * credentials), the path is included as-is with a warning. The
 * {@linkcode PollingStrategy}'s `AccessFailureTracker` handles persistent
 * failures gracefully at runtime, avoiding a fatal crash on startup.
 *
 * @param paths - Raw paths from watcher options.
 * @returns Array of resolved absolute paths.
 * @throws {Deno.errors.NotFound} If a **local** path does not exist.
 * @throws {Deno.errors.PermissionDenied} If read access is denied for a **local** path.
 */
async function resolveAndValidatePaths(paths: readonly string[]): Promise<string[]> {
  const resolved: string[] = [];

  for (const raw of paths) {
    const absolute = isAbsolute(raw) ? normalize(raw) : resolve(raw);
    const network = isNetworkPath(raw);

    try {
      // Resolve symlinks to their real target
      const real = await Deno.realPath(absolute);
      // Verify it's a directory we can read
      const stat = await Deno.lstat(real);
      if (!stat.isDirectory && !stat.isSymlink) {
        throw new Deno.errors.NotADirectory(
          `Watch path is not a directory: ${raw} (resolved: ${real})`,
        );
      }
      resolved.push(real);
    } catch (error: unknown) {
      // Network paths: warn and include as-is — the PollingStrategy's
      // AccessFailureTracker will handle persistent failures at runtime.
      if (network) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(
          `[watchers] Network path not accessible during init, will retry at runtime: ${raw} (${reason})`,
        );
        resolved.push(absolute);
        continue;
      }

      if (error instanceof Deno.errors.NotFound) {
        throw new Deno.errors.NotFound(
          `Watch path does not exist: ${raw} (resolved: ${absolute})`,
        );
      }
      if (error instanceof Deno.errors.PermissionDenied) {
        throw new Deno.errors.PermissionDenied(
          `No read permission for watch path: ${raw} (resolved: ${absolute})`,
        );
      }
      if (error instanceof Deno.errors.NotADirectory) {
        throw error;
      }
      throw error;
    }
  }

  return resolved;
}

/**
 * Create the appropriate watch strategy based on options.
 *
 * Selection logic:
 * 1. `forcePolling: true` → {@linkcode PollingStrategy}
 * 2. Any network path detected → {@linkcode PollingStrategy}
 * 3. Otherwise → {@linkcode HybridStrategy} (native with polling fallback)
 */
function createStrategy(options: WatcherOptions): WatchStrategyHandler {
  if (options.forcePolling) {
    return new PollingStrategy({
      paths: options.paths,
      patterns: options.patterns,
      events: options.events,
      pollIntervalMs: options.pollIntervalMs,
      signal: options.signal,
    });
  }

  const hasNetworkPaths = options.paths.some(isNetworkPath);
  if (hasNetworkPaths) {
    return new PollingStrategy({
      paths: options.paths,
      patterns: options.patterns,
      events: options.events,
      pollIntervalMs: options.pollIntervalMs,
      signal: options.signal,
    });
  }

  return new HybridStrategy({
    paths: options.paths,
    patterns: options.patterns,
    events: options.events,
    pollIntervalMs: options.pollIntervalMs,
    signal: options.signal,
  });
}

/** Build the filter pipeline based on watcher options. */
function buildFilters(options: WatcherOptions): WatchFilter[] {
  const filters: WatchFilter[] = [];

  // Glob filter (skip for native strategy which relies on post-filtering)
  const patterns = options.patterns ?? ['*'];
  if (patterns.length > 0 && !(patterns.length === 1 && patterns[0] === '*')) {
    filters.push(new GlobFilter(patterns));
  }

  // Stability filter
  if (options.stabilityThreshold) {
    filters.push(new StabilityFilter(options.stabilityThreshold, options.signal));
  }

  // Content hash dedup filter
  if (options.contentHash !== false) {
    filters.push(new DedupFilter());
  }

  return filters;
}

/**
 * Composable file watcher that combines a strategy with a filter pipeline.
 *
 * The watcher auto-selects the best strategy based on the configured paths:
 * - Local paths → native OS notifications with polling fallback
 * - Network paths → polling
 * - `forcePolling: true` → polling
 *
 * @example
 * ```ts
 * import { FileWatcher } from '@netscript/watchers';
 *
 * const controller = new AbortController();
 * const watcher = new FileWatcher({
 *   paths: ['./incoming'],
 *   patterns: ['*.csv'],
 *   events: ['create'],
 *   stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
 *   signal: controller.signal,
 * });
 *
 * for await (const event of watcher.watch()) {
 *   console.log(`${event.kind}: ${event.path}`);
 * }
 * ```
 */
export class FileWatcher {
  private strategy: WatchStrategyHandler | null = null;
  private filters: WatchFilter[] = [];
  private readonly options: WatcherOptions;
  private readonly abortController: AbortController;
  private _running = false;

  constructor(options: WatcherOptions) {
    this.options = options;
    this.abortController = new AbortController();

    // Chain the external signal to our internal controller
    if (options.signal) {
      options.signal.addEventListener('abort', () => this.abortController.abort(), { once: true });
    }
  }

  /**
   * Initialize strategy and filters with validated paths.
   * Called lazily on first `watch()` to allow async path validation.
   */
  private async init(): Promise<void> {
    // Validate and resolve paths (symlinks, permissions, existence)
    const resolvedPaths = await resolveAndValidatePaths(this.options.paths);

    const internalOptions: WatcherOptions = {
      ...this.options,
      paths: resolvedPaths,
      signal: this.abortController.signal,
    };
    this.strategy = createStrategy(internalOptions);
    this.filters = buildFilters(internalOptions);
  }

  /**
   * Start watching and yield file events through the filter pipeline.
   *
   * Validates paths on first call (existence, permissions, symlink resolution).
   * Events pass through: Strategy → Filters (in order) → Yield.
   */
  async *watch(): AsyncGenerator<WatchEvent> {
    this._running = true;

    try {
      if (!this.strategy) {
        await this.init();
      }

      // Start with the strategy's raw event stream
      let stream: AsyncIterable<WatchEvent> = this.strategy!.watch();

      // Apply each filter in the pipeline
      for (const filter of this.filters) {
        stream = filter.apply(stream);
      }

      // Size filter (inline — too simple for a separate class)
      const minFileSize = this.options.minFileSize ?? 0;

      for await (const event of stream) {
        // Skip files below minimum size (except remove events)
        if (event.kind !== 'remove' && minFileSize > 0 && event.fileInfo) {
          if (event.fileInfo.size < minFileSize) continue;
        }

        yield event;
      }
    } finally {
      this._running = false;
    }
  }

  /** Stop the watcher by signaling abort. */
  stop(): void {
    this.abortController.abort();
  }

  /** Whether the watcher is currently running. */
  get running(): boolean {
    return this._running;
  }
}

/**
 * Factory function to create a {@linkcode FileWatcher} with the given options.
 *
 * @param options - Watcher configuration.
 * @returns A new {@linkcode FileWatcher} instance.
 *
 * @example
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const watcher = createWatcher({
 *   paths: ['./shared/incoming/sales'],
 *   patterns: ['*.csv'],
 *   events: ['create'],
 * });
 *
 * for await (const event of watcher.watch()) {
 *   console.log(event);
 * }
 * ```
 */
export function createWatcher(options: WatcherOptions): FileWatcher {
  return new FileWatcher(options);
}
