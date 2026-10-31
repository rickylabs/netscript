import type { MessageContext } from '@netscript/queue';

const EXECUTION_VISIBILITY_MS = 60_000;
const RENEWAL_INTERVAL_MS = 20_000;

/** Keep the queue receipt owned throughout dispatch; loss cancels the actual execution. */
export class WorkerDeliveryLease {
  readonly controller: AbortController = new AbortController();
  private timer?: ReturnType<typeof setTimeout>;
  private renewing?: Promise<void>;
  private stopped = false;
  private ownershipLost = false;
  private readonly onShutdown = (): void => {
    this.controller.abort(new DOMException('Worker shutdown began.', 'ShutdownError'));
  };

  constructor(
    private readonly context: MessageContext | undefined,
    private readonly shutdown: AbortSignal | undefined,
  ) {
    if (shutdown?.aborted) this.onShutdown();
    else shutdown?.addEventListener('abort', this.onShutdown, { once: true });
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  /** Distinguish lost queue ownership from an explicit operator cancellation. */
  get lost(): boolean {
    return this.ownershipLost;
  }

  /** Renew before admitting effects, then renew serially until dispatch settles. */
  async start(): Promise<void> {
    this.assertOwned();
    if (!this.context?.extendVisibility) return;
    await this.renew();
    this.assertOwned();
  }

  /** Prevent a late executor result from recording successful application after lease loss. */
  assertOwned(): void {
    this.signal.throwIfAborted();
  }

  /** Join any bounded renewal before the queue performs automatic settlement. */
  async stop(): Promise<void> {
    this.stopped = true;
    clearTimeout(this.timer);
    this.shutdown?.removeEventListener('abort', this.onShutdown);
    await this.renewing;
  }

  private async renew(): Promise<void> {
    try {
      if (!await this.context!.extendVisibility!(EXECUTION_VISIBILITY_MS)) {
        throw new DOMException('Queue delivery lease is no longer owned.', 'QueueLeaseLostError');
      }
      if (!this.stopped && !this.signal.aborted) {
        this.timer = setTimeout(() => {
          this.renewing = this.renew();
        }, RENEWAL_INTERVAL_MS);
      }
    } catch (error) {
      this.ownershipLost = true;
      this.controller.abort(error);
    }
  }
}
