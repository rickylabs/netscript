import type {
  ClaimedCommandOutboxRow,
  CommandOutboxAcceptance,
} from '@netscript/database/commands';
import { commandString, commandTraceContext } from '../application/command-identity.ts';
import { parseCanonicalCommandJson } from '../application/canonical-json.ts';
import type { CommandOutboxDelivery } from './relay-ports.ts';
import { CommandRelayError } from './command-relay-error.ts';

/** Decode and snapshot raw persisted values before touching a sink. */
export function relayDelivery(row: ClaimedCommandOutboxRow): CommandOutboxDelivery {
  try {
    for (
      const value of [
        row.id,
        row.executionId,
        row.destination,
        row.topic,
        row.dedupeKey,
        row.correlationId,
      ]
    ) {
      if (!commandString(value)) throw new CommandRelayError('misconfigured');
    }
    if (
      !commandString(row.commandName, 128) || !Number.isSafeInteger(row.commandVersion) ||
      row.commandVersion < 1
    ) {
      throw new CommandRelayError('misconfigured');
    }
    if (row.traceparent === undefined && row.tracestate !== undefined) {
      throw new CommandRelayError('misconfigured');
    }
    const payload = parseCanonicalCommandJson(row.payloadJson);
    const trace = row.traceparent === undefined ? undefined : commandTraceContext({
      traceparent: row.traceparent,
      ...(row.tracestate === undefined ? {} : { tracestate: row.tracestate }),
    });
    return Object.freeze({
      id: row.id,
      destination: row.destination,
      topic: row.topic,
      payload,
      dedupeKey: row.dedupeKey,
      correlationId: row.correlationId,
      ...(trace === undefined ? {} : { trace }),
    });
  } catch {
    throw new CommandRelayError('misconfigured');
  }
}
/** Normalize only checked identity/time; discard raw transport response fields. */
export function relayAcceptance(
  value: void | CommandOutboxAcceptance,
): CommandOutboxAcceptance | undefined {
  if (value === undefined) return undefined;
  if (
    !value || !commandString(value.identity) || !value.identity.trim() ||
    !(value.acceptedAt instanceof Date) || !Number.isFinite(value.acceptedAt.getTime())
  ) {
    throw new CommandRelayError('invalid_response');
  }
  return Object.freeze({
    identity: value.identity,
    acceptedAt: new Date(value.acceptedAt.getTime()),
  });
}
