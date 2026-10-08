import type {
  CommandReceiptRow,
  CommandStorePort,
  StoredCommandAudit,
  StoredCommandOutbox,
} from '@netscript/database/commands';
import type { MemoryCommandBusiness } from './memory-command-store.ts';
import { createMemoryCommandStore } from './memory-command-store.ts';

/** Detached inspection of the conformance business scalar and all committed side rows. */
export type CommandConformanceInspection = Readonly<{
  businessValue: string | undefined;
  receipts: readonly CommandReceiptRow[];
  audit: readonly StoredCommandAudit[];
  outbox: readonly StoredCommandOutbox[];
}>;

/**
 * Provider-neutral fixture over a database-owned store and its genuine generic business handle.
 * Each factory invocation must start empty. Inspection reads committed state, never a draft.
 * Seeding accepts deliberately corrupt receipts; outsideWrite deliberately bypasses the binding.
 * A provider adapter owns cleanup, isolation and connection lifecycle around the suite.
 */
export interface CommandConformanceFixture<TTx> {
  /** Actual bound command store to qualify. */
  readonly store: CommandStorePort<TTx>;
  /** Write the scalar using only the supplied transaction business handle. */
  write(tx: TTx, value: string): void | Promise<void>;
  /** CAS the scalar using only the supplied transaction business handle. */
  compareAndSet(tx: TTx, expected: string | undefined, value: string): boolean | Promise<boolean>;
  /** Inspect all four committed collections. */
  inspect(): CommandConformanceInspection | Promise<CommandConformanceInspection>;
  /** Seed a deliberately invalid completed or incomplete receipt. */
  seedReceipt(row: CommandReceiptRow): void | Promise<void>;
  /** Deliberately commit a business write outside the bound transaction for a negative control. */
  outsideWrite(value: string): void | Promise<void>;
}

/** Construct a simulated in-memory fixture; this is no real-provider certification. */
export function createMemoryCommandConformanceFixture(): CommandConformanceFixture<
  MemoryCommandBusiness
> {
  const store = createMemoryCommandStore();
  return Object.freeze({
    store,
    write: (tx: MemoryCommandBusiness, value: string): void => tx.set('conformance', value),
    compareAndSet: (
      tx: MemoryCommandBusiness,
      expected: string | undefined,
      value: string,
    ): boolean => tx.compareAndSet('conformance', expected, value),
    inspect: (): CommandConformanceInspection => {
      const snapshot = store.snapshot();
      return Object.freeze({ ...snapshot, businessValue: snapshot.business.conformance });
    },
    seedReceipt: (row: CommandReceiptRow): void => store.seedReceipt(row),
    outsideWrite: (value: string): void =>
      store.writeBusinessOutsideTransaction('conformance', value),
  });
}
