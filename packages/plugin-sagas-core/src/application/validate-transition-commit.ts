import {
  canonicalCommandJson,
  jsonCodec,
  parseCanonicalCommandJson,
} from '@netscript/service/commands';
import type { SagaTransitionCommitRequest } from '../ports/saga-transition-commit-port.ts';

const stateCodec = jsonCodec<unknown>({
  '~standard': { version: 1, vendor: 'netscript', validate: (value) => ({ value }) },
});

/** Snapshot and reject inconsistent local rows before any atomic adapter mutation. */
export function snapshotTransitionCommit(
  request: SagaTransitionCommitRequest,
): SagaTransitionCommitRequest {
  const copy = structuredClone(request);
  const { envelope, correlation, record, expectedVersion, commands, appliedKeyHash } = copy;
  if (
    !Number.isSafeInteger(expectedVersion) || expectedVersion < 0 ||
    envelope.metadata.version !== expectedVersion + 1 ||
    record.version !== envelope.metadata.version ||
    correlation.instanceId !== envelope.metadata.instanceId ||
    !Number.isFinite(envelope.metadata.createdAt.getTime()) ||
    !Number.isFinite(envelope.metadata.updatedAt.getTime()) ||
    !Number.isFinite(record.transition.occurredAt.getTime()) ||
    (appliedKeyHash !== undefined && !/^[a-f0-9]{64}$/.test(appliedKeyHash)) ||
    commands.length > 256
  ) throw new TypeError('Inconsistent atomic saga transition request.');
  const nextState = canonicalCommandJson(stateCodec.encode(envelope.state));
  if (nextState !== canonicalCommandJson(stateCodec.encode(record.transition.to))) {
    throw new TypeError('Atomic saga history must describe the committed state.');
  }
  stateCodec.encode(record.transition.from);
  for (
    const identifier of [correlation.sagaId, correlation.correlationKey, correlation.instanceId]
  ) {
    if (
      typeof identifier !== 'string' || !identifier.trim() || !identifier.isWellFormed() ||
      new TextEncoder().encode(identifier).length > 200
    ) {
      throw new TypeError('Atomic saga transition identifiers must be bounded.');
    }
  }
  if (new TextEncoder().encode(correlation.sagaId).length > 100) {
    throw new TypeError('Atomic saga definition id exceeds the shipped schema bound.');
  }
  const ids = new Set<string>();
  let bytes = 0;
  for (const command of commands) {
    bytes += new TextEncoder().encode(command.payloadJson).length;
    if (
      ids.has(command.id) || !command.id || !Number.isFinite(command.availableAt.getTime()) ||
      bytes > 1_048_576 || !Number.isSafeInteger(command.commandVersion) ||
      command.commandVersion < 1
    ) {
      throw new TypeError('Invalid or duplicate atomic saga command intent.');
    }
    for (
      const identifier of [
        command.id,
        command.executionId,
        command.commandName,
        command.destination,
        command.topic,
        command.dedupeKey,
        command.correlationId,
      ]
    ) {
      if (
        typeof identifier !== 'string' || !identifier.trim() || !identifier.isWellFormed() ||
        new TextEncoder().encode(identifier).length > 200
      ) {
        throw new TypeError('Atomic saga command identifiers must be bounded.');
      }
    }
    ids.add(command.id);
    parseCanonicalCommandJson(command.payloadJson);
  }
  return copy;
}
