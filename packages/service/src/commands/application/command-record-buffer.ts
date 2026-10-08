import type { StoredCommandAudit, StoredCommandOutbox } from '@netscript/database/commands';
import type {
  CommandAuditInput,
  CommandOutboxInput,
  CommandRecordRequirement,
} from '../domain/definition.ts';
import type { CommandRecordLimits } from '../domain/execution.ts';
import { CommandError } from '../domain/failure.ts';
import type { CommandEnvelope } from '../domain/values.ts';
import { canonicalCommandJson } from './canonical-json.ts';
import { commandString } from './command-identity.ts';

/** Fully snapshotted audit intent; no caller-owned JSON remains in the buffer. */
type AuditIntent = Readonly<
  { action: string; subjectType: string; subjectId: string; dataJson?: string }
>;
/** Encoded delivery intent; recording performs no IO. */
type OutboxIntent = Readonly<{
  destination: string;
  topic: string;
  payloadJson: string;
  dedupeKey?: string;
  availableAt?: number;
}>;
/** Private per-callback buffers, sealed before side-record construction. */
export interface CommandRecordBuffer {
  audit(record: CommandAuditInput): void;
  publish<T>(record: CommandOutboxInput<T>): void;
  seal(): void;
  rows(
    executionId: string,
  ): Readonly<{ audit: readonly StoredCommandAudit[]; outbox: readonly StoredCommandOutbox[] }>;
}

/** Throw the bounded codec/record-policy failure without including offending values. */
function rejected(cause?: unknown): never {
  throw new CommandError({ kind: 'codec_failure', retryable: false, phase: 'side_record' }, {
    cause,
  });
}

/** Snapshot, validate and buffer synchronous intent; build all rows before any flush. */
export function commandRecordBuffer<TInput>(
  metadata: Readonly<
    {
      name: string;
      definitionVersion: number;
      records: Readonly<{ audit: CommandRecordRequirement; outbox: CommandRecordRequirement }>;
    }
  >,
  envelope: CommandEnvelope<TInput>,
  limits: CommandRecordLimits,
  now: () => Date,
  newId: () => string,
): CommandRecordBuffer {
  const audit: AuditIntent[] = [];
  const outbox: OutboxIntent[] = [];
  let active = true;
  return {
    audit(record): void {
      if (
        !active || audit.length >= limits.auditRecords || metadata.records.audit === 'forbidden'
      ) rejected();
      try {
        if (
          !commandString(record.action) || !commandString(record.subject.type) ||
          !commandString(record.subject.id)
        ) rejected();
        audit.push(Object.freeze({
          action: record.action,
          subjectType: record.subject.type,
          subjectId: record.subject.id,
          ...(record.data === undefined
            ? {}
            : { dataJson: canonicalCommandJson(record.data, { bytes: limits.recordBytes }) }),
        }));
      } catch (cause) {
        rejected(cause);
      }
    },
    publish(record): void {
      if (
        !active || outbox.length >= limits.outboxRecords || metadata.records.outbox === 'forbidden'
      ) rejected();
      try {
        if (
          !commandString(record.destination) || !commandString(record.topic) ||
          (record.dedupeKey !== undefined && !commandString(record.dedupeKey))
        ) rejected();
        const time = record.availableAt?.getTime();
        if (time !== undefined && !Number.isFinite(time)) rejected();
        outbox.push(Object.freeze({
          destination: record.destination,
          topic: record.topic,
          payloadJson: canonicalCommandJson(record.codec.encode(record.payload), {
            bytes: limits.recordBytes,
          }),
          ...(record.dedupeKey === undefined ? {} : { dedupeKey: record.dedupeKey }),
          ...(time === undefined ? {} : { availableAt: time }),
        }));
      } catch (cause) {
        rejected(cause);
      }
    },
    seal(): void {
      active = false;
    },
    rows(
      executionId,
    ): Readonly<{ audit: readonly StoredCommandAudit[]; outbox: readonly StoredCommandOutbox[] }> {
      active = false;
      if (
        (metadata.records.audit === 'required' && audit.length === 0) ||
        (metadata.records.outbox === 'required' && outbox.length === 0)
      ) rejected();
      const common = {
        executionId,
        commandName: metadata.name,
        commandVersion: metadata.definitionVersion,
        correlationId: envelope.correlationId,
      };
      const audits = audit.map((record): StoredCommandAudit =>
        Object.freeze({
          ...common,
          id: newId(),
          ...record,
          actorKind: envelope.actor.kind,
          actorSubject: envelope.actor.subject,
          ...(envelope.actor.kind === 'principal' && envelope.actor.scheme !== undefined
            ? { actorScheme: envelope.actor.scheme }
            : {}),
          occurredAt: now(),
        })
      );
      const messages = outbox.map((record): StoredCommandOutbox => {
        const id = newId();
        return Object.freeze({
          ...common,
          id,
          destination: record.destination,
          topic: record.topic,
          payloadJson: record.payloadJson,
          dedupeKey: record.dedupeKey ?? id,
          availableAt: record.availableAt === undefined ? now() : new Date(record.availableAt),
          ...(envelope.trace === undefined ? {} : envelope.trace),
        });
      });
      try {
        let bytes = 0;
        for (const row of audits) {
          bytes += new TextEncoder().encode(
            canonicalCommandJson({ ...row, occurredAt: row.occurredAt.toISOString() }, {
              bytes: limits.recordBytes,
            }),
          ).length;
        }
        for (const row of messages) {
          bytes += new TextEncoder().encode(
            canonicalCommandJson({ ...row, availableAt: row.availableAt.toISOString() }, {
              bytes: limits.recordBytes,
            }),
          ).length;
        }
        if (bytes > limits.recordBytes) rejected();
      } catch (cause) {
        rejected(cause);
      }
      return Object.freeze({ audit: Object.freeze(audits), outbox: Object.freeze(messages) });
    },
  };
}
