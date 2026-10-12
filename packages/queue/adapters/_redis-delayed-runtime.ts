import type { Redis } from 'ioredis';
import { tryPromoteDelayedBatch } from './_redis-delayed-promotion.ts';
import { RedisDelayedScript } from './_redis-delayed-script.ts';

/** Promotion capabilities and connection generation owned by one dedicated client. */
export class RedisDelayedPromotion {
  #epoch = 0;
  #stopped = false;
  readonly #disconnected = Promise.withResolvers<void>();
  readonly #script: RedisDelayedScript;
  #scripting?: Promise<boolean>;
  readonly #advanceEpoch = (): void => {
    this.#epoch++;
  };

  /** Track connection changes before any probe or WATCH can run. */
  constructor(
    private readonly client: Redis,
    private readonly reportError: (error: unknown) => void,
  ) {
    this.#script = new RedisDelayedScript(client);
    for (const event of ['close', 'end', 'ready']) client.on(event, this.#advanceEpoch);
  }

  /** Use cached Lua support, or retry a watched batch on a stable connection. */
  async promote(delayedKey: string): Promise<number | null> {
    if (this.#stopped || this.client.status === 'end') throw new Error('Connection is closed');
    const scripting = await (this.#scripting ??= this.detectScripting().catch((error: unknown) => {
      // A failed connection is not a capability result. Retry only failed probes;
      // a successful supported/unsupported determination is cached for this client.
      this.#scripting = undefined;
      throw error;
    }));
    if (scripting) {
      return await this.#script.promote(delayedKey);
    }
    return await tryPromoteDelayedBatch(
      this.client,
      delayedKey,
      this.reportError,
      () => this.#epoch,
    );
  }

  /** Signal manual disconnect even when ioredis emits no close/end event. */
  get disconnected(): Promise<void> {
    return this.#disconnected.promise;
  }

  /** Permanently close the client and release drains independently of pending commands. */
  disconnect(): void {
    this.#stopped = true;
    try {
      this.client.disconnect();
    } finally {
      this.#disconnected.resolve();
    }
  }

  /** Remove epoch listeners after the client is manually disconnected. */
  dispose(): void {
    for (const event of ['close', 'end', 'ready']) {
      this.client.off(event, this.#advanceEpoch);
    }
  }

  /** Probe once; command absence/disabled Lua selects the non-scripting fallback. */
  private async detectScripting(): Promise<boolean> {
    try {
      await this.client.eval('return 1', 0);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        /unknown command.*eval|(?:lua|scripting).*(?:disabled|not enabled|not supported)|NOPERM.*eval/i
          .test(error.message)
      ) return false;
      throw error;
    }
  }
}
