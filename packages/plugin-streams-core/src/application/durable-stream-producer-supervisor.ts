import {
  DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1,
  DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1,
  type StreamProducerBufferPolicyV1,
  type StreamProducerReadinessOptionsV1,
  type StreamProducerReconnectPolicyV1,
  type StreamProducerStateSnapshotV1,
  type StreamProducerTransportFailureV1,
  type StreamWriteOutcomeV1,
  type StreamWriteReceiptV1,
  type StreamWriteRejectionReasonV1,
} from '../domain/producer-contract-v1.ts';
import type { StreamProducerClockPort } from '../ports/stream-producer-clock-port.ts';
import type { StreamProducerRandomPort } from '../ports/stream-producer-random-port.ts';
import type {
  StreamProducerIdentityV1,
  StreamProducerTransportPort,
} from '../ports/stream-producer-transport-port.ts';

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: Error): void;
}

interface QueueEntry {
  readonly id: number;
  readonly body: string;
  readonly byteLength: number;
  readonly deferred: Deferred<StreamWriteOutcomeV1>;
  attempted: boolean;
  settled: boolean;
  identity?: StreamProducerIdentityV1;
}

interface ReadyWaiter extends Deferred<void> {
  readonly signal?: AbortSignal;
}

/** Dependencies and policy accepted by the producer application supervisor. */
export interface DurableStreamProducerSupervisorOptions {
  /** Durable stream URL. */
  readonly url: string;
  /** Request headers, including authorization. */
  readonly headers: Readonly<Record<string, string>>;
  /** Stable producer identity. */
  readonly producerId: string;
  /** Protocol transport adapter. */
  readonly transport: StreamProducerTransportPort;
  /** Backoff clock adapter. */
  readonly clock: StreamProducerClockPort;
  /** Backoff jitter adapter. */
  readonly random: StreamProducerRandomPort;
  /** Optional finite retry overrides. */
  readonly reconnectPolicy?: Partial<StreamProducerReconnectPolicyV1>;
  /** Optional dual buffer overrides. */
  readonly bufferPolicy?: Partial<StreamProducerBufferPolicyV1>;
  /** Optional lifecycle cancellation. */
  readonly signal?: AbortSignal;
  /** Called after local or acknowledged terminal shutdown. */
  readonly onStopped?: () => void;
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
  readonly #bufferPolicy: StreamProducerBufferPolicyV1;
  readonly #abort = new AbortController();
  readonly #queue: QueueEntry[] = [];
  readonly #readyWaiters = new Set<ReadyWaiter>();
  readonly #onStopped?: () => void;
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
  #receiptId = 0;
  #accepted = true;
  #epoch = 0;
  #nextSequence = 0;
  #bufferedBytes = 0;

