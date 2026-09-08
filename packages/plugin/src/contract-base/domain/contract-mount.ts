/** Contract geometry shared by plugin policy compilation and router assembly. @module */
import { type AnyContractRouter, type EnhancedContractRouter, oc } from '@orpc/contract';

/** Version and namespace used by both a plugin router and its authorization contract. */
export interface PluginContractMount {
  /** Non-empty version segment without slashes, for example `v1`. */
  readonly version: string;
  /** Non-empty plugin namespace without slashes, for example `workers`. */
  readonly namespace: string;
}

/**
 * Mount a plugin contract at the same REST and RPC coordinates as its router.
 *
 * @param contract - The unmounted plugin contract, including procedure access metadata.
 * @param mount - The same coordinates supplied to the plugin router assembly.
 * @returns A new contract tree with version/namespace keys and prefixed REST paths.
 * @throws {TypeError} When either coordinate is empty or contains a slash.
 * @example
 * ```ts
 * import { oc } from '@orpc/contract';
 * import { mountPluginContract } from '@netscript/plugin/contract-base';
 * const contract = { describe: oc.route({ method: 'GET', path: '/describe' }) };
 * const mounted = mountPluginContract(contract, { version: 'v1', namespace: 'example' });
 * ```
 */
export function mountPluginContract<TContract extends AnyContractRouter>(
  contract: TContract,
  mount: PluginContractMount,
): {
  readonly [version: string]: {
    readonly [namespace: string]: EnhancedContractRouter<TContract, Record<never, never>>;
  };
} {
  for (const segment of [mount.version, mount.namespace]) {
    if (segment.length === 0 || segment.includes('/')) {
      throw new TypeError(
        'Plugin contract mount coordinates must be non-empty segments without slashes',
      );
    }
  }
  return {
    [mount.version]: {
      [mount.namespace]: oc.prefix(`/${mount.version}/${mount.namespace}`).router(contract),
    },
  };
}
