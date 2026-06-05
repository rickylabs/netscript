/** Resource lifecycle state managed during shutdown. */
export type ShutdownState = 'running' | 'shutting-down' | 'stopped';

/** Resource registered for graceful shutdown. */
export type ShutdownResource = Readonly<{
  id: string;
  priority?: number;
  stop(reason?: string): Promise<void>;
}>;

/** Options for creating or invoking a shutdown manager. */
export type ShutdownManagerOptions = Readonly<{
  timeoutMs?: number;
}>;

/** Result returned after a shutdown attempt. */
export type ShutdownReport = Readonly<{
  state: ShutdownState;
  stopped: readonly string[];
  failed: readonly Readonly<{ id: string; error: string }>[];
  timedOut: boolean;
}>;

/** Coordinates graceful shutdown for runtime resources. */
export class ShutdownManager {
  readonly #resources = new Map<string, ShutdownResource>();
  readonly #waiters = new Set<() => void>();
  readonly #timeoutMs: number;
  #state: ShutdownState = 'running';
  #shutdownPromise?: Promise<ShutdownReport>;

  constructor(options: ShutdownManagerOptions = {}) {
    this.#timeoutMs = options.timeoutMs ?? 30_000;
  }

  get state(): ShutdownState {
    return this.#state;
  }

  register(resource: ShutdownResource): void {
    this.#resources.set(resource.id, resource);
  }

  unregister(id: string): void {
    this.#resources.delete(id);
  }

  createAbortController(): AbortController {
    const controller = new AbortController();
    if (this.#state !== 'running') {
      controller.abort();
      return controller;
    }
    this.waitForShutdown().then(() => controller.abort());
    return controller;
  }

  waitForShutdown(): Promise<void> {
    if (this.#state !== 'running') {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.#waiters.add(resolve));
  }

  shutdown(reason?: string, options: ShutdownManagerOptions = {}): Promise<ShutdownReport> {
    if (this.#shutdownPromise) {
      return this.#shutdownPromise;
    }

    this.#state = 'shutting-down';
    for (const waiter of this.#waiters) {
      waiter();
    }
    this.#waiters.clear();

    this.#shutdownPromise = this.stopResources(reason, options.timeoutMs ?? this.#timeoutMs);
    return this.#shutdownPromise;
  }

  private async stopResources(
    reason: string | undefined,
    timeoutMs: number,
  ): Promise<ShutdownReport> {
    const stopped: string[] = [];
    const failed: Array<Readonly<{ id: string; error: string }>> = [];
    const resources = [...this.#resources.values()].sort(
      (left, right) => (right.priority ?? 0) - (left.priority ?? 0),
    );

    let timedOut = false;
    const stopAll = Promise.all(resources.map(async (resource) => {
      try {
        await resource.stop(reason);
        stopped.push(resource.id);
      } catch (error) {
        failed.push({
          error: error instanceof Error ? error.message : String(error),
          id: resource.id,
        });
      }
    }));

    const timeout = new Promise<void>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve();
      }, timeoutMs);
    });

    await Promise.race([stopAll.then(() => undefined), timeout]);
    this.#state = 'stopped';

    return Object.freeze({
      failed: Object.freeze(failed),
      state: this.#state,
      stopped: Object.freeze(stopped),
      timedOut,
    });
  }
}
