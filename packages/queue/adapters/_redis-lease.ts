import type { Redis } from 'ioredis';
import { delay } from '@std/async';
import type { DeadLetterStorePort, ListenOptions, NackOptions } from '../ports/mod.ts';
import { toDeadLetterRecord } from './_envelope.ts';
import { isRedisLeaseTransportError, RedisLeaseConnection } from './_redis-lease-connection.ts';
import {
  leaseDuration,
  leasePolicy,
  normalizeLeaseEnvelope,
  parseLease,
  type RedisLease,
  type RedisQueueHealth,
  type RedisQueueMetrics,
} from './_redis-lease-state.ts';

const RECOVERY_PAGE_SIZE = 100;
const CLAIM_CANDIDATES = 8;

/** Receipt lifecycle and bounded recovery for the existing Redis LIST format. */
export class RedisLeases<T> {
  private policy = leasePolicy();
  private orphanCursor = 0;
  private recovery?: Promise<number>;
  private outboxFlush?: Promise<void>;
  private stopped = false;
  private readonly connection: RedisLeaseConnection;

  /** Use the existing claim connection, leaving producer and delayed IO independent. */
  constructor(
    client: Redis,
    private readonly queueName: string,
    private readonly externalStore: DeadLetterStorePort<T> | undefined = undefined,
    private readonly reportError: (error: unknown) => void = () => {},
  ) {
    this.connection = new RedisLeaseConnection(client);
  }

  /** Apply listener policy before claiming any messages. */
  configure(options?: ListenOptions): void {
    this.policy = leasePolicy(options);
  }

  /** Check scripting support before consumption. */
  ready(signal?: AbortSignal): Promise<void> {
    return this.whileAvailable(() => this.connection.probe(), signal);
  }

  /** Recovery interval stays bounded while supporting short explicit leases. */
  get pollInterval(): number {
    return Math.max(10, Math.min(1_000, this.policy.visibilityTimeout / 2));
  }

  /** Atomically move a candidate into processing and install its receipt. */
  async claim(signal?: AbortSignal): Promise<RedisLease<T> | null> {
    return await this.whileAvailable(() => this.tryClaim(), signal);
  }

  /** Keep listeners alive through outages; individual settlement calls remain bounded. */
  private async whileAvailable<R>(operation: () => Promise<R>, signal?: AbortSignal): Promise<R> {
    let backoff = 50;
    for (;;) {
      signal?.throwIfAborted();
      try {
        return await operation();
      } catch (error) {
        if (!signal || !isRedisLeaseTransportError(error)) throw error;
        await delay(backoff, { signal });
        backoff = Math.min(backoff * 2, 1_000);
      }
    }
  }

  private async tryClaim(): Promise<RedisLease<T> | null> {
    for (let candidate = 0; candidate < CLAIM_CANDIDATES; candidate++) {
      const raw = await this.connection.call(() =>
        this.connection.client.lindex(this.readyKey, -1)
      );
      if (raw === null) return null;
      const key = `${this.receiptPrefix}${crypto.randomUUID()}`;
      const result = await this.connection.transition(this.keys(key), this.newClaim('claim', raw));
      if (typeof result === 'string') return parseLease<T>(key, result);
    }
    return null;
  }

  /** Settle only a still-owned, unexpired receipt. */
  async settle(lease: RedisLease<T>, options?: NackOptions, signal?: AbortSignal): Promise<void> {
    const deadLetter = options && (!(options.requeue ?? true) ||
        lease.envelope.deliveryCount >= lease.maxDeliveries)
      ? this.deadLetter(lease, options)
      : undefined;
    await this.whileAvailable(() =>
      this.connection.transition(this.keys(lease.key), {
        op: options ? 'nack' : 'ack',
        fence: lease.fence,
        deadLetter,
      }), signal);
    if (deadLetter) this.scheduleOutboxFlush();
  }

  /** Extend from Redis server time; false means the handler no longer owns this delivery. */
  async extend(lease: RedisLease<T>, milliseconds: number = lease.timeout): Promise<boolean> {
    return await this.connection.transition(this.keys(lease.key), {
      op: 'extend',
      fence: lease.fence,
      timeout: leaseDuration(milliseconds, 'visibility extension'),
    }) === 1;
  }

  /** Share a bounded recovery pass among the local timer and explicit callers. */
  reclaimExpired(): Promise<number> {
    if (!this.recovery) {
      this.recovery = this.recover().finally(() => this.recovery = undefined);
    }
    return this.recovery;
  }

  /** Read persisted counters rather than resetting them on consumer restart. */
  async getMetrics(): Promise<RedisQueueMetrics> {
    const values = await this.connection.call(() =>
      this.connection.client.hgetall(this.metricsKey)
    );
    return {
      reclaimed: Number(values.reclaimed ?? 0),
      deadLettered: Number(values.deadLettered ?? 0),
      staleSettlements: Number(values.staleSettlements ?? 0),
      observedOrphans: Number(values.observedOrphans ?? 0),
    };
  }

