/** Fixed command span names from RFC 0003. */
export const CommandSpanNames = {
  EXECUTE: 'command.execute',
  OUTBOX_RELAY: 'command.outbox.relay',
  OUTBOX_PUBLISH: 'command.outbox.publish',
} as const;

/** Identifier-free command attribute keys. */
export const CommandAttributes = {
  NAME: 'netscript.command.name',
  DEFINITION_VERSION: 'netscript.command.definition.version',
  OUTCOME: 'netscript.command.outcome',
  IDEMPOTENCY: 'netscript.command.idempotency',
  ISOLATION: 'netscript.command.isolation',
  STORE_PROVIDER: 'netscript.command.store.provider',
  AUDIT_COUNT: 'netscript.command.audit.count',
  OUTBOX_COUNT: 'netscript.command.outbox.count',
} as const;

/** Closed command completion outcomes. */
export const CommandOutcomes = [
  'applied',
  'replayed',
  'conflict',
  'rejected',
  'failed',
  'cancelled',
] as const;
/** Closed command idempotency states. */
export const CommandIdempotencyStates = [
  'claimed',
  'replayed',
  'not_requested',
  'missing',
  'mismatch',
  'busy',
] as const;
/** Closed requested isolation levels; default delegates to the store. */
export const CommandIsolationLevels = [
  'default',
  'ReadUncommitted',
  'ReadCommitted',
  'RepeatableRead',
  'Serializable',
  'Snapshot',
] as const;
/** Database-owned bounded provider IDs, copied without an implementation dependency. */
export const CommandStoreProviders = ['postgres', 'mssql', 'mysql', 'sqlite'] as const;
/** Stable command failures; never driver messages or stack text. */
export const CommandErrorTypes = [
  'invalid_envelope',
  'unsupported_capability',
  'codec_failure',
  'idempotency_key_reuse',
  'in_progress',
  'optimistic_conflict',
  'receipt_corrupt',
  'store_failure',
  'aborted',
] as const;

/** Configured static definition identity; actual command definitions fit structurally. */
export type CommandTelemetryDefinition = Readonly<{ name: string; definitionVersion: number }>;
/** Finite initial observation, structurally matching the executor port. */
export type OtelCommandTelemetryStart =
  & CommandTelemetryDefinition
  & Readonly<{
    isolation: typeof CommandIsolationLevels[number];
    provider: typeof CommandStoreProviders[number];
    idempotency: 'claimed' | 'not_requested';
  }>;
/** Finite completion observation, structurally matching the executor port. */
export type OtelCommandTelemetryResult = Readonly<{
  outcome: typeof CommandOutcomes[number];
  idempotency: typeof CommandIdempotencyStates[number];
  auditCount: number;
  outboxCount: number;
  errorType?: typeof CommandErrorTypes[number];
}>;

/** Build validated start attributes; registered definitions bound name/version cardinality.
 * @param start Finite observation with no envelope values.
 * @param definitions Static configured definition metadata.
 * @returns Explicitly selected command attributes.
 * @example
 * ```ts
 * commandStartAttributes({ name: 'values.update', definitionVersion: 1,
 *   isolation: 'default', provider: 'postgres', idempotency: 'claimed' },
 *   [{ name: 'values.update', definitionVersion: 1 }]);
 * ```
 */
export function commandStartAttributes(
  start: OtelCommandTelemetryStart,
  definitions: readonly CommandTelemetryDefinition[],
): Record<string, string | number> {
  if (
    !definitions.some((d) =>
      d.name === start.name && d.definitionVersion === start.definitionVersion
    ) ||
    (typeof start.name !== 'string' || start.name.length > 120 ||
      !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(start.name)) ||
    !Number.isSafeInteger(start.definitionVersion) || start.definitionVersion < 1 ||
    !member(CommandIsolationLevels, start.isolation) ||
    !member(CommandStoreProviders, start.provider) ||
    !member(['claimed', 'not_requested'], start.idempotency)
  ) invalid();
  return {
    [CommandAttributes.NAME]: start.name,
    [CommandAttributes.DEFINITION_VERSION]: start.definitionVersion,
    [CommandAttributes.ISOLATION]: start.isolation,
    [CommandAttributes.STORE_PROVIDER]: start.provider,
    [CommandAttributes.IDEMPOTENCY]: start.idempotency,
  };
}

/** Build validated completion attributes; counts appear only on applied/replayed outcomes.
 * @param result Finite completion observation.
 * @returns Explicitly selected attributes, with stable error.type when present.
 * @example
 * ```ts
 * commandResultAttributes({ outcome: 'applied', idempotency: 'claimed', auditCount: 0, outboxCount: 1 });
 * ```
 */
export function commandResultAttributes(
  result: OtelCommandTelemetryResult,
): Record<string, string | number> {
  if (
    !member(CommandOutcomes, result.outcome) ||
    !member(CommandIdempotencyStates, result.idempotency) ||
    (result.errorType !== undefined && !member(CommandErrorTypes, result.errorType)) ||
    !count(result.auditCount) || !count(result.outboxCount)
  ) invalid();
  return {
    [CommandAttributes.OUTCOME]: result.outcome,
    [CommandAttributes.IDEMPOTENCY]: result.idempotency,
    ...(result.outcome === 'applied' || result.outcome === 'replayed'
      ? {
        [CommandAttributes.AUDIT_COUNT]: result.auditCount,
        [CommandAttributes.OUTBOX_COUNT]: result.outboxCount,
      }
      : {}),
    ...(result.errorType === undefined ? {} : { 'error.type': result.errorType }),
  };
}

function member(values: readonly string[], value: unknown): boolean {
  return typeof value === 'string' && values.includes(value);
}
function count(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= 64;
}
function invalid(): never {
  throw new TypeError('[netscript.command.telemetry] invalid observation');
}
