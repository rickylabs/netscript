import {
  type ClaimedCommandOutboxRow,
  COMMAND_RELAY_FAILURE_CLASSES,
  type CommandOutboxRelayStore,
} from '../../../ports/command-outbox-relay.ts';
import type { TransactionClientPort } from '../../../ports/transaction-client.ts';
import type { PostgresCommandClient } from '../ports/postgres-command-client.ts';
import type { PostgresCommandStoreOptions } from './create-postgres-command-store.ts';

type RawClaim = Omit<ClaimedCommandOutboxRow, 'traceparent' | 'tracestate'> & {
  traceparent: string | null;
  tracestate: string | null;
};
function instant(value: Date): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError('[netscript.command.relay.store] valid instant required');
  }
  return new Date(value.getTime());
}
function identity(value: string): string {
  if (
    typeof value !== 'string' || !value.trim() || !value.isWellFormed() ||
    new TextEncoder().encode(value).length > 256
  ) {
    throw new TypeError('[netscript.command.relay.store] bounded identity required');
  }
  return value;
}
/**
 * Bind raw outbox leasing to the consumer's reviewed PostgreSQL migration and true callback.
 *
 * One atomic SKIP LOCKED statement claims due rows. Every settlement compares row id,
 * token, expiry and unpublished/nonterminal state. Normalized acceptance and publication
 * share one write. Construction does no IO or DDL; the consumer owns driver permissions,
 * migration and root lifecycle. In-flight cancellation relies on the explicit finite timeout.
 *
 * @example
 * ```ts
 * import { createPostgresCommandOutboxRelayStore, type PostgresCommandClient } from '@netscript/database/commands/postgres';
 * import type { TransactionClientPort } from '@netscript/database/commands';
 * declare const client: TransactionClientPort<PostgresCommandClient>;
 * const store = createPostgresCommandOutboxRelayStore(client, { transactionTimeoutMs: 5000 });
 * await store.claim({ limit: 8, leaseMs: 10000, now: new Date(), claimToken: crypto.randomUUID() });
 * ```
 */
export function createPostgresCommandOutboxRelayStore<TTx extends PostgresCommandClient>(
  root: TransactionClientPort<TTx>,
  options: PostgresCommandStoreOptions,
): CommandOutboxRelayStore {
  const timeout = options.transactionTimeoutMs;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60000) {
    throw new TypeError('[netscript.command.relay.store] finite transaction timeout required');
  }
  function checkpoint(signal?: AbortSignal): void {
    signal?.throwIfAborted();
  }
  async function transaction<T>(work: (tx: TTx) => Promise<T>, signal?: AbortSignal): Promise<T> {
    checkpoint(signal);
    let entered = false;
    return await root.$transaction(async (tx) => {
      if (entered) throw new TypeError('[netscript.command.relay.store] callback reentry refused');
      entered = true;
      for (const key of ['$transaction', '$connect', '$disconnect', '$on', '$use', '$extends']) {
        if (typeof Reflect.get(tx, key) === 'function') {
          throw new TypeError('[netscript.command.relay.store] root client refused');
        }
      }
      checkpoint(signal);
      const result = await work(tx);
      checkpoint(signal);
      return result;
    }, { timeout, isolationLevel: 'ReadCommitted' });
  }
  return Object.freeze<CommandOutboxRelayStore>({
    async claim(request, signal) {
      const now = instant(request.now), token = identity(request.claimToken);
      if (
        !Number.isSafeInteger(request.limit) || request.limit < 1 || request.limit > 64 ||
        !Number.isSafeInteger(request.leaseMs) || request.leaseMs < 1 || request.leaseMs > 60000
      ) {
        throw new TypeError('[netscript.command.relay.store] bounded claim policy required');
      }
      const until = instant(new Date(now.getTime() + request.leaseMs));
      return await transaction(async (tx) => {
        const rows = await tx.$queryRawUnsafe<RawClaim[]>(
          `
WITH due AS (
 SELECT id FROM netscript_command_outbox
 WHERE published_at IS NULL AND terminal_at IS NULL AND available_at <= $1
 AND (claim_until IS NULL OR claim_until <= $1)
 ORDER BY available_at, id LIMIT $2 FOR UPDATE SKIP LOCKED
)
UPDATE netscript_command_outbox AS message
SET claim_token=$3, claim_until=$4, attempt_count=message.attempt_count+1
FROM due WHERE message.id=due.id
RETURNING message.id, execution_id AS "executionId", command_name AS "commandName",
 command_version AS "commandVersion", destination, topic, payload_json AS "payloadJson",
 dedupe_key AS "dedupeKey", correlation_id AS "correlationId", traceparent, tracestate,
 attempt_count AS "attemptCount", claim_token AS "claimToken", claim_until AS "claimUntil"`,
          now,
          request.limit,
          token,
          until,
        );
        return Object.freeze(rows.map(({ traceparent, tracestate, ...row }) =>
          Object.freeze({
            ...row,
            claimUntil: new Date(row.claimUntil.getTime()),
            ...(traceparent === null ? {} : { traceparent }),
            ...(tracestate === null ? {} : { tracestate }),
          })
        ));
      }, signal);
    },
    async markPublished(request, signal) {
      const id = identity(request.id),
        token = identity(request.claimToken),
        now = instant(request.publishedAt);
      const acceptanceId = request.acceptance === undefined
        ? null
        : identity(request.acceptance.identity);
      const acceptedAt = request.acceptance === undefined
        ? null
        : instant(request.acceptance.acceptedAt);
      return await transaction(async (tx) =>
        (await tx.$executeRawUnsafe(
          `
UPDATE netscript_command_outbox SET published_at=$3, acceptance_identity=$4, accepted_at=$5,
 claim_token=NULL, claim_until=NULL
WHERE id=$1 AND claim_token=$2 AND claim_until > $3
 AND published_at IS NULL AND terminal_at IS NULL`,
          id,
          token,
          now,
          acceptanceId,
          acceptedAt,
        )) === 1, signal);
    },
    async release(request, signal) {
      const id = identity(request.id),
        token = identity(request.claimToken),
        now = instant(request.now);
      if (!COMMAND_RELAY_FAILURE_CLASSES.includes(request.failure)) {
        throw new TypeError('[netscript.command.relay.store] finite failure required');
      }
      if (request.disposition !== 'retry' && request.disposition !== 'terminal') {
        throw new TypeError('[netscript.command.relay.store] invalid disposition');
      }
      const at = instant(request.disposition === 'retry' ? request.retryAt : request.terminalAt);
      if (
        request.disposition === 'retry'
          ? at.getTime() <= now.getTime()
          : at.getTime() !== now.getTime()
      ) {
        throw new TypeError('[netscript.command.relay.store] invalid release instant');
      }
      const statement = request.disposition === 'retry' ? 'available_at=$4' : 'terminal_at=$4';
      return await transaction(async (tx) =>
        (await tx.$executeRawUnsafe(
          `
UPDATE netscript_command_outbox SET ${statement}, last_failure=$5, claim_token=NULL, claim_until=NULL
WHERE id=$1 AND claim_token=$2 AND claim_until > $3
 AND published_at IS NULL AND terminal_at IS NULL`,
          id,
          token,
          now,
          at,
          request.failure,
        )) === 1, signal);
    },
  });
}
