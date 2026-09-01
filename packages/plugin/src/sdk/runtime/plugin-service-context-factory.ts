import { baseContract } from '@netscript/contracts';
import { createPluginLogger } from '../../../loader.ts';
import type { PluginServiceContext } from './plugin-service-context.ts';

type AsyncResolver<T> = () => Promise<T>;

interface PluginServiceKv {
  readonly supportsWatch: boolean;
  get(...args: unknown[]): Promise<unknown>;
  set(...args: unknown[]): Promise<void>;
  delete(...args: unknown[]): Promise<void>;
  has(...args: unknown[]): Promise<boolean>;
  list(...args: unknown[]): AsyncIterable<unknown>;
  watch(...args: unknown[]): AsyncIterable<unknown>;
  watchPrefix(...args: unknown[]): AsyncIterable<unknown>;
  close(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}

class LazyPluginServiceKv implements PluginServiceKv {
  readonly supportsWatch = true;
  readonly #resolveKv: AsyncResolver<PluginServiceKv>;

  constructor(resolveKv: AsyncResolver<unknown>) {
    this.#resolveKv = memoizeAsyncResolver(async () => {
      const kv = await resolveKv();
      if (!isPluginServiceKv(kv)) {
        throw new TypeError('Plugin service KV resolver returned an incompatible adapter.');
      }
      return kv;
    });
  }

  get(...args: unknown[]): Promise<unknown> {
    return this.#resolveKv().then((kv) => kv.get(...args));
  }

  set(...args: unknown[]): Promise<void> {
    return this.#resolveKv().then((kv) => kv.set(...args));
  }

  delete(...args: unknown[]): Promise<void> {
    return this.#resolveKv().then((kv) => kv.delete(...args));
  }

  has(...args: unknown[]): Promise<boolean> {
    return this.#resolveKv().then((kv) => kv.has(...args));
  }

  list(...args: unknown[]): AsyncIterable<unknown> {
    return this.listResolved(args);
  }

  watch(...args: unknown[]): AsyncIterable<unknown> {
    return this.watchResolved(args);
  }

  watchPrefix(...args: unknown[]): AsyncIterable<unknown> {
    return this.watchPrefixResolved(args);
  }

  close(): Promise<void> {
    return this.#resolveKv().then((kv) => kv.close());
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }

  private async *listResolved(args: unknown[]): AsyncIterable<unknown> {
    yield* (await this.#resolveKv()).list(...args);
  }

  private async *watchResolved(args: unknown[]): AsyncIterable<unknown> {
    yield* (await this.#resolveKv()).watch(...args);
  }

  private async *watchPrefixResolved(args: unknown[]): AsyncIterable<unknown> {
    yield* (await this.#resolveKv()).watchPrefix(...args);
  }
}

/**
 * Assemble a plugin service context around caller-owned database and KV resolvers.
 *
 * Neither resolver runs until its corresponding context surface is first used. Each resolver's
 * promise is then reused for all later and concurrent access.
 *
 * @param pluginName - Plugin name used to scope the host logger
 * @param resolvers - Project-owned database and KV resolver functions
 * @returns The assembled host context without resolving either adapter
 *
 * @example
 * ```ts
 * import { getKv } from '@netscript/kv';
 * import { createPluginServiceContext } from '@netscript/plugin';
 *
 * // The host owns the database client and supplies it as an async resolver.
 * // Any `() => Promise<unknown>` satisfies the contract, so the plugin package
 * // never takes a dependency on a concrete database adapter.
 * declare const openDatabaseClient: () => Promise<unknown>;
 *
 * const context = await createPluginServiceContext('workers', {
 *   getDatabaseClient: () => openDatabaseClient(),
 *   getKv: () => getKv(),
 * });
 * ```
 */
export function createPluginServiceContext(
  pluginName: string,
  resolvers: {
    /** Resolve the project-owned database client. */
    readonly getDatabaseClient: () => Promise<unknown>;
    /** Resolve the host-selected key-value adapter. */
    readonly getKv: () => Promise<unknown>;
  },
): Promise<PluginServiceContext> {
  const getDatabaseClient = memoizeAsyncResolver(resolvers.getDatabaseClient);

  return Promise.resolve({
    db: {
      getClient: getDatabaseClient,
    },
    contracts: {
      base: baseContract,
      versions: {},
    },
    kv: new LazyPluginServiceKv(resolvers.getKv),
    logger: createPluginLogger(pluginName),
    env: Deno.env.toObject(),
  });
}

function memoizeAsyncResolver<T>(resolver: AsyncResolver<T>): AsyncResolver<T> {
  let resolved: Promise<T> | undefined;
  return () => resolved ??= Promise.resolve().then(resolver);
}

function isPluginServiceKv(value: unknown): value is PluginServiceKv {
  if (typeof value !== 'object' || value === null) return false;
  return (
    typeof Reflect.get(value, 'supportsWatch') === 'boolean' &&
    hasMethod(value, 'get') &&
    hasMethod(value, 'set') &&
    hasMethod(value, 'delete') &&
    hasMethod(value, 'has') &&
    hasMethod(value, 'list') &&
    hasMethod(value, 'watch') &&
    hasMethod(value, 'watchPrefix') &&
    hasMethod(value, 'close') &&
    hasMethod(value, Symbol.asyncDispose)
  );
}

function hasMethod(value: object, key: PropertyKey): boolean {
  return typeof Reflect.get(value, key) === 'function';
}
