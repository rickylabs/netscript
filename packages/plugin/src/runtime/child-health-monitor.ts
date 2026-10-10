import {
  CHILD_CRASH_LOOP_THRESHOLD,
  type ChildFatalError,
  type ChildHealthSnapshot,
  type ChildHealthState,
} from '../domain/child-health.ts';

/**
 * Tracks child readiness and bounded restart history using an injectable clock.
 *
 * Crash-looping clears after a full window of uninterrupted running; a brief successful restart
 * cannot make a restart storm green. Raw exception details never enter this monitor.
 *
 * @example
 * ```ts
 * import { ChildHealthMonitor } from '@netscript/plugin/health';
 * const health = new ChildHealthMonitor();
 * health.registryLoaded();
 * health.dependenciesReady();
 * health.running();
 * console.log(health.snapshot().state); // ready
 * ```
 */
export class ChildHealthMonitor {
  #state: ChildHealthState = 'starting';
  #registryReady = false;
  #dependencyReady = false;
  #restartCount = 0;
  #lastFatalError: ChildFatalError | null = null;
  #restarts: number[] = [];
  #crashLooping = false;
  #runningSince: number | undefined;
  readonly #now: () => number;

  /** Create a monitor; the clock supplies epoch milliseconds. */
  constructor(now: () => number = Date.now) {
    this.#now = now;
  }

  /** Begin a new bootstrap attempt while retaining restart history. */
  starting(): void {
    this.#runningSince = undefined;
    this.#registryReady = false;
    this.#dependencyReady = false;
    this.#state = this.#crashLooping ? 'crash-looping' : 'starting';
  }

  /** Record successful static registry load and validation. */
  registryLoaded(): void {
    this.#registryReady = true;
  }

  /** Record successful startup dependency checks. */
  dependenciesReady(): void {
    this.#dependencyReady = true;
  }

  /** Mark listeners running; readiness still requires registry and dependencies. */
  running(): void {
    if (this.#state === 'stopped') return;
    this.#runningSince ??= this.#now();
    this.#state = this.#crashLooping ? 'crash-looping' : 'ready';
  }

  /** Record one attempted restart and latch a restart storm. */
  restarting(): void {
    this.#runningSince = undefined;
    const now = this.#now();
    this.#restartCount = Math.min(Number.MAX_SAFE_INTEGER, this.#restartCount + 1);
    this.#restarts = this.#restarts.filter((at) => now - at <= CHILD_CRASH_LOOP_THRESHOLD.windowMs);
    this.#restarts.push(now);
    this.#restarts = this.#restarts.slice(-CHILD_CRASH_LOOP_THRESHOLD.restarts);
    this.#crashLooping ||= this.#restarts.length >= CHILD_CRASH_LOOP_THRESHOLD.restarts;
    this.#state = this.#crashLooping ? 'crash-looping' : 'degraded';
    this.#dependencyReady = false;
    this.#recordIncident(now);
  }

  /** Record a fatal startup or listener failure without exposing raw details. */
  failed(): void {
    this.#runningSince = undefined;
    this.#state = this.#crashLooping ? 'crash-looping' : 'failed';
    this.#dependencyReady = false;
    this.#recordIncident(this.#now());
  }

  /** Record clean shutdown while preserving bounded incident history. */
  stopped(): void {
    this.#runningSince = undefined;
    this.#state = 'stopped';
    this.#dependencyReady = false;
  }

  /** Return an immutable public payload. */
  snapshot(): ChildHealthSnapshot {
    if (
      this.#crashLooping && this.#runningSince !== undefined &&
      this.#registryReady && this.#dependencyReady &&
      this.#now() - this.#runningSince >= CHILD_CRASH_LOOP_THRESHOLD.windowMs
    ) {
      this.#crashLooping = false;
      this.#restarts = [];
      this.#state = 'ready';
    }
    const state = this.#state === 'ready' && (!this.#registryReady || !this.#dependencyReady)
      ? 'degraded'
      : this.#state;
    return Object.freeze({
      state,
      registryReady: this.#registryReady,
      dependencyReady: this.#dependencyReady,
      restartCount: this.#restartCount,
      lastFatalError: this.#lastFatalError,
    });
  }

  #recordIncident(timestamp: number): void {
    this.#lastFatalError = Object.freeze({
      message: 'Background child failed (details redacted).',
      timestamp,
    });
  }
}
