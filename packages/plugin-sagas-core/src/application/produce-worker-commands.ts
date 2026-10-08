import type { StoredCommandOutbox } from '@netscript/database/commands';
import { canonicalCommandJson, validateCommandTraceContext } from '@netscript/service/commands';
import { encodeWorkerEffect } from '../integration/workers/worker-effects.ts';
import {
  CASCADED_MESSAGE_KINDS,
  type CascadedMessage,
  type SagaTransitionEffect,
} from '../domain/mod.ts';

/** Pure versioned identity over canonical tuple material, independent of clock/attempt/restart. */
export async function sagaCommandDigest(value: readonly (string | number)[]): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalCommandJson(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Reject worker effects hidden inside legacy scheduling/compensation ledgers. */
export function assertLegacyCascade(value: CascadedMessage, depth = 0): void {
  if (
    !value || typeof value !== 'object' || depth > 64 ||
    !CASCADED_MESSAGE_KINDS.includes(value.kind)
  ) {
    throw new TypeError('Worker commands require an explicit top-level durable transition effect.');
  }
  if ((value.kind === 'scheduled' || value.kind === 'compensate') && 'kind' in value.message) {
    assertLegacyCascade(value.message as CascadedMessage, depth + 1);
  }
}

/** Adapt a pure ledger into C5 raw intents; no claim, lease, retry, queue or settlement behavior. */
export async function produceWorkerCommands(
  effects: readonly SagaTransitionEffect[],
  input: Readonly<{
    durable: boolean;
    sagaId: string;
    instanceId: string;
    version: number;
    correlationId: string;
    now: Date;
    traceparent?: string;
    tracestate?: string;
  }>,
): Promise<
  Readonly<{ cascaded: readonly CascadedMessage[]; commands: readonly StoredCommandOutbox[] }>
> {
  if (!Array.isArray(effects) || (input.durable && effects.length > 256)) {
    throw new TypeError('Invalid bounded synchronous saga effect ledger.');
  }
  const cascaded: CascadedMessage[] = [];
  const commands: StoredCommandOutbox[] = [];
  const trace = !input.durable || input.traceparent === undefined
    ? undefined
    : validateCommandTraceContext({
      traceparent: input.traceparent,
      ...(input.tracestate === undefined ? {} : { tracestate: input.tracestate }),
    });
  if (input.durable && input.tracestate !== undefined && trace === undefined) {
    throw new TypeError('Saga command tracestate requires traceparent.');
  }
  for (const [ordinal, effect] of effects.entries()) {
    if (effect.kind !== 'worker-job' && effect.kind !== 'worker-task') {
      assertLegacyCascade(effect);
      cascaded.push(effect);
      continue;
    }
    if (!input.durable) {
      throw new TypeError('Worker commands require durableWorkerCommands() opt-in.');
    }
    const payloadJson = await encodeWorkerEffect(effect);
    const id = `sgwc-v1:${await sagaCommandDigest([
      input.sagaId,
      input.instanceId,
      input.version,
      ordinal,
    ])}`;
    commands.push(Object.freeze({
      id,
      executionId: `sgtx-v1:${await sagaCommandDigest([
        input.sagaId,
        input.instanceId,
        input.version,
      ])}`,
      commandName: `saga.${effect.kind}:${effect.targetId}`,
      commandVersion: 1,
      destination: effect.destination,
      topic: effect.topic,
      payloadJson,
      dedupeKey: id,
      correlationId: input.correlationId,
      ...(trace ?? {}),
      availableAt: new Date(input.now.getTime()),
    }));
  }
  return Object.freeze({ cascaded: Object.freeze(cascaded), commands: Object.freeze(commands) });
}
