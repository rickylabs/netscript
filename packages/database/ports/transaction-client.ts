import type { TransactionOptions } from './database-client.ts';

/**
 * Interactive provider boundary preserving the callback client's distinct type.
 *
 * Bind this to the generated provider callback. TTx is the callback client, never
 * the root client; the consumer's generated alias excludes lifecycle and nested operations.
 *
 * @example
 * ```ts
 * import type { TransactionClientPort } from '@netscript/database/commands';
 * type Tx = { project: { update(): Promise<number> } };
 * declare const root: TransactionClientPort<Tx>;
 * await root.$transaction(async (tx) => await tx.project.update());
 * ```
 */
export interface TransactionClientPort<TTx> {
  /** Invoke the callback once and resolve only after its physical commit or rollback. */
  $transaction<TResult>(
    work: (tx: TTx) => Promise<TResult>,
    options?: TransactionOptions,
  ): Promise<TResult>;
}
