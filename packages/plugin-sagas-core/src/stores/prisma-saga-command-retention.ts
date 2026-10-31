import { z } from 'zod';
import {
  COMMAND_RETENTION_DEFAULT_DAYS,
  COMMAND_RETENTION_MAX_PAGE_SIZE,
  type CommandOutboxRetentionResult,
  createPostgresCommandOutboxRelayStore,
  type PostgresCommandClient,
  type TransactionClientPort,
} from '@netscript/database/commands/postgres';

/** Terminal policy: per-definition overrides follow saga group retention.completedDays. */
export type PrismaSagaCommandRetentionOptions = Readonly<{
  /** Physical transaction deadline, from 1 to 60000 milliseconds. */
  transactionTimeoutMs: number;
  /** Window for unlisted saga definitions, default seven days. */
  completedRetentionDays?: number;
  /** Per-saga overrides, copied at construction. */
  completedRetentionDaysBySaga?: Readonly<Record<string, number>>;
  /** Shared outbox window, default the largest configured saga window. */
  outboxRetentionDays?: number;
}>;

/** Resume both primary-key scans; persist this between background job invocations. */
export type SagaCommandRetentionCursor = Readonly<{
  /** Applied-key composite primary key. */
  appliedKey?: Readonly<{ instanceId: string; keyHash: string }>;
  /** Outbox primary key. */
  outboxId?: string;
  /** Completed families are skipped until the overall sweep completes. */
  appliedKeysDone?: boolean;
  /** Completed families are skipped until the overall sweep completes. */
  outboxDone?: boolean;
}>;

/** Per-family counts and a resumable cursor; absence ends the current sweep. */
export type SagaCommandRetentionResult = Readonly<{
  /** Examined and actually deleted replay markers. */
  appliedKeys: Readonly<{ scanned: number; deleted: number }>;
  /** Examined and actually deleted outbox messages. */
  outbox: CommandOutboxRetentionResult;
  /** Carry to the next call; omit on the next scheduled sweep after completion. */
  nextCursor?: SagaCommandRetentionCursor;
}>;

/** First-party bounded cleanup; canonical saga state must outlive this replay sweep. */
export interface PrismaSagaCommandRetention {
  /** Examine/delete at most limit records per family, including retained records in the bound. */
  prune(
    request: Readonly<{ now: Date; limit: number; cursor?: SagaCommandRetentionCursor }>,
    signal?: AbortSignal,
  ): Promise<SagaCommandRetentionResult>;
}

type Parent = {
  instanceId: string;
  sagaId: string;
  version: number;
  envelope: unknown;
  envelopeText: string;
};
type Marker = Parent & { keyHash: string };
const metadataSchema = z.object({
  metadata: z.object({
    status: z.enum([
      'pending',
      'running',
      'compensating',
      'completed',
      'failed',
      'cancelled',
      'compensated',
    ]),
    completedAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime(),
  }),
});
const TERMINAL = new Set(['completed', 'failed', 'cancelled', 'compensated']);
function days(value: number): number {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(value * 86_400_000)) {
    throw new RangeError('Saga completed retention days must be positive and finite.');
  }
  return value;
}

/**
 * Compose bounded PostgreSQL outbox and atomic replay retention using terminal saga metadata.
 * No resources or DDL are created. Invalid/missing state is retained. Cancellation checkpoints
 * roll back replay cleanup; outbox and replay pages commit independently and are safe to retry.
 *
 * @example
 * ```ts
 * import { createPrismaSagaCommandRetention, type SagaCommandRetentionCursor } from '@netscript/plugin-sagas-core/stores';
 * import type { PostgresCommandClient, TransactionClientPort } from '@netscript/database/commands/postgres';
 * declare const client: TransactionClientPort<PostgresCommandClient>;
 * const retention = createPrismaSagaCommandRetention(client, { transactionTimeoutMs: 5000 });
 * let cursor: SagaCommandRetentionCursor | undefined;
 * const result = await retention.prune({ now: new Date(), limit: 50, cursor });
 * cursor = result.nextCursor; // persist for the next invocation; absence completes the sweep
 * ```
 */