  /** Expose current queue depths together with the recovery counters. */
  async getHealth(): Promise<RedisQueueHealth> {
    const [metrics, ready, processing, deadLetterDepth, outboxDepth] = await Promise.all([
      this.getMetrics(),
      this.connection.call(() => this.connection.client.llen(this.readyKey)),
      this.connection.call(() => this.connection.client.llen(this.processingKey)),
      this.connection.call(() => this.connection.client.llen(this.dlqKey)),
      this.connection.call(() => this.connection.client.llen(this.outboxKey)),
    ]);
    return { ...metrics, ready, processing, deadLetterDepth, outboxDepth };
  }

  /** Stop retries without clearing durable claims that a replacement must recover. */
  stop(): void {
    this.stopped = true;
    this.connection.stop();
  }

  private async recover(): Promise<number> {
    const [seconds, micros] = await this.connection.call(() => this.connection.client.time());
    const now = Number(seconds) * 1_000 + Math.floor(Number(micros) / 1_000);
    const keys = await this.connection.call(() =>
      this.connection.client.zrangebyscore(
        this.deadlinesKey,
        '-inf',
        now,
        'LIMIT',
        0,
        RECOVERY_PAGE_SIZE,
      )
    );
    let reclaimed = 0;
    for (const key of keys) {
      const encoded = await this.connection.call(() => this.connection.client.get(key));
      if (!encoded) {
        await this.connection.transition(this.keys(key), { op: 'prune' });
        continue;
      }
      const lease = parseLease<T>(key, encoded);
      reclaimed += Number(
        await this.connection.transition(this.keys(key), {
          op: 'reclaim',
          fence: lease.fence,
          deadLetter: lease.envelope.deliveryCount >= lease.maxDeliveries
            ? this.deadLetter(lease, { requeue: true })
            : undefined,
        }),
      );
    }
    await this.observeOrphans();
    this.scheduleOutboxFlush();
    return reclaimed;
  }

  private async observeOrphans(): Promise<void> {
    const entries = await this.connection.call(() =>
      this.connection.client.lrange(
        this.processingKey,
        this.orphanCursor,
        this.orphanCursor + RECOVERY_PAGE_SIZE - 1,
      )
    );
    this.orphanCursor = entries.length < RECOVERY_PAGE_SIZE
      ? 0
      : this.orphanCursor + entries.length;
    for (const raw of new Set(entries)) {
      if (await this.connection.call(() => this.connection.client.hexists(this.ownersKey, raw))) {
        continue;
      }
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      const suffix = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      await this.connection.transition(
        this.keys(`${this.receiptPrefix}orphan:${suffix}`),
        this.newClaim('observe', raw),
      );
    }
  }

  private newClaim(op: 'claim' | 'observe', raw: string): Record<string, unknown> {
    const { envelope, invalid } = normalizeLeaseEnvelope(raw);
    return {
      op,
      raw,
      fence: crypto.randomUUID(),
      envelope: JSON.stringify(envelope),
      invalid,
      timeout: this.policy.visibilityTimeout,
      grace: this.policy.recoveryGrace,
      maxDeliveries: this.policy.maxDeliveries,
      deadLetter: invalid
        ? JSON.stringify(
          toDeadLetterRecord({ ...envelope, queueName: this.queueName }, 'validation_failed'),
        )
        : undefined,
    };
  }

  private deadLetter(lease: RedisLease<T>, options: NackOptions): string {
    return JSON.stringify(toDeadLetterRecord(
      { ...lease.envelope, queueName: this.queueName },
      options.requeue !== false && lease.envelope.deliveryCount >= lease.maxDeliveries
        ? 'max_attempts_exceeded'
        : options.reason ?? 'nack_without_requeue',
      options,
    ));
  }

  private async flushOutbox(): Promise<void> {
    if (!this.externalStore) return;
    const entries = await this.connection.call(() =>
      this.connection.client.lrange(this.outboxKey, 0, RECOVERY_PAGE_SIZE - 1)
    );
    for (const bytes of entries) {
      await this.externalStore.append(JSON.parse(bytes));
      await this.connection.transition(this.keys(`${this.receiptPrefix}outbox`), {
        op: 'flush',
        bytes,
      });
    }
  }

  /** A failed or slow external store must not stall consumption or lease recovery. */
  private scheduleOutboxFlush(): void {
    if (!this.externalStore || this.outboxFlush || this.stopped) return;
    this.outboxFlush = this.flushOutbox().catch(this.reportError).finally(() => {
      this.outboxFlush = undefined;
    });
  }

  private keys(receipt: string): string[] {
    return [
      receipt,
      this.readyKey,
      this.processingKey,
      this.deadlinesKey,
      this.ownersKey,
      this.externalStore ? this.outboxKey : this.dlqKey,
      this.metricsKey,
    ];
  }

  private get readyKey(): string {
    return `netscript:queue:${this.queueName}`;
  }
  private get processingKey(): string {
    return `netscript:processing:${this.queueName}`;
  }
  private get deadlinesKey(): string {
    return `netscript:leases:${this.queueName}`;
  }
  private get ownersKey(): string {
    return `netscript:lease-owners:${this.queueName}`;
  }
  private get metricsKey(): string {
    return `netscript:queue-metrics:${this.queueName}`;
  }
  private get dlqKey(): string {
    return `netscript:dlq:${this.queueName}`;
  }
  private get outboxKey(): string {
    return `netscript:dlq-outbox:${this.queueName}`;
  }
  private get receiptPrefix(): string {
    return `netscript:lease:${this.queueName}:`;
  }
}
