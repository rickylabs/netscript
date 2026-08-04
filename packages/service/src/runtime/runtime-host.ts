import {
  type RuntimeHostBudgetTimer,
  systemRuntimeHostBudgetTimer,
} from '../adapters/runtime-host-budget-timer.ts';

const DEFAULT_RUNTIME_HOST_TIMEOUT_MS = 30_000;

/** Ordered app-resource phases used by {@link createRuntimeHost}. */
export const RUNTIME_HOST_SHUTDOWN_PHASES: readonly [
  'service',
  'workers',
  'queue',
  'database',
] = Object.freeze(
  [
    'service',
    'workers',
    'queue',
    'database',
  ] as const,
);

/** Resource phase in the deterministic app-wide shutdown order. */
export type RuntimeHostShutdownPhase = (typeof RUNTIME_HOST_SHUTDOWN_PHASES)[number];

/** Lifecycle state of an app-wide runtime host. */
export type RuntimeHostState = 'running' | 'shutting-down' | 'stopped';

/** Final status recorded for one app resource drain. */
export type RuntimeHostDrainStatus = 'stopped' | 'failed' | 'timed-out' | 'skipped';

/** Existing resource drain registered with an app-wide runtime host. */
export type RuntimeHostDrain = Readonly<{
  /** Unique resource id used in the shutdown report. */
  id: string;
  /** Phase that determines when this resource drains. */
  phase: RuntimeHostShutdownPhase;
  /** Invokes the resource's existing drain path. */
  drain(reason?: string): Promise<void> | void;
}>;

/** Options for composing an app-wide runtime host. */
export type RuntimeHostOptions = Readonly<{
  /** Existing app-resource drains to orchestrate. */
  drains: readonly RuntimeHostDrain[];
  /** Total budget shared by every drain. Defaults to 30 seconds. */
  timeoutMs?: number;
}>;

/** Ordered outcome for one app-resource drain. */
export type RuntimeHostDrainOutcome = Readonly<{
  /** Resource id supplied at composition. */
  id: string;
  /** Resource phase used for ordering. */
  phase: RuntimeHostShutdownPhase;
  /** How this drain finished within the app-wide operation. */
  status: RuntimeHostDrainStatus;
  /** Normalized rejection message when status is `failed`. */
  error?: string;
}>;

/** Aggregate report returned by app-wide shutdown. */
export type RuntimeHostShutdownReport = Readonly<{
  /** Caller-supplied reason forwarded to every invoked drain. */
  reason?: string;
  /** Whether the shared budget expired before all drains settled. */
  timedOut: boolean;
  /** One deterministic outcome per registered drain. */
  outcomes: readonly RuntimeHostDrainOutcome[];
}>;

/** App-wide runtime lifecycle handle. */
export type RuntimeHost = Readonly<{
  /** Current host lifecycle state. */
  readonly state: RuntimeHostState;
  /** Drains all registered app resources under one shared budget. */
  shutdown(reason?: string): Promise<RuntimeHostShutdownReport>;
}>;

type SettledDrain =
  | Readonly<{ status: 'stopped' }>
  | Readonly<{ status: 'failed'; error: string }>;

type DrainRaceResult = SettledDrain | Readonly<{ status: 'budget-expired' }>;

/** Runtime host implementation with an injectable budget timer. */
export class ComposedRuntimeHost implements RuntimeHost {
  readonly #drains: readonly RuntimeHostDrain[];
  readonly #timeoutMs: number;
  readonly #timer: RuntimeHostBudgetTimer;
  #state: RuntimeHostState = 'running';
  #shutdownPromise?: Promise<RuntimeHostShutdownReport>;

  /** Creates a runtime host from existing resource drain callbacks. */
  constructor(
    options: RuntimeHostOptions,
    timer: RuntimeHostBudgetTimer = systemRuntimeHostBudgetTimer,
  ) {
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_RUNTIME_HOST_TIMEOUT_MS;
    if (!Number.isFinite(this.#timeoutMs) || this.#timeoutMs < 0) {
      throw new RangeError('Runtime host timeoutMs must be a finite non-negative number.');
    }

    const ids = new Set<string>();
    for (const drain of options.drains) {
      if (!drain.id || ids.has(drain.id)) {
        throw new TypeError(`Runtime host drain ids must be non-empty and unique: ${drain.id}`);
      }
      ids.add(drain.id);
    }

    const phaseOrder = new Map(
      RUNTIME_HOST_SHUTDOWN_PHASES.map((phase, index) => [phase, index] as const),
    );
    this.#drains = Object.freeze(
      options.drains
        .map((drain, index) => ({ drain, index }))
        .sort((left, right) =>
          (phaseOrder.get(left.drain.phase) ?? Number.MAX_SAFE_INTEGER) -
            (phaseOrder.get(right.drain.phase) ?? Number.MAX_SAFE_INTEGER) ||
          left.index - right.index
        )
        .map(({ drain }) => drain),
    );
    this.#timer = timer;
  }

  /** Current host lifecycle state. */
  get state(): RuntimeHostState {
    return this.#state;
  }

  /** Drains every app resource in phase order under one shared budget. */
  shutdown(reason?: string): Promise<RuntimeHostShutdownReport> {
    if (this.#shutdownPromise) return this.#shutdownPromise;

    this.#state = 'shutting-down';
    this.#shutdownPromise = this.runShutdown(reason);
    return this.#shutdownPromise;
  }

  private async runShutdown(reason?: string): Promise<RuntimeHostShutdownReport> {
    const budget = this.#timer.start(this.#timeoutMs);
    const outcomes: RuntimeHostDrainOutcome[] = [];
    let timedOut = false;

    try {
      for (let index = 0; index < this.#drains.length; index += 1) {
        const drain = this.#drains[index];
        const settled: Promise<SettledDrain> = Promise.resolve()
          .then(() => drain.drain(reason))
          .then(
            (): SettledDrain => ({ status: 'stopped' }),
            (error: unknown): SettledDrain => ({
              status: 'failed',
              error: normalizeError(error),
            }),
          );
        const result: DrainRaceResult = await Promise.race([
          settled,
          budget.expired.then((): DrainRaceResult => ({ status: 'budget-expired' })),
        ]);

        if (result.status === 'budget-expired') {
          timedOut = true;
          outcomes.push({ id: drain.id, phase: drain.phase, status: 'timed-out' });
          for (const skipped of this.#drains.slice(index + 1)) {
            outcomes.push({ id: skipped.id, phase: skipped.phase, status: 'skipped' });
          }
          break;
        }

        outcomes.push(
          result.status === 'failed'
            ? { id: drain.id, phase: drain.phase, status: 'failed', error: result.error }
            : { id: drain.id, phase: drain.phase, status: 'stopped' },
        );
      }
    } finally {
      budget.cancel();
      this.#state = 'stopped';
    }

    return Object.freeze({
      reason,
      timedOut,
      outcomes: Object.freeze(outcomes),
    });
  }
}

/** Composes existing app-resource drains behind one `host.shutdown()` budget. */
export function createRuntimeHost(options: RuntimeHostOptions): RuntimeHost {
  return new ComposedRuntimeHost(options);
}

function normalizeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
