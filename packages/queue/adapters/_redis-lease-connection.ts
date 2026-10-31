import type { Redis } from 'ioredis';
import { delay } from '@std/async';
import { QueueConfigurationError } from '../ports/errors.ts';
import { REDIS_LEASE_SCRIPT } from './_redis-lease-script.ts';

const TRANSPORT_ATTEMPTS = 3;

/** Recognize availability failures without retrying configuration or script errors. */
export function isRedisLeaseTransportError(error: unknown): boolean {
  return error instanceof Error &&
    /closed|disconnected|connecting|offline|ECONN|EPIPE|EAI_AGAIN|ENOTFOUND|ETIMEDOUT|timeout|timed out|max retries|writeable/i
      .test(error.message);
}

/** Bounded script transport on the adapter's former blocking connection. */
export class RedisLeaseConnection {
  private readonly stopped = new AbortController();
  private connecting?: Promise<void>;
  private sha?: Promise<string>;

  /** The owner configures bounded timeouts, disabled offline queue and disabled replay. */
  constructor(public client: Redis) {}

  /** Refuse unsupported servers before removing any ready work. */
  async probe(): Promise<void> {
    try {
      await this.call(() => this.client.eval('return 1', 0));
    } catch (error) {
      if (
        error instanceof Error &&
        /unknown command.*eval|(?:lua|scripting).*(?:disabled|not enabled|not supported)/i
          .test(error.message)
      ) {
        throw new QueueConfigurationError(
          'Redis queue leases require Lua; enable --lua and --lua-transaction-mode on Garnet',
        );
      }
      throw error;
    }
  }

  /** Retry a transport failure using the same immutable receipt arguments. */
  async transition(
    keys: readonly string[],
    request: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    // Sorted-set members are data: ioredis prefixes command keys, never these values.
    const encoded = JSON.stringify({ ...request, receipt: keys[0] });
    const sha = await (this.sha ??= this.scriptHash());
    return await this.call(async () => {
      try {
        return await this.client.evalsha(sha, keys.length, ...keys, encoded);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('NOSCRIPT')) throw error;
        return await this.client.eval(REDIS_LEASE_SCRIPT, keys.length, ...keys, encoded);
      }
    });
  }

  /** Run bounded reads and writes without leaving a disconnected client waiting forever. */
  async call<R>(operation: () => Promise<R>): Promise<R> {
    for (let attempt = 0;; attempt++) {
      this.stopped.signal.throwIfAborted();
      let generation = this.client;
      try {
        await this.ready();
        generation = this.client;
        return await operation();
      } catch (error) {
        this.stopped.signal.throwIfAborted();
        if (!isRedisLeaseTransportError(error)) throw error;
        // A half-closed ioredis instance can retain ended writable-stream state.
        // Duplicate its configured options into a fresh generation, never that stream.
        if (generation === this.client) {
          generation.disconnect();
          this.client = generation.duplicate();
          this.client.on('error', () => {});
          this.connecting = undefined;
        }
        if (attempt + 1 === TRANSPORT_ATTEMPTS) throw error;
        await delay(25 * (attempt + 1), { signal: this.stopped.signal });
      }
    }
  }

  /** Abort queued retries; captured old contexts can never reopen this connection. */
  stop(): void {
    this.stopped.abort();
    this.client.disconnect();
  }

  private async ready(): Promise<void> {
    if (this.client.status === 'ready') return;
    if (!this.connecting) {
      const connecting = this.client.connect().then(() => {}).finally(() => {
        if (this.connecting === connecting) this.connecting = undefined;
      });
      this.connecting = connecting;
    }
    await this.connecting;
  }

  private async scriptHash(): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(REDIS_LEASE_SCRIPT));
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