export function createPrismaSagaCommandRetention<TTx extends PostgresCommandClient>(
  root: TransactionClientPort<TTx>,
  options: PrismaSagaCommandRetentionOptions,
): PrismaSagaCommandRetention {
  const timeout = options.transactionTimeoutMs;
  const defaultDays = days(options.completedRetentionDays ?? COMMAND_RETENTION_DEFAULT_DAYS);
  const policies = new Map(
    Object.entries(options.completedRetentionDaysBySaga ?? {}).map(
      ([id, value]) => [id, days(value)],
    ),
  );
  const outboxDays = days(
    options.outboxRetentionDays ??
      Array.from(policies.values()).reduce(
        (maximum, value) => Math.max(maximum, value),
        defaultDays,
      ),
  );
  const relay = createPostgresCommandOutboxRelayStore(root, options);
  function expired(parent: Parent, now: number): boolean {
    const parsed = metadataSchema.safeParse(parent.envelope);
    if (!parsed.success || !TERMINAL.has(parsed.data.metadata.status)) return false;
    const metadata = parsed.data.metadata;
    const completed = Date.parse(metadata.completedAt ?? metadata.updatedAt);
    return completed + (policies.get(parent.sagaId) ?? defaultDays) * 86_400_000 < now;
  }
  return Object.freeze<PrismaSagaCommandRetention>({
    async prune({ now, limit, cursor }, signal) {
      if (
        !(now instanceof Date) || !Number.isFinite(now.getTime()) ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > COMMAND_RETENTION_MAX_PAGE_SIZE
      ) {
        throw new RangeError('Saga retention requires a valid instant and a page of 1..100.');
      }
      const at = new Date(now.getTime());
      const start = cursor?.appliedKey;
      if (
        start && (typeof start.instanceId !== 'string' || !start.instanceId ||
          start.instanceId.length > 200 || !/^[0-9a-f]{64}$/.test(start.keyHash))
      ) {
        throw new TypeError('Saga retention requires a bounded composite cursor.');
      }
      signal?.throwIfAborted();
      const outbox = cursor?.outboxDone ? { scanned: 0, deleted: 0 } : await relay.pruneSettled({
        now: at,
        limit,
        completedRetentionDays: outboxDays,
        afterId: cursor?.outboxId,
      }, signal);
      let page: Marker[] = [];
      let deleted = 0;
      if (!cursor?.appliedKeysDone) {
        let entered = false;
        deleted = await root.$transaction(async (tx) => {
          if (entered) throw new TypeError('Saga retention callback reentry refused.');
          entered = true;
          for (
            const key of ['$transaction', '$connect', '$disconnect', '$on', '$use', '$extends']
          ) {
            if (typeof Reflect.get(tx, key) === 'function') {
              throw new TypeError('Root client refused.');
            }
          }
          signal?.throwIfAborted();
          page = await tx.$queryRawUnsafe<Marker[]>(
            `SELECT k.instance_id AS "instanceId", k.key_hash AS "keyHash",
 s.saga_id AS "sagaId", s.version, s.envelope, s.envelope::text AS "envelopeText"
FROM (SELECT instance_id, key_hash FROM saga_runtime_command_applied_key
 WHERE (instance_id, key_hash) > ($1, $2) ORDER BY instance_id, key_hash LIMIT $3) k
LEFT JOIN saga_runtime_state s ON s.instance_id=k.instance_id
ORDER BY k.instance_id, k.key_hash`,
            start?.instanceId ?? '',
            start?.keyHash ?? '',
            limit,
          );
          const candidates = page.filter((row) => expired(row, at.getTime()));
          signal?.throwIfAborted();
          if (!candidates.length) return 0;
          // Lock only the bounded candidate parents, then validate their fresh metadata.
          const parents = await tx.$queryRawUnsafe<Parent[]>(
            `SELECT instance_id AS "instanceId", saga_id AS "sagaId", version, envelope, envelope::text AS "envelopeText"
FROM saga_runtime_state WHERE instance_id = ANY($1::text[])
ORDER BY instance_id FOR UPDATE SKIP LOCKED`,
            [...new Set(candidates.map((row) => row.instanceId))],
          );
          const fresh = new Map(
            parents.filter((row) => expired(row, at.getTime())).map((row) => [row.instanceId, row]),
          );
          const eligible = candidates.flatMap((key) => {
            const parent = fresh.get(key.instanceId);
            return parent && parent.version === key.version
              ? [{
                instanceId: key.instanceId,
                keyHash: key.keyHash,
                version: key.version,
                envelopeText: parent.envelopeText,
              }]
              : [];
          });
          signal?.throwIfAborted();
          const count = eligible.length
            ? await tx.$executeRawUnsafe(
              `DELETE FROM saga_runtime_command_applied_key k
USING jsonb_to_recordset($1::jsonb) AS selected("instanceId" text, "keyHash" text, version int, "envelopeText" text), saga_runtime_state s
WHERE k.instance_id=selected."instanceId" AND k.key_hash=selected."keyHash"
 AND s.instance_id=k.instance_id AND s.version=selected.version AND s.envelope::text=selected."envelopeText"`,
              JSON.stringify(eligible),
            )
            : 0;
          signal?.throwIfAborted();
          return count;
        }, { timeout, isolationLevel: 'ReadCommitted' });
      }
      const appliedKeysDone = !!cursor?.appliedKeysDone || page.length < limit;
      const outboxDone = !!cursor?.outboxDone || outbox.nextAfterId === undefined;
      const last = page.at(-1);
      return Object.freeze({
        appliedKeys: Object.freeze({ scanned: page.length, deleted }),
        outbox,
        ...(!appliedKeysDone || !outboxDone
          ? {
            nextCursor: Object.freeze({
              appliedKeysDone,
              outboxDone,
              ...(last
                ? { appliedKey: { instanceId: last.instanceId, keyHash: last.keyHash } }
                : {}),
              ...(outbox.nextAfterId ? { outboxId: outbox.nextAfterId } : {}),
            }),
          }
          : {}),
      });
    },
  });
}
