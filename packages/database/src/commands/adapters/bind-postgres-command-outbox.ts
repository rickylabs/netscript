import type { StoredCommandOutbox } from '../../../ports/command-store.ts';
import type { PostgresCommandClient } from '../ports/postgres-command-client.ts';
import { appendPostgresCommandOutbox } from './postgres-command-rows.ts';

/** Outbox-only writer bound to the caller's live interactive transaction callback. */
export interface PostgresCommandOutboxWriter {
  /** Append a detached command set without opening or committing another transaction. */
  append(records: readonly StoredCommandOutbox[]): Promise<void>;
}

/**
 * Bind the reviewed command outbox SQL to a callback-derived client.
 * Requires the shipped migration; construction performs no I/O or DDL. Root and
 * lifecycle handles are refused. The provider owns callback lifetime and rollback.
 *
 * @example
 * ```ts
 * import { bindPostgresCommandOutbox, type PostgresCommandClient } from '@netscript/database/commands/postgres';
 * declare const callback: PostgresCommandClient;
 * await bindPostgresCommandOutbox(callback).append([]);
 * ```
 */
export function bindPostgresCommandOutbox(tx: PostgresCommandClient): PostgresCommandOutboxWriter {
  for (const key of ['$transaction', '$connect', '$disconnect', '$on', '$use', '$extends']) {
    if (typeof Reflect.get(tx, key) === 'function') {
      throw new TypeError('PostgreSQL outbox requires a callback client without root operations.');
    }
  }
  if (typeof tx.$queryRawUnsafe !== 'function' || typeof tx.$executeRawUnsafe !== 'function') {
    throw new TypeError('PostgreSQL outbox requires the raw callback client.');
  }
  return Object.freeze({
    async append(records: readonly StoredCommandOutbox[]): Promise<void> {
      await appendPostgresCommandOutbox(tx, structuredClone(records));
    },
  });
}
