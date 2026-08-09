import type {
  StreamProducerReadinessOptionsV1,
  StreamProducerReconnectPolicyV1,
  StreamProducerStateSnapshotV1,
  StreamProducerTransportFailureV1,
  StreamWriteReceiptV1,
  StreamWriteRejectionReasonV1,
} from '../domain/producer-contract-v1.ts';
import type { StreamProducerClockPort } from '../ports/stream-producer-clock-port.ts';
import type { StreamProducerRandomPort } from '../ports/stream-producer-random-port.ts';
import type {
  StreamProducerIdentityV1,
  StreamProducerTransportPort,
} from '../ports/stream-producer-transport-port.ts';
import type {
  DurableStreamProducerSupervisorOptions,
  StreamProducerWriteLifecycle,
} from './durable-stream-producer-supervisor-contract.ts';
import {
  DurableStreamProducerQueue,
  type ProducerQueueEntry,
} from './durable-stream-producer-queue.ts';
import {
  abortError,
  backoffDelay,
  bufferPolicy,
  createProducerDeferred,
  isRetryable,
  type ProducerDeferred,
  reconnectPolicy,
} from './durable-stream-producer-support.ts';

interface ReadyWaiter extends ProducerDeferred<void> {
  readonly signal?: AbortSignal;
}

