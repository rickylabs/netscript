import type {
  ReceiptCompletion,
  StoredCommandAudit,
  StoredCommandOutbox,
} from '../../../ports/command-store.ts';
import type { PostgresCommandClient } from '../ports/postgres-command-client.ts';
import { CommandStoreError } from '../../../ports/command-store-error.ts';
import { postgresCommandFailure } from './postgres-command-errors.ts';

export async function completePostgresCommandReceipt(
  tx: PostgresCommandClient,
  input: ReceiptCompletion,
): Promise<void> {
  try {
    const count = await tx.$executeRawUnsafe(
      'UPDATE netscript_command_receipt SET response_json=$2,completed_at=$3 WHERE id=$1 AND response_json IS NULL AND completed_at IS NULL',
      input.receiptId,
      input.responseJson,
      input.completedAt,
    );
    if (count !== 1) throw new CommandStoreError({ kind: 'receipt_corrupt', retryable: false });
  } catch (cause) {
    if (cause instanceof CommandStoreError) throw cause;
    throw postgresCommandFailure(cause, 'complete');
  }
}

export async function appendPostgresCommandAudit(
  tx: PostgresCommandClient,
  records: readonly StoredCommandAudit[],
): Promise<void> {
  try {
    for (const r of records) {
      await tx.$executeRawUnsafe(
        `INSERT INTO netscript_command_audit
        (id,execution_id,command_name,command_version,action,subject_type,subject_id,actor_kind,actor_subject,actor_scheme,correlation_id,data_json,occurred_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        r.id,
        r.executionId,
        r.commandName,
        r.commandVersion,
        r.action,
        r.subjectType,
        r.subjectId,
        r.actorKind,
        r.actorSubject,
        r.actorScheme ?? null,
        r.correlationId,
        r.dataJson ?? null,
        r.occurredAt,
      );
    }
  } catch (cause) {
    throw postgresCommandFailure(cause, 'flush');
  }
}

export async function appendPostgresCommandOutbox(
  tx: PostgresCommandClient,
  records: readonly StoredCommandOutbox[],
): Promise<void> {
  try {
    for (const r of records) {
      await tx.$executeRawUnsafe(
        `INSERT INTO netscript_command_outbox
        (id,execution_id,command_name,command_version,destination,topic,payload_json,dedupe_key,correlation_id,traceparent,tracestate,available_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        r.id,
        r.executionId,
        r.commandName,
        r.commandVersion,
        r.destination,
        r.topic,
        r.payloadJson,
        r.dedupeKey,
        r.correlationId,
        r.traceparent ?? null,
        r.tracestate ?? null,
        r.availableAt,
      );
    }
  } catch (cause) {
    throw postgresCommandFailure(cause, 'flush');
  }
}
