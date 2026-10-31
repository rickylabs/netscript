import {
  CHILD_CRASH_LOOP_THRESHOLD,
  type ChildFatalError,
  type ChildHealthMonitorOptions,
  type ChildHealthSnapshot,
  type ChildHealthState,
} from '../domain/child-health.ts';
import type { ChildRestartHistoryPort } from '../ports/child-restart-history-port.ts';

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
  readonly #threshold: Readonly<{ restarts: number; windowMs: number }>;
  #history: ChildRestartHistoryPort | undefined;
  #processId = 0;
  #active = false;
  #processFailed = false;
  #historyFailed = false;

  /** Create a monitor; the clock supplies epoch milliseconds. */
  constructor(now: () => number = Date.now, options: ChildHealthMonitorOptions = {}) {
    this.#now = now;
    const threshold = options.crashLoopThreshold ?? CHILD_CRASH_LOOP_THRESHOLD;
    if (
      !Number.isSafeInteger(threshold.restarts) || threshold.restarts <= 0 ||
      !Number.isFinite(threshold.windowMs) || threshold.windowMs <= 0
    ) throw new RangeError('Invalid background child crash-loop threshold.');
    this.#threshold = Object.freeze({ ...threshold });
  }

  /** Attach single-owner durable process history before bootstrap; healthy watch reloads do not count. */
  trackProcess(history: ChildRestartHistoryPort, processId: number): void {
    if (this.#history) throw new Error('Background child process history is already attached.');
    if (!Number.isSafeInteger(processId) || processId < 0) {
      throw new RangeError('Invalid background child process identity.');
    }
    this.#history = history;
    this.#processId = processId;
    this.#active = true;
    try {
      const prior = history.read();
      if (prior) {
        this.#restartCount = prior.restartCount;
        this.#restarts = prior.restarts.slice(-this.#threshold.restarts);
        this.#crashLooping = prior.crashLooping;
        if (prior.failed || (prior.active && prior.processId !== processId)) this.restarting();
      }
      this.starting();
    } catch (cause) {
      this.#historyFailed = true;
      this.failed();
      throw cause;
    }
  }

  /** Begin a new bootstrap attempt while retaining restart history. */
  starting(): void {
    this.#runningSince = undefined;
    this.#registryReady = false;
    this.#dependencyReady = false;
    this.#state = this.#crashLooping ? 'crash-looping' : 'starting';
    this.#active = true;
    this.#processFailed = false;
    this.#persist();
  }

  /** Record successful static registry load and validation. */
  registryLoaded(): void {
    if (!this.#registryReady && this.#runningSince !== undefined) this.#runningSince = this.#now();
    this.#registryReady = true;
  }

  /** Record successful startup dependency checks. */
  dependenciesReady(): void {
    if (!this.#dependencyReady && this.#runningSince !== undefined) {
      this.#runningSince = this.#now();
    }
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
    this.#restarts = this.#restarts.filter((at) => now - at <= this.#threshold.windowMs);
    this.#restarts.push(now);
    this.#restarts = this.#restarts.slice(-this.#threshold.restarts);
    this.#crashLooping ||= this.#restarts.length >= this.#threshold.restarts;
    this.#state = this.#crashLooping ? 'crash-looping' : 'degraded';
    this.#dependencyReady = false;
    this.#recordIncident(now);
    this.#persist();
  }

  /** Record a fatal startup or listener failure without exposing raw details. */
  failed(): void {
    this.#runningSince = undefined;
    this.#state = this.#crashLooping ? 'crash-looping' : 'failed';
    this.#dependencyReady = false;
    this.#recordIncident(this.#now());
    this.#processFailed = true;
    this.#active = true;
    this.#persist();
  }

  /** Record clean shutdown while preserving bounded incident history. */
  stopped(): void {
    this.#runningSince = undefined;
    this.#state = 'stopped';
    this.#dependencyReady = false;
    this.#active = false;
    // A plugin's failure cleanup may stop listeners before the process wrapper observes failure.
    this.#persist();
  }

  /** Return an immutable public payload. */
  snapshot(): ChildHealthSnapshot {
    if (
      this.#crashLooping && this.#runningSince !== undefined &&
      this.#registryReady && this.#dependencyReady &&
      this.#now() - this.#runningSince >= this.#threshold.windowMs
    ) {
      this.#crashLooping = false;
      this.#restarts = [];
      this.#state = 'ready';
      this.#persist();
    }
    const state = this.#historyFailed
      ? 'failed'
      : this.#state === 'ready' && (!this.#registryReady || !this.#dependencyReady)
      ? 'degraded'
      : this.#state;
    return Object.freeze({
      state,
      registryReady: this.#registryReady,
      dependencyReady: !this.#historyFailed && this.#dependencyReady,
      restartCount: this.#restartCount,
      lastFatalError: this.#lastFatalError,
    });
  }

  #persist(): void {
    if (!this.#history || this.#historyFailed) return;
    try {
      this.#history.write({
        active: this.#active,
        failed: this.#processFailed,
        processId: this.#processId,
        restartCount: this.#restartCount,
        restarts: Object.freeze([...this.#restarts]),
        crashLooping: this.#crashLooping,
      });
    } catch (cause) {
      this.#historyFailed = true;
      this.#runningSince = undefined;
      this.#state = 'failed';
      this.#dependencyReady = false;
      this.#recordIncident(this.#now());
      throw cause;
    }
  }

  #recordIncident(timestamp: number): void {
    this.#lastFatalError = Object.freeze({
      message: 'Background child failed (details redacted).',
      timestamp,
    });
  }
}