/** Finite FIFO supervisor for durable stream producer delivery. */
export class DurableStreamProducerSupervisor {
  readonly #url: string;
  readonly #headers: Readonly<Record<string, string>>;
  readonly #producerId: string;
  readonly #transport: StreamProducerTransportPort;
  readonly #clock: StreamProducerClockPort;
  readonly #random: StreamProducerRandomPort;
  readonly #reconnectPolicy: StreamProducerReconnectPolicyV1;
  readonly #abort = new AbortController();
  readonly #queue: DurableStreamProducerQueue;
  readonly #readyWaiters = new Set<ReadyWaiter>();
  readonly #onStopped?: () => void;
  readonly #onState?: DurableStreamProducerSupervisorOptions['onState'];
  readonly #onBuffer?: DurableStreamProducerSupervisorOptions['onBuffer'];
  readonly #onRetry?: DurableStreamProducerSupervisorOptions['onRetry'];
  readonly #onRecovery?: DurableStreamProducerSupervisorOptions['onRecovery'];
  readonly #connectPromise: Promise<boolean>;
  #processing: Promise<void> | null = null;
  #closePromise: Promise<void> | null = null;
  #stopPromise: Promise<void> | null = null;
  #state: StreamProducerStateSnapshotV1 = {
    state: 'connecting',
    attempt: 0,
    bufferedEvents: 0,
    bufferedBytes: 0,
  };
  #accepted = true;
  #epoch = 0;
  #nextSequence = 0;

  /** Start connecting immediately under a bounded policy. */
  constructor(options: DurableStreamProducerSupervisorOptions) {
    this.#url = options.url;
    this.#headers = options.headers;
    this.#producerId = options.producerId;
    this.#transport = options.transport;
    this.#clock = options.clock;
    this.#random = options.random;
    this.#reconnectPolicy = reconnectPolicy(options.reconnectPolicy);
    this.#queue = new DurableStreamProducerQueue(
      bufferPolicy(options.bufferPolicy),
      (events, bytes) => this.#bufferChanged(events, bytes),
    );
    this.#onStopped = options.onStopped;
    this.#onState = options.onState;
    this.#onBuffer = options.onBuffer;
    this.#onRetry = options.onRetry;
    this.#onRecovery = options.onRecovery;
    this.#connectPromise = this.#connectWithRetry(true);
    void this.#connectPromise.then((connected) => {
      if (connected) {
        this.#kick();
      }
    });
    options.signal?.addEventListener('abort', () => void this.stop(), { once: true });
    if (options.signal?.aborted) {
      void this.stop();
    }
  }

  /** Current immutable lifecycle snapshot. */
  get state(): StreamProducerStateSnapshotV1 {
    return this.#state;
  }

  /** Whether the producer can deliver without reconnecting first. */
  get isReady(): boolean {
    return this.#state.state === 'ready';
  }

  /** Whether new writes are rejected because shutdown or terminal failure began. */
  get closed(): boolean {
    return !this.#accepted;
  }

  /** Accept an already serialized event into the bounded FIFO. */
  enqueue(body: string, lifecycle?: StreamProducerWriteLifecycle): StreamWriteReceiptV1 {
    const rejection = this.#writeRejectionReason();
    if (rejection) {
      return this.#queue.reject(rejection, lifecycle);
    }
    const receipt = this.#queue.enqueue(body, lifecycle);
    this.#kick();
    return receipt;
  }

  /** Return an already-settled receipt for a write rejected before queue admission. */
  reject(
    reason: StreamWriteRejectionReasonV1,
    lifecycle?: StreamProducerWriteLifecycle,
  ): StreamWriteReceiptV1 {
    return this.#queue.reject(reason, lifecycle);
  }

  /** Resolve on the current or next ready transition. */
  waitUntilReady(options: StreamProducerReadinessOptionsV1 = {}): Promise<void> {
    if (this.isReady) {
      return Promise.resolve();
    }
    if (this.#state.state === 'failed' || this.#state.state === 'stopped') {
      return Promise.reject(new Error(`Producer is ${this.#state.state}`));
    }
    if (options.signal?.aborted) {
      return Promise.reject(abortError(options.signal));
    }

    const deferred = createProducerDeferred<void>();
    const waiter: ReadyWaiter = { ...deferred, signal: options.signal };
    this.#readyWaiters.add(waiter);
    options.signal?.addEventListener(
      'abort',
      () => {
        if (this.#readyWaiters.delete(waiter)) {
          waiter.reject(abortError(options.signal));
        }
      },
      { once: true },
    );
    return waiter.promise;
  }

  /** Wait for writes accepted before this call and reject on any non-delivery. */
  async flush(): Promise<void> {
    if (this.#state.state === 'failed') {
      throw new Error(this.#state.error ?? 'Producer failed');
    }
    const snapshot = this.#queue.entries.map((entry) => entry.deferred.promise);
    if (snapshot.length === 0) {
      return;
    }
    const outcomes = await Promise.all(snapshot);
    const failed = outcomes.find((outcome) => outcome.status !== 'delivered');
    if (failed) {
      throw new Error(`Producer flush ended with ${failed.status}`);
    }
  }

  /** Stop local work immediately without sending durable EOF. */
  stop(): Promise<void> {
    this.#stopPromise ??= this.#stopImmediately();
    return this.#stopPromise;
  }

  async #stopImmediately(): Promise<void> {
    if (this.#state.state === 'stopped') {
      return;
    }
    this.#accepted = false;
    this.#transition('stopping', 0);
    this.#abort.abort(new DOMException('Producer stopped', 'AbortError'));
    const active = this.#queue.entries[0];
    if (active?.attempted) {
      this.#queue.settle(active, {
        status: 'delivery-unknown',
        reason: 'producer-stopped',
      });
    }
    for (const entry of [...this.#queue.entries]) {
      this.#queue.settle(entry, { status: 'cancelled', reason: 'producer-stopped' });
    }
    await this.#processing?.catch(() => undefined);
    this.#transition('stopped', 0);
    this.#rejectReadyWaiters(new Error('Producer stopped'));
    this.#onStopped?.();
  }

  /** Drain accepted writes, acknowledge durable EOF, and stop. */
  close(): Promise<void> {
    if (this.#stopPromise) {
      return this.#stopPromise;
    }
    if (this.#closePromise) {
      return this.#closePromise;
    }
    if (this.#state.state === 'stopped') {
      return Promise.resolve();
    }
    this.#accepted = false;
    this.#closePromise = this.#closeGracefully();
    return this.#closePromise;
  }

  async #closeGracefully(): Promise<void> {
    await this.flush();
    const connected = await this.#connectPromise;
    if (!connected) {
      throw new Error(this.#state.error ?? 'Producer failed before close');
    }
    this.#transition('stopping', 0);
    let identity: StreamProducerIdentityV1 = this.#identity();
    for (let attempt = 1; attempt <= this.#reconnectPolicy.maxAttempts; attempt++) {
      const result = await this.#transport.close({
        url: this.#url,
        headers: this.#headers,
        identity,
        signal: this.#abort.signal,
      });
      if (result.ok) {
        this.#nextSequence = identity.sequence + 1;
        if (attempt > 1) {
          this.#onRecovery?.('close', attempt);
        }
        this.#transition('stopped', 0);
        this.#rejectReadyWaiters(new Error('Producer stopped'));
        this.#onStopped?.();
        return;
      }
      if (result.failure.kind === 'stale-epoch') {
        this.#epoch = (result.failure.currentEpoch ?? this.#epoch) + 1;
        this.#nextSequence = 0;
        identity = this.#identity();
      } else if (!isRetryable(result.failure)) {
        this.#fail(result.failure.message);
        throw new Error(result.failure.message);
      }
      if (attempt === this.#reconnectPolicy.maxAttempts) {
        this.#fail(result.failure.message);
        throw new Error(result.failure.message);
      }
      this.#onRetry?.('close', attempt + 1, result.failure.kind);
      if (!(await this.#waitBackoff(attempt, result.failure.message))) {
        return;
      }
    }
  }

  #kick(): void {
    if (this.#processing || this.#queue.length === 0 || this.#state.state === 'failed') {
      return;
    }
    this.#processing = this.#processQueue().finally(() => {
      this.#processing = null;
      if (
        this.#queue.length > 0 && this.#state.state !== 'failed' && this.#state.state !== 'stopped'
      ) {
        this.#kick();
      }
    });
  }

  async #processQueue(): Promise<void> {
    const connected = await this.#connectPromise;
    if (!connected || this.#abort.signal.aborted) {
      return;
    }
    while (this.#queue.length > 0 && !this.#abort.signal.aborted) {
      const entry = this.#queue.entries[0];
      if (!entry || !(await this.#deliver(entry))) {
        return;
      }
    }
  }

  async #deliver(entry: ProducerQueueEntry): Promise<boolean> {
    entry.identity ??= this.#identity();
    for (let attempt = 1; attempt <= this.#reconnectPolicy.maxAttempts; attempt++) {
      if (attempt > 1) {
        this.#transition('reconnecting', attempt);
        const connected = await this.#transport.connect({
          url: this.#url,
          headers: this.#headers,
          signal: this.#abort.signal,
        });
        if (!connected.ok) {
          if (this.#abort.signal.aborted) {
            return false;
          }
          if (!isRetryable(connected.failure) || attempt === this.#reconnectPolicy.maxAttempts) {
            this.#failActive(entry, connected.failure, attempt);
            return false;
          }
          this.#onRetry?.('connect', attempt + 1, connected.failure.kind);
          entry.lifecycle?.event('stream.producer.retry', {
            'netscript.stream.producer.phase': 'connect',
            'netscript.stream.producer.attempt': attempt + 1,
            'netscript.stream.producer.reason': connected.failure.kind,
          });
          if (!(await this.#waitBackoff(attempt, connected.failure.message))) {
            return false;
          }
          continue;
        }
      }

      this.#transition('ready', attempt);
      entry.attempted = true;
      const result = await this.#transport.append({
        url: this.#url,
        headers: this.#headers,
        body: entry.body,
        identity: entry.identity,
        signal: this.#abort.signal,
      });
      if (result.ok) {
        this.#nextSequence = entry.identity.sequence + 1;
        if (attempt > 1) {
          this.#onRecovery?.('append', attempt);
          entry.lifecycle?.event('stream.producer.recovered', {
            'netscript.stream.producer.phase': 'append',
            'netscript.stream.producer.attempt': attempt,
          });
        }
        this.#queue.settle(entry, { status: 'delivered', attempts: attempt });
        this.#transition('ready', 0);
        return true;
      }
      if (this.#abort.signal.aborted) {
        return false;
      }
      if (result.failure.kind === 'stale-epoch') {
        this.#epoch = (result.failure.currentEpoch ?? this.#epoch) + 1;
        this.#nextSequence = 0;
        entry.identity = this.#identity();
      } else if (!isRetryable(result.failure)) {
        this.#failActive(entry, result.failure, attempt);
        return false;
      }
      if (attempt === this.#reconnectPolicy.maxAttempts) {
        this.#failActive(entry, result.failure, attempt);
        return false;
      }
      this.#onRetry?.('append', attempt + 1, result.failure.kind);
      entry.lifecycle?.event('stream.producer.retry', {
        'netscript.stream.producer.phase': 'append',
        'netscript.stream.producer.attempt': attempt + 1,
        'netscript.stream.producer.reason': result.failure.kind,
      });
      if (!(await this.#waitBackoff(attempt, result.failure.message))) {
        return false;
      }
    }
    return false;
  }

  async #connectWithRetry(initial: boolean): Promise<boolean> {
    for (let attempt = 1; attempt <= this.#reconnectPolicy.maxAttempts; attempt++) {
      this.#transition(initial && attempt === 1 ? 'connecting' : 'reconnecting', attempt);
      const result = await this.#transport.connect({
        url: this.#url,
        headers: this.#headers,
        signal: this.#abort.signal,
      });
      if (result.ok) {
        if (attempt > 1) {
          this.#onRecovery?.('connect', attempt);
          this.#queue.notifyRecovery('connect', attempt);
        }
        this.#transition('ready', 0);
        return true;
      }
      if (this.#abort.signal.aborted) {
        return false;
      }
      if (!isRetryable(result.failure) || attempt === this.#reconnectPolicy.maxAttempts) {
        this.#fail(result.failure.message);
        return false;
      }
      this.#onRetry?.('connect', attempt + 1, result.failure.kind);
      this.#queue.notifyRetry('connect', attempt + 1, result.failure.kind);
      if (!(await this.#waitBackoff(attempt, result.failure.message))) {
        return false;
      }
    }
    return false;
  }

  async #backoff(attempt: number, error: string): Promise<void> {
    this.#transition('backoff', attempt, error);
    await this.#clock.sleep(backoffDelay(this.#reconnectPolicy, attempt, this.#random.next()), {
      signal: this.#abort.signal,
    });
  }

  async #waitBackoff(attempt: number, error: string): Promise<boolean> {
    try {
      await this.#backoff(attempt, error);
      return true;
    } catch {
      return false;
    }
  }

  #failActive(
    active: ProducerQueueEntry,
    failure: StreamProducerTransportFailureV1,
    attempt: number,
  ): void {
    this.#queue.settle(active, {
      status: 'delivery-unknown',
      reason: failure.kind === 'aborted' ? 'transport-aborted' : 'retry-exhausted',
      error: failure.message,
    });
    this.#fail(`${failure.message} (attempt ${attempt})`);
  }

  #fail(message: string): void {
    this.#accepted = false;
    this.#transition('failed', 0, message);
    for (const entry of [...this.#queue.entries]) {
      this.#queue.settle(entry, { status: 'cancelled', reason: 'producer-failed' });
    }
    this.#rejectReadyWaiters(new Error(message));
  }

  #transition(
    state: StreamProducerStateSnapshotV1['state'],
    attempt: number,
    error?: string,
  ): void {
    this.#state = {
      state,
      attempt,
      bufferedEvents: this.#queue.length,
      bufferedBytes: this.#queue.bytes,
      ...(error ? { error } : {}),
    };
    this.#onState?.(this.#state);
    if (state === 'ready') {
      for (const waiter of this.#readyWaiters) {
        waiter.resolve(undefined);
      }
      this.#readyWaiters.clear();
    }
  }

  #rejectReadyWaiters(error: Error): void {
    for (const waiter of this.#readyWaiters) {
      waiter.reject(error);
    }
    this.#readyWaiters.clear();
  }

  #bufferChanged(events: number, bytes: number): void {
    this.#state = { ...this.#state, bufferedEvents: events, bufferedBytes: bytes };
    this.#onBuffer?.(events, bytes);
  }

  #writeRejectionReason(): StreamWriteRejectionReasonV1 | undefined {
    if (this.#accepted) {
      return undefined;
    }
    switch (this.#state.state) {
      case 'stopping':
        return 'producer-stopping';
      case 'stopped':
        return 'producer-stopped';
      default:
        return 'producer-failed';
    }
  }

  #identity(): StreamProducerIdentityV1 {
    return {
      producerId: this.#producerId,
      epoch: this.#epoch,
      sequence: this.#nextSequence,
    };
  }
}
