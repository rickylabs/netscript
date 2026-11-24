/** Coalesces sliding TTL renewals for the native file-store compatibility adapter. @module */

import { AsyncLocalStorage } from 'node:async_hooks';

const FLUSH_INTERVAL_MS = 25;
const RETRY_INTERVAL_MS = 100;
const STREAM_PREFIX = 'stream:';

/** The retention fields used by the pinned native store. Other metadata travels intact. */
export interface NativeStreamMetadata {
  readonly path: string;
  readonly directoryName: string;
  readonly createdAt: number;
  readonly lastAccessedAt?: number;
  readonly ttlSeconds?: number;
  readonly currentOffset?: string;
  readonly closed?: boolean;
  readonly softDeleted?: boolean;
}

interface NativeMetadataDb {
  get(key: string): NativeStreamMetadata | undefined;
  put(key: string | symbol, value: unknown, ...options: unknown[]): unknown;
  putSync(key: string, metadata: NativeStreamMetadata): boolean;
  transactionAsync(callback: () => void): Promise<void>;
  readonly flushed: PromiseLike<unknown>;
}

interface Stamp {
  readonly at: number;
  readonly version: number;
}

interface Topic {
  readonly key: string;
  readonly generation: string;
  latest: Stamp;
  submitted: Stamp;
  committed: Stamp;
}

interface AppendAccess {
  readonly key: string;
  written?: { topic: Topic; stamp: Stamp };
}

const keyFor = (path: string): string => STREAM_PREFIX + path;
const accessTime = (meta: NativeStreamMetadata): number => meta.lastAccessedAt ?? meta.createdAt;

function assertNativeDatabase(value: unknown): asserts value is NativeMetadataDb {
  if (
    !value || typeof value !== 'object' ||
    !['get', 'put', 'putSync', 'transactionAsync'].every((key) =>
      typeof Reflect.get(value, key) === 'function'
    ) || typeof Reflect.get(value, 'flushed')?.then !== 'function'
  ) throw new Error('Unsupported durable-streams storage API: missing LMDB writer');
}

/** Coordinates live expiry, read completion and the native metadata writer. */
export class SlidingStreamAccess {
  readonly #db: NativeMetadataDb;
  readonly #topics = new Map<string, Topic>();
  readonly #dirty = new Set<Topic>();
  readonly #append = new AsyncLocalStorage<AppendAccess>();
  #write: Promise<void> | undefined;
  #closing = false;
  #retrying = false;
  #writingRenewal = false;
  #version = 0;

  constructor(db: unknown, private readonly reportFailure: (error: unknown) => void) {
    assertNativeDatabase(db);
    this.#db = db;
    // Native append builds a whole metadata snapshot before doing file I/O.
    // Keep access metadata current when it submits the snapshot, and give a
    // confirmed append its own renewal in that existing transaction.
    const put = db.put.bind(db);
    db.put = (key, value, ...options) => {
      if (!this.#writingRenewal && typeof key === 'string' && key.startsWith(STREAM_PREFIX)) {
        value = this.#prepareMetadata(key, value as NativeStreamMetadata);
      }
      return put(key, value, ...options);
    };
  }

  /** Associate upstream append touches with the metadata write that already renewed them. */
  appendRequest<T>(path: string, run: () => T): T {
    return this.#append.run({ key: keyFor(path) }, run);
  }

