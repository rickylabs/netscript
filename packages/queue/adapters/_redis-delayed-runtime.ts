import type { Redis } from 'ioredis';
import { tryPromoteDelayedBatch } from './_redis-delayed-promotion.ts';
import { promoteDelayedScriptBatch } from './_redis-delayed-script.ts';

/** Promotion capabilities and connection generation owned by one dedicated client. */
export class RedisDelayedPromotion {
  #epoch = 0;
  #scripting?: Promise<boolean>;
  readonly #advanceEpoch = (): void => {
    this.#epoch++;
  };

  /** Track connection changes before any probe or WATCH can run. */
  constructor(
    private readonly client: Redis,
    private readonly reportError: (error: unknown) => void,
  ) {
    for (const event of ['close', 'end', 'ready']) client.on(event, this.#advanceEpoch);
  }

  /** Use cached Lua support, or retry a watched batch on a stable connection. */
  async promote(delayedKey: string): Promise<boolean> {
    if (this.client.status === 'end') throw new Error('Connection is closed');
    const scripting = await (this.#scripting ??= this.detectScripting().catch((error: unknown) => {
      // A failed connection is not a capability result. Retry only failed probes;
      // a successful supported/unsupported determination is cached for this client.
      this.#scripting = undefined;
      throw error;
    }));
    if (scripting) {
      await promoteDelayedScriptBatch(this.client, delayedKey);
      return true;
    }
    return await tryPromoteDelayedBatch(
      this.client,
      delayedKey,
      this.reportError,
      () => this.#epoch,
    );
  }

  /** Remove epoch listeners once the disconnected client's pass has settled. */
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