  /** Start connecting immediately under a bounded policy. */
  constructor(options: DurableStreamProducerSupervisorOptions) {
    this.#url = options.url;
    this.#headers = options.headers;
    this.#producerId = options.producerId;
    this.#transport = options.transport;
    this.#clock = options.clock;
    this.#random = options.random;
    this.#reconnectPolicy = reconnectPolicy(options.reconnectPolicy);
    this.#bufferPolicy = bufferPolicy(options.bufferPolicy);
    this.#onStopped = options.onStopped;
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
  enqueue(body: string): StreamWriteReceiptV1 {
    const id = ++this.#receiptId;
    const rejection = this.#writeRejectionReason();
    if (rejection) {
      return rejectedReceipt(id, rejection);
    }

    const byteLength = new TextEncoder().encode(body).byteLength;
    if (this.#queue.length >= this.#bufferPolicy.maxEvents) {
      return rejectedReceipt(id, 'buffer-count-exceeded');
    }
    if (
      byteLength > this.#bufferPolicy.maxBytes ||
      this.#bufferedBytes + byteLength > this.#bufferPolicy.maxBytes
    ) {
      return rejectedReceipt(id, 'buffer-bytes-exceeded');
    }

    const deferred = createDeferred<StreamWriteOutcomeV1>();
    this.#queue.push({
      id,
      body,
      byteLength,
      deferred,
      attempted: false,
      settled: false,
    });
    this.#bufferedBytes += byteLength;
    this.#refreshBufferSnapshot();
    this.#kick();
    return { id, accepted: true, completion: deferred.promise };
  }

  /** Return an already-settled receipt for a write rejected before queue admission. */
  reject(reason: StreamWriteRejectionReasonV1): StreamWriteReceiptV1 {
    return rejectedReceipt(++this.#receiptId, reason);
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

    const deferred = createDeferred<void>();
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
    const snapshot = this.#queue.map((entry) => entry.deferred.promise);
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
    const active = this.#queue[0];
    if (active?.attempted) {
      this.#settle(active, {
        status: 'delivery-unknown',
        reason: 'producer-stopped',
      });
    }
    for (const entry of [...this.#queue]) {
      this.#settle(entry, { status: 'cancelled', reason: 'producer-stopped' });
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
      const entry = this.#queue[0];
      if (!entry || !(await this.#deliver(entry))) {
        return;
      }
    }
  }

  async #deliver(entry: QueueEntry): Promise<boolean> {
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
        this.#settle(entry, { status: 'delivered', attempts: attempt });
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
    active: QueueEntry,
    failure: StreamProducerTransportFailureV1,
    attempt: number,
  ): void {
    this.#settle(active, {
      status: 'delivery-unknown',
      reason: failure.kind === 'aborted' ? 'transport-aborted' : 'retry-exhausted',
      error: failure.message,
    });
    this.#fail(`${failure.message} (attempt ${attempt})`);
  }

  #fail(message: string): void {
    this.#accepted = false;
    this.#transition('failed', 0, message);
    for (const entry of [...this.#queue]) {
      this.#settle(entry, { status: 'cancelled', reason: 'producer-failed' });
    }
    this.#rejectReadyWaiters(new Error(message));
  }

  #settle(entry: QueueEntry, outcome: StreamWriteOutcomeV1): void {
    if (entry.settled) {
      return;
    }
    entry.settled = true;
    const index = this.#queue.indexOf(entry);
    if (index >= 0) {
      this.#queue.splice(index, 1);
      this.#bufferedBytes -= entry.byteLength;
      this.#refreshBufferSnapshot();
    }
    entry.deferred.resolve(outcome);
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
      bufferedBytes: this.#bufferedBytes,
      ...(error ? { error } : {}),
    };
    if (state === 'ready') {
      for (const waiter of this.#readyWaiters) {
        waiter.resolve(undefined);
      }
      this.#readyWaiters.clear();
    }
  }

  #refreshBufferSnapshot(): void {
    this.#state = {
      ...this.#state,
      bufferedEvents: this.#queue.length,
      bufferedBytes: this.#bufferedBytes,
    };
  }

  #rejectReadyWaiters(error: Error): void {
    for (const waiter of this.#readyWaiters) {
      waiter.reject(error);
    }
    this.#readyWaiters.clear();
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

function rejectedReceipt(id: number, reason: StreamWriteRejectionReasonV1): StreamWriteReceiptV1 {
  return {
    id,
    accepted: false,
    completion: Promise.resolve({ status: 'rejected', reason }),
  };
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => undefined;
  let rejectPromise: (reason: Error) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function reconnectPolicy(
  input: Partial<StreamProducerReconnectPolicyV1> | undefined,
): StreamProducerReconnectPolicyV1 {
  const policy = { ...DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1, ...input };
  if (
    !Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1 ||
    !Number.isFinite(policy.initialDelayMs) || policy.initialDelayMs < 0 ||
    !Number.isFinite(policy.multiplier) || policy.multiplier < 1 ||
    !Number.isFinite(policy.maxDelayMs) || policy.maxDelayMs < 0 ||
    !Number.isFinite(policy.jitterRatio) || policy.jitterRatio < 0 || policy.jitterRatio > 1
  ) {
    throw new TypeError('Reconnect policy must contain finite bounded values');
  }
  return policy;
}

function bufferPolicy(
  input: Partial<StreamProducerBufferPolicyV1> | undefined,
): StreamProducerBufferPolicyV1 {
  const policy = { ...DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1, ...input };
  if (
    !Number.isInteger(policy.maxEvents) || policy.maxEvents < 1 ||
    !Number.isInteger(policy.maxBytes) || policy.maxBytes < 1
  ) {
    throw new TypeError('Buffer policy must contain positive finite integer bounds');
  }
  return policy;
}

function backoffDelay(
  policy: StreamProducerReconnectPolicyV1,
  failedAttempt: number,
  random: number,
): number {
  const base = Math.min(
    policy.initialDelayMs * policy.multiplier ** Math.max(0, failedAttempt - 1),
    policy.maxDelayMs,
  );
  const boundedRandom = Math.min(Math.max(random, 0), 0.9999999999999999);
  const jitter = 1 + (boundedRandom * 2 - 1) * policy.jitterRatio;
  return Math.max(0, Math.round(base * jitter));
}

function isRetryable(failure: StreamProducerTransportFailureV1): boolean {
  return failure.kind === 'retryable' || failure.kind === 'stale-epoch';
}

function abortError(signal?: AbortSignal): Error {
  const reason = signal?.reason;
  return reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
}