  /** Give an acknowledged duplicate its own renewal when no append transaction ran. */
  async renewDuplicate(path: string): Promise<void> {
    const key = keyFor(path);
    const append = this.#append.getStore();
    if (append?.key !== key) return;
    const meta = this.#db.get(key);
    if (meta?.ttlSeconds === undefined) return;
    const topic = this.#topic(key, meta);
    const stamp = this.#stamp();
    let written: Stamp | undefined;
    await this.#db.transactionAsync(() => {
      written = this.#persist(topic, stamp);
    });
    if (written) append.written = { topic, stamp: written };
  }

  /** Give native expiry checks and metadata readers the newest live access. */
  current(meta: NativeStreamMetadata): NativeStreamMetadata {
    if (meta.ttlSeconds === undefined) return meta;
    const topic = this.#topics.get(keyFor(meta.path));
    if (
      topic?.generation !== meta.directoryName ||
      topic.latest.version <= topic.committed.version
    ) return meta;
    return { ...meta, lastAccessedAt: topic.latest.at };
  }

  /** Update live expiry without waiting for a metadata write. */
  touch(path: string): void {
    if (this.#closing) return;
    const key = keyFor(path);
    const append = this.#append.getStore();
    if (append?.key === key && append.written) {
      this.#confirm(append.written.topic, append.written.stamp);
      return;
    }

    const meta = this.#db.get(key);
    if (meta?.ttlSeconds === undefined) return;
    const topic = this.#topic(key, meta);
    const at = Date.now();
    if (at === topic.latest.at) return;
    topic.latest = { at, version: ++this.#version };
    this.#dirty.add(topic);
    this.#schedule();
  }

  /** Wait for the access that the upstream read had observed before emitting its response. */
  waitForRead(path: string): Promise<void> | undefined {
    const topic = this.#topics.get(keyFor(path));
    if (!topic || topic.latest.version <= topic.committed.version) return;
    return this.#waitFor(topic, topic.latest.version);
  }

  /** Discard the access state of a physically removed stream. */
  forget(path: string): void {
    const key = keyFor(path);
    const topic = this.#topics.get(key);
    if (topic) this.#dirty.delete(topic);
    this.#topics.delete(key);
  }

  /** Drop access state after the native store has cleared all stream records. */
  clear(): void {
    this.#dirty.clear();
    this.#topics.clear();
  }

  /** Drain outstanding renewals before closing the native store. */
  async close(): Promise<void> {
    this.#closing = true;
    await this.#write?.catch(() => undefined);
    try {
      await this.#flush();
    } catch (cause) {
      throw new Error('Could not flush Streams sliding TTL renewals at shutdown', { cause });
    }
  }

  #stamp(): Stamp {
    return { at: Date.now(), version: ++this.#version };
  }

  #topic(key: string, meta: NativeStreamMetadata): Topic {
    const existing = this.#topics.get(key);
    if (existing?.generation === meta.directoryName) return existing;
    if (existing) this.#dirty.delete(existing);
    const stamp = { at: accessTime(meta), version: 0 };
    const topic = {
      key,
      generation: meta.directoryName,
      latest: stamp,
      submitted: stamp,
      committed: stamp,
    };
    this.#topics.set(key, topic);
    return topic;
  }

  #prepareMetadata(key: string, meta: NativeStreamMetadata): NativeStreamMetadata {
    if (meta.ttlSeconds === undefined) return meta;
    const current = this.#db.get(key);
    const append = this.#append.getStore();
    if (append?.key === key && current?.directoryName !== meta.directoryName) {
      throw new Error('Stream not found during append metadata commit');
    }
    if (current?.directoryName !== meta.directoryName) return meta;
    if (
      append?.key === key && !meta.softDeleted &&
      (meta.currentOffset !== current.currentOffset || meta.closed)
    ) {
      const topic = this.#topic(key, current);
      const stamp = this.#stamp();
      topic.submitted = stamp;
      append.written = { topic, stamp };
      return { ...meta, lastAccessedAt: stamp.at };
    }
    return accessTime(meta) === accessTime(current)
      ? meta
      : { ...meta, lastAccessedAt: accessTime(current) };
  }

  #confirm(topic: Topic, stamp: Stamp): void {
    if (this.#topics.get(topic.key) !== topic) return;
    if (stamp.version > topic.committed.version) topic.committed = stamp;
    if (stamp.version > topic.latest.version) topic.latest = stamp;
    if (topic.latest.version <= topic.committed.version) this.#dirty.delete(topic);
  }

  async #waitFor(topic: Topic, version: number): Promise<void> {
    while (this.#topics.get(topic.key) === topic && topic.committed.version < version) {
      const write = this.#schedule();
      if (!write) throw new Error('Streams stopped before the read renewal committed');
      await write;
    }
  }

  #schedule(): Promise<void> | undefined {
    if (this.#write) return this.#write;
    if (this.#closing || !this.#dirty.size) return;
    const write = this.#write = new Promise<void>((resolve) =>
      setTimeout(resolve, this.#retrying ? RETRY_INTERVAL_MS : FLUSH_INTERVAL_MS)
    ).then(() => this.#flush());
    void write.then(
      () => this.#afterWrite(),
      (error: unknown) => {
        if (!this.#retrying) this.reportFailure(error);
        this.#afterWrite(true);
      },
    );
    return write;
  }

  #afterWrite(retrying = false): void {
    this.#write = undefined;
    this.#retrying = retrying;
    this.#schedule();
  }

  async #flush(): Promise<void> {
    if (!this.#dirty.size) return;
    const batch = Array.from(this.#dirty);
    const written = new Map<Topic, Stamp>();
    await this.#db.transactionAsync(() => {
      for (const topic of batch) {
        if (this.#dirty.has(topic)) {
          const stamp = this.#persist(topic, topic.latest);
          if (stamp) written.set(topic, stamp);
        }
      }
    });
    await this.#db.flushed;
    for (const [topic, stamp] of written) this.#confirm(topic, stamp);
  }

  #persist(topic: Topic, stamp: Stamp): Stamp | undefined {
    if (this.#topics.get(topic.key) !== topic) return;
    const meta = this.#db.get(topic.key);
    if (meta?.directoryName !== topic.generation) {
      this.#dirty.delete(topic);
      this.#topics.delete(topic.key);
      return;
    }
    // An append queued in this LMDB transaction may already have supplied a newer access.
    if (topic.submitted.version > stamp.version && accessTime(meta) === topic.submitted.at) {
      stamp = topic.submitted;
    }
    this.#writingRenewal = true;
    try {
      if (!this.#db.putSync(topic.key, { ...meta, lastAccessedAt: stamp.at })) {
        throw new Error('LMDB rejected a sliding TTL renewal');
      }
      topic.submitted = stamp;
      return stamp;
    } finally {
      this.#writingRenewal = false;
    }
  }
}
