import type {
  ReceiptClaim,
  ReceiptClaimResult,
  StoredCommandReceipt,
} from '../../../ports/command-store.ts';
import { CommandStoreError } from '../../../ports/command-store-error.ts';
import type { PostgresCommandClient } from '../ports/postgres-command-client.ts';
import { postgresCommandCode, postgresCommandFailure } from './postgres-command-errors.ts';

type Winner = Omit<StoredCommandReceipt, 'responseJson' | 'completedAt'> & {
  responseJson: string | null;
  completedAt: Date | null;
};

export async function postgresCommandClaim(
  tx: PostgresCommandClient,
  input: ReceiptClaim,
  waitMs: number,
): Promise<ReceiptClaimResult> {
  try {
    const [setting] = await tx.$queryRawUnsafe<{ value: string }[]>(
      "SELECT current_setting('lock_timeout') AS value",
    );
    await tx.$queryRawUnsafe("SELECT set_config('lock_timeout', $1, true)", `${waitMs}ms`);
    const inserted = await tx.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO netscript_command_receipt
      (id,scope,command_name,command_version,key_hash,request_hash,actor_kind,actor_subject,correlation_id,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (scope,command_name,key_hash) DO NOTHING RETURNING id`,
      input.id,
      input.scope,
      input.commandName,
      input.commandVersion,
      input.keyHash,
      input.requestHash,
      input.actorKind,
      input.actorSubject,
      input.correlationId,
      input.createdAt,
    );
    let result: ReceiptClaimResult;
    if (inserted.length === 1) result = { kind: 'execute', receiptId: inserted[0].id };
    else {
      const [winner] = await tx.$queryRawUnsafe<Winner[]>(
        `SELECT id, request_hash AS "requestHash", command_version AS "commandVersion",
        response_json AS "responseJson", correlation_id AS "correlationId", completed_at AS "completedAt"
        FROM netscript_command_receipt WHERE scope=$1 AND command_name=$2 AND key_hash=$3`,
        input.scope,
        input.commandName,
        input.keyHash,
      );
      if (
        !winner || typeof winner.responseJson !== 'string' || !(winner.completedAt instanceof Date)
      ) {
        throw new CommandStoreError({ kind: 'receipt_corrupt', retryable: false });
      }
      result =
        winner.requestHash === input.requestHash && winner.commandVersion === input.commandVersion
          ? {
            kind: 'replay',
            receipt: {
              ...winner,
              responseJson: winner.responseJson,
              completedAt: winner.completedAt,
            },
          }
          : { kind: 'mismatch' };
    }
    await tx.$queryRawUnsafe("SELECT set_config('lock_timeout', $1, true)", setting.value);
    return result;
  } catch (cause) {
    // No finally-query: a timed-out PostgreSQL transaction is already aborted.
    if (postgresCommandCode(cause) === '55P03') return { kind: 'busy', retryAfterMs: waitMs };
    if (cause instanceof CommandStoreError) throw cause;
    throw postgresCommandFailure(cause, 'claim');
  }
}
