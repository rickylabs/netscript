import {
  ChildHealthMonitor,
  type ChildHealthMonitorOptions,
  type ChildHealthSnapshot,
} from '@netscript/plugin/health';
import { FILE_WATCH_STATES } from '@netscript/plugin-triggers-core/ports';
import type { FileWatchStatusEvent } from '@netscript/plugin-triggers-core/ports';
import type { TriggerId } from '@netscript/plugin-triggers-core/domain';

const [, UNAVAILABLE] = FILE_WATCH_STATES;

/**
 * Child readiness together with the availability of each registered file-watch source.
 *
 * A missing watch root does not prevent scheduled or other triggers from processing.
 * Inspect `fileWatches` for source availability independently of overall child readiness.
 *
 * @example
 * ```ts
 * import type { TriggerHealthSnapshot } from '@netscript/plugin-triggers/runtime';
 * declare const snapshot: TriggerHealthSnapshot;
 * const unavailable = snapshot.fileWatches.filter((watch) => watch.state === 'unavailable');
 * console.log(unavailable.map((watch) => watch.triggerId));
 * ```
 */
export type TriggerHealthSnapshot =
  & ChildHealthSnapshot
  & Readonly<{ fileWatches: readonly FileWatchStatusEvent[] }>;

/**
 * Adds per-trigger watch availability to the existing background child health payload.
 *
 * @example
 * ```ts
 * import { TriggerHealthMonitor } from '@netscript/plugin-triggers/runtime';
 * const health = new TriggerHealthMonitor();
 * console.log(health.snapshot().fileWatches); // []
 * ```
 */
export class TriggerHealthMonitor extends ChildHealthMonitor {
  readonly #fileWatches = new Map<string, FileWatchStatusEvent>();
  readonly #now: () => number;

  /** Create a health monitor with an optional epoch-millisecond clock. */
  constructor(now: () => number = Date.now, options: ChildHealthMonitorOptions = {}) {
    super(now, options);
    this.#now = now;
  }

  /** Clear previous registrations when the processor begins a fresh bootstrap. */
  override starting(): void {
    super.starting();
    this.#fileWatches.clear();
  }

  /** Register a source as unavailable until its watcher acquires resources. */
  registerWatch(triggerId: TriggerId): void {
    this.updateWatch({ triggerId, state: UNAVAILABLE, occurredAt: this.#timestamp() });
  }

  /** Record a watch transition without exposing raw filesystem errors. */
  updateWatch(event: FileWatchStatusEvent): void {
    const state = super.snapshot().state;
    if (state === 'stopped' || state === 'failed') return;
    this.#fileWatches.set(event.triggerId, Object.freeze({ ...event }));
  }

  /** Mark every source unavailable after its watch resources have drained. */
  override stopped(): void {
    super.stopped();
    this.#markUnavailable();
  }

  /** Mark sources unavailable when a fatal processor failure ends their lifetime. */
  override failed(): void {
    super.failed();
    this.#markUnavailable();
  }

  #markUnavailable(): void {
    for (const [id, event] of this.#fileWatches) {
      this.#fileWatches.set(
        id,
        Object.freeze({
          ...event,
          state: UNAVAILABLE,
          occurredAt: this.#timestamp(),
        }),
      );
    }
  }

  /** Return a deterministic immutable snapshot of child and per-watch health. */
  override snapshot(): TriggerHealthSnapshot {
    return Object.freeze({
      ...super.snapshot(),
      fileWatches: Object.freeze(
        [...this.#fileWatches.values()].sort((a, b) => a.triggerId.localeCompare(b.triggerId)),
      ),
    });
  }

  #timestamp(): string {
    return new Date(this.#now()).toISOString();
  }
}
