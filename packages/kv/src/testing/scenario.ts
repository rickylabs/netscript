/**
 * Scenario registration shared by the KV contract harnesses.
 *
 * @module
 */

import type { KvStore } from '../../types/kv-store.ts';

/**
 * Adapter factory accepted by every contract in `@netscript/kv/testing`.
 */
export interface ContractTarget<S extends KvStore> {
  /** Human-readable adapter name used in Deno test titles. */
  readonly name: string;
  /** Creates a fresh adapter for each contract scenario. */
  readonly make: () => S | Promise<S>;
  /** Skip every scenario, e.g. when the backing service is not configured. */
  readonly ignore?: boolean;
}

/** One contract scenario, run against a fresh adapter. */
export interface Scenario<S extends KvStore> {
  /** Scenario title appended to the adapter name. */
  readonly title: string;
  /** Scenario body. */
  readonly run: (store: S) => Promise<void>;
}

/**
 * Register one Deno test per scenario; each gets a fresh adapter it closes.
 *
 * @param target - Adapter factory and display name.
 * @param scenarios - Scenarios to register.
 */
export function registerScenarios<S extends KvStore>(
  target: ContractTarget<S>,
  scenarios: readonly Scenario<S>[],
): void {
  for (const scenario of scenarios) {
    Deno.test({
      name: `${target.name}: ${scenario.title}`,
      ignore: target.ignore,
      async fn() {
        const store = await target.make();
        try {
          await scenario.run(store);
        } finally {
          await store.close();
        }
      },
    });
  }
}
