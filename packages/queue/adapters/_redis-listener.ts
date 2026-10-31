import { abortable, delay } from '@std/async';
import type { RedisLeases } from './_redis-lease.ts';
import type { RedisLease, RedisListenerPolicy } from './_redis-lease-state.ts';

/** One listener's bounded admission and settlement lifetime, independent of adapter sockets. */
export class RedisListener<T> {
  private readonly intake = new AbortController();
  private readonly settlement = new AbortController();
  private changed = Promise.withResolvers<void>();
  private readonly expired = Promise.withResolvers<void>();
  private readonly active = new Set<Promise<void>>();
  private drainTimer?: ReturnType<typeof setTimeout>;
  private failure?: { error: unknown };
  private ready = false;
  /** True when the lease connection generation can no longer be reused. */
  closed = false;

  constructor(
    private readonly leases: RedisLeases<T>,
    private readonly policy: RedisListenerPolicy,
    private readonly deliver: (claim: RedisLease<T>, signal: AbortSignal) => Promise<void>,
  ) {}

  /** Stop admission now; keep each active receipt usable until the bounded drain ends. */
  readonly stop = (): void => {
    if (this.intake.signal.aborted) return;
    this.intake.abort();
    this.wake();
    if (!this.ready) this.closeLeases();
    this.drainTimer = setTimeout(() => {
      this.settlement.abort();
      this.closeLeases();
      this.expired.resolve();
    }, this.policy.drainTimeout);
  };

  /** Admit no more than the configured number of handler-plus-settlement operations. */
  async run(onReady: () => void): Promise<void> {
    try {
      await this.leases.ready(this.intake.signal);
      if (this.intake.signal.aborted) return;
      this.ready = true;
      onReady();
      while (!this.intake.signal.aborted) {
        if (this.active.size >= this.policy.concurrency) {
          await this.changed.promise;
          continue;
        }
        // A timed-out connection is closed before abandoning its unknown-outcome claim.
        const claim = await abortable(
          this.leases.claim(this.intake.signal),
          this.settlement.signal,
        );
        if (claim) {
          // A committed last-delivery claim must reach its handler even if intake just aborted.
          const task = this.deliver(claim, this.settlement.signal).catch((error: unknown) => {
            if (!this.intake.signal.aborted) {
              this.failure ??= { error };
              this.stop();
            }
          }).finally(() => {
            this.active.delete(task);
            this.wake();
          });
          this.active.add(task);
        } else if (!this.intake.signal.aborted) {
          await delay(this.policy.pollIntervalMs, { signal: this.intake.signal });
        }
      }
    } catch (error) {
      if (!this.intake.signal.aborted) this.failure ??= { error };
    } finally {
      this.stop();
      await Promise.race([Promise.allSettled([...this.active]), this.expired.promise]);
      clearTimeout(this.drainTimer);
      this.settlement.abort();
    }
    if (this.failure) throw this.failure.error;
  }

  private closeLeases(): void {
    this.closed = true;
    this.leases.stop();
  }

  private wake(): void {
    const changed = this.changed;
    this.changed = Promise.withResolvers<void>();
    changed.resolve();
  }
}
