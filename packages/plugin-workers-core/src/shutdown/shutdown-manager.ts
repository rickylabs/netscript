/** Resource lifecycle state managed during shutdown. */
export type ShutdownState = 'running' | 'shutting-down' | 'stopped';

/** Resource registered for graceful shutdown. */
export type ShutdownResource = Readonly<{
  /** Stable resource identifier. */
  id: string;
  /** Stop ordering priority; higher values stop first. */
  priority?: number;
  /** Stops the resource during shutdown. */
  stop(reason?: string): Promise<void>;
}>;

/** Options for creating or invoking a shutdown manager. */
export type ShutdownManagerOptions = Readonly<{
  /** Maximum time to wait for resource shutdown. */
  timeoutMs?: number;
}>;

/** Result returned after a shutdown attempt. */
export type ShutdownReport = Readonly<{
  /** Final shutdown state. */
  state: ShutdownState;
  /** Resource ids that stopped successfully. */
  stopped: readonly string[];
  /** Resources that failed to stop. */
  failed: readonly Readonly<{ id: string; error: string }>[];
  /** Whether shutdown reached the timeout before all resources stopped. */
  timedOut: boolean;
}>;

/** Coordinates graceful shutdown for runtime resources. */
export class ShutdownManager {
  /** Stable shutdown coordinator identifier. */
  readonly id = 'shutdown-manager';
  readonly #resources = new Map<string, ShutdownResource>();
  readonly #waiters = new Set<() => void>();
  readonly #timeoutMs: number;
  #state: ShutdownState = 'running';
  #shutdownPromise?: Promise<ShutdownReport>;

  /** Creates a shutdown manager. */
  constructor(options: ShutdownManagerOptions = {}) {
    this.#timeoutMs = options.timeoutMs ?? 30_000;
  }

  /** Current lifecycle state. */
  get state(): ShutdownState {
    return this.#state;
  }

  /** Registers a resource for graceful shutdown. */
  register(resource: ShutdownResource): void {
    this.#resources.set(resource.id, resource);
  }

  /** Removes a resource from graceful shutdown. */
  unregister(id: string): void {
    this.#resources.delete(id);
  }

  /** Creates an abort controller that aborts when shutdown begins. */
  createAbortController(): AbortController {
    const controller = new AbortController();
    if (this.#state !== 'running') {
      controller.abort();
      return controller;
    }
    this.waitForShutdown().then(() => controller.abort());
    return controller;
  }

  /** Resolves once shutdown has started. */
  waitForShutdown(): Promise<void> {
    if (this.#state !== 'running') {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.#waiters.add(resolve));
  }

  /** Starts graceful shutdown and stops registered resources. */
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

  /** Stops all registered resources with timeout accounting. */
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
