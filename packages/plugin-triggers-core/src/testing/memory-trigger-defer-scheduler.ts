import type {
  TriggerDeferRecord,
  TriggerDeferReplayResult,
  TriggerDeferRunOptions,
  TriggerDeferScheduleInput,
  TriggerDeferSchedulerPort,
} from '../ports/mod.ts';
import type { TriggerClockPort } from '../ports/trigger-clock-port.ts';

/** Deterministic in-memory scheduler for deferred trigger runtime tests. */
export class MemoryTriggerDeferScheduler implements TriggerDeferSchedulerPort {
  readonly #clock: TriggerClockPort;
  readonly #records = new Map<string, TriggerDeferRecord>();
  #replay?: (record: TriggerDeferRecord) => Promise<void>;
  #sequence = 0;

  /** Create a memory scheduler driven by an explicit test clock. */
  constructor(clock: TriggerClockPort) {
    this.#clock = clock;
  }

  schedule(input: TriggerDeferScheduleInput): Promise<TriggerDeferRecord> {
    this.#sequence += 1;
    const record: TriggerDeferRecord = Object.freeze({
      id: `defer_${this.#sequence}`,
      triggerId: input.event.triggerId,
      event: input.event,
      until: new Date(input.action.until).toISOString(),
      createdAt: this.#clock.now().toISOString(),
    });
    this.#records.set(record.id, record);
    return Promise.resolve(record);
  }

  cancel(id: string): Promise<boolean> {
    return Promise.resolve(this.#records.delete(id));
  }

  list(): Promise<readonly TriggerDeferRecord[]> {
    return Promise.resolve(
      Object.freeze([...this.#records.values()].sort((left, right) =>
        Date.parse(left.until) - Date.parse(right.until)
      )),
    );
  }

  async replayDue(
    replay: (record: TriggerDeferRecord) => Promise<void>,
  ): Promise<readonly TriggerDeferReplayResult[]> {
    const results: TriggerDeferReplayResult[] = [];
    for (const record of await this.list()) {
      if (Date.parse(record.until) > this.#clock.now().getTime()) break;
      try {
        await replay(record);
        this.#records.delete(record.id);
        results.push({ record, status: 'replayed' });
      } catch (error) {
        results.push({
          record,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return Object.freeze(results);
  }

  async run(
    replay: (record: TriggerDeferRecord) => Promise<void>,
    options: TriggerDeferRunOptions = {},
  ): Promise<void> {
    this.#replay = replay;
    if (options.signal?.aborted) return;
    await new Promise<void>((resolve) => {
      options.signal?.addEventListener('abort', () => resolve(), { once: true });
    });
  }

  /** Replay records due at the current test-clock time. */
  async fireDue(): Promise<readonly TriggerDeferReplayResult[]> {
    if (this.#replay === undefined) {
      throw new Error('Deferred trigger scheduler is not running.');
    }
    return await this.replayDue(this.#replay);
  }
}
