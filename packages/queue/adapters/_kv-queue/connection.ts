/**
 * Connection sources for the per-database queue dispatcher.
 *
 * Deno KV stops a queue listener only by closing its connection. A database opened by path gets a
 * dedicated listener connection; an in-memory database or a caller-owned handle has one.
 *
 * @module
 */

/** Identifies one Deno KV database: a caller-owned instance, or a path or URL to open. */
export type KvDatabaseTarget =
  | { readonly kv: Deno.Kv }
  | { readonly path?: string };

/** Connections a dispatcher uses for writes and for its listen loop. */
export interface KvQueueConnection {
  /** Whether each listen loop gets its own connection, so stopping it leaves writes untouched. */
  readonly dedicatedListener: boolean;
  /** Connection used for enqueue and dead-letter writes. */
  shared(): Promise<Deno.Kv>;
  /** Connection consumed by one listen loop. */
  listener(): Promise<Deno.Kv>;
  /**
   * Close connections this object opened. Caller-owned instances are left open.
   *
   * @returns Whether a listen loop on the shared connection was closed with it.
   */
  close(): Promise<boolean>;
}

const IN_MEMORY_PATH = ':memory:';

/**
 * Create the connection source for a KV database target.
 *
 * @param target - Caller-owned instance or path to open.
 * @returns Connection source for a dispatcher.
 */
export function createKvQueueConnection(target: KvDatabaseTarget): KvQueueConnection {
  if ('kv' in target) {
    return new SingleKvConnection(() => Promise.resolve(target.kv), false);
  }
  if (target.path === IN_MEMORY_PATH) {
    return new SingleKvConnection(() => Deno.openKv(IN_MEMORY_PATH), true);
  }
  return new PathKvConnection(target.path);
}

/**
 * One connection for writes and listening: a caller-owned instance, or an in-memory database,
 * which a second `openKv` call could not reach.
 */
class SingleKvConnection implements KvQueueConnection {
  readonly dedicatedListener = false;
  #kv: Promise<Deno.Kv> | null = null;

  constructor(
    private readonly open: () => Promise<Deno.Kv>,
    private readonly owned: boolean,
  ) {}

  shared(): Promise<Deno.Kv> {
    this.#kv ??= this.open();
    return this.#kv;
  }

  listener(): Promise<Deno.Kv> {
    return this.shared();
  }

  async close(): Promise<boolean> {
    const kv = this.#kv;
    if (!kv || !this.owned) {
      return false;
    }
    this.#kv = null;
    await closeOpened(kv);
    return true;
  }
}

/** Opens a database by path: one shared write connection, and a fresh one per listen loop. */
class PathKvConnection implements KvQueueConnection {
  readonly dedicatedListener = true;
  #shared: Promise<Deno.Kv> | null = null;

  constructor(private readonly path: string | undefined) {}

  shared(): Promise<Deno.Kv> {
    this.#shared ??= Deno.openKv(this.path);
    return this.#shared;
  }

  listener(): Promise<Deno.Kv> {
    return Deno.openKv(this.path);
  }

  async close(): Promise<boolean> {
    const shared = this.#shared;
    this.#shared = null;
    if (shared) {
      await closeOpened(shared);
    }
    return false;
  }
}

async function closeOpened(kv: Promise<Deno.Kv>): Promise<void> {
  try {
    closeQuietly(await kv);
  } catch {
    // The connection never opened; there is nothing to release.
  }
}

export function closeQuietly(kv: Deno.Kv): void {
  try {
    kv.close();
  } catch (error) {
    if (!(error instanceof Deno.errors.BadResource)) {
      throw error;
    }
  }
}
