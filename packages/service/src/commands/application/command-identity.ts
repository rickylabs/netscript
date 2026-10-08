import type { CommandDefinition } from '../domain/definition.ts';
import { CommandError } from '../domain/failure.ts';
import type { CommandActor, CommandEnvelope, CommandTraceContext } from '../domain/values.ts';
import { canonicalCommandJson, validatedCommandJson } from './canonical-json.ts';

/** Validated detached transport identity and exact semantic digests. */
export type CommandIdentity<TInput> = Readonly<{
  envelope: CommandEnvelope<TInput>;
  scope: string;
  requestHash: string;
  keyHash?: string;
}>;

/** Validate a bounded well-formed UTF-8 string before allocating digest or row material. */
export function commandString(value: unknown, maximum = 256, minimum = 1): value is string {
  return typeof value === 'string' && value.isWellFormed() && value.length <= maximum &&
    new TextEncoder().encode(value).length >= minimum &&
    new TextEncoder().encode(value).length <= maximum;
}

function invalid(
  reason: 'actor' | 'correlation' | 'idempotency_required' | 'trace_context',
): never {
  throw new CommandError({ kind: 'invalid_envelope', retryable: false, reason });
}

function httpFieldValue(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if ((code < 0x20 && code !== 0x09) || code === 0x7f) return false;
  }
  return true;
}

function traceContext(trace: CommandTraceContext): CommandTraceContext {
  if (!trace || typeof trace !== 'object') invalid('trace_context');
  const parent = trace.traceparent;
  if (
    typeof parent !== 'string' ||
    !commandString(parent, 512) ||
    !httpFieldValue(parent) ||
    !/^[0-9a-f]{2}-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}/.test(parent) ||
    parent.startsWith('ff-') || (parent.startsWith('00-') && parent.length !== 55) ||
    (parent.length > 55 && parent[55] !== '-') ||
    /^[0-9a-f]{2}-0{32}-/.test(parent) || /^[0-9a-f]{2}-[0-9a-f]{32}-0{16}-/.test(parent)
  ) invalid('trace_context');
  const state = trace.tracestate;
  if (state !== undefined) {
    if (!commandString(state, 512, 0) || !/^[\x20-\x7e\t]*$/.test(state)) invalid('trace_context');
    const members = state.split(',');
    const keys = new Set<string>();
    if (members.length > 32) invalid('trace_context');
    for (const member of members) {
      const text = member.trim();
      if (text.length === 0) continue;
      const separator = text.indexOf('=');
      const key = text.slice(0, separator);
      const value = text.slice(separator + 1);
      if (
        separator < 1 || key.length > 256 ||
        !/^(?:[a-z][a-z0-9_*/-]{0,255}|[a-z0-9][a-z0-9_*/-]{0,240}@[a-z][a-z0-9_*/-]{0,13})$/.test(
          key,
        ) || value.length < 1 || value.length > 256 ||
        !/^[\x20-\x2b\x2d-\x3c\x3e-\x7e]*[\x21-\x2b\x2d-\x3c\x3e-\x7e]$/.test(value) ||
        keys.has(key)
      ) invalid('trace_context');
      keys.add(key);
    }
  }
  return Object.freeze({
    traceparent: parent,
    ...(state === undefined ? {} : { tracestate: state }),
  });
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) {
      const child: unknown = descriptor.value;
      deepFreeze(child);
    }
  }
  Object.freeze(value);
}

/** Snapshot bounded I-JSON input while retaining its caller-declared generic type. */
export function frozenCommandInput<T>(input: T): T {
  validatedCommandJson(input);
  const copy = structuredClone(input);
  deepFreeze(copy);
  return copy;
}

/** SHA-256 UTF-8 digest; request material and raw key are never stored together. */
export async function commandDigest(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Validate and freeze before calling scope/fingerprint exactly once, outside the transaction. */
export async function commandIdentity<TName extends string, TInput, TOutput, TTx>(
  command: CommandDefinition<TName, TInput, TOutput, TTx>,
  input: CommandEnvelope<TInput>,
): Promise<CommandIdentity<TInput>> {
  if (!input || typeof input !== 'object') invalid('actor');
  const origin = input.actor;
  if (
    !origin || (origin.kind !== 'principal' && origin.kind !== 'system') ||
    !commandString(origin.subject) ||
    (origin.kind === 'principal' && origin.scheme !== undefined && !commandString(origin.scheme))
  ) invalid('actor');
  const actor: CommandActor = Object.freeze(
    origin.kind === 'principal'
      ? {
        kind: origin.kind,
        subject: origin.subject,
        ...(origin.scheme === undefined ? {} : { scheme: origin.scheme }),
      }
      : { kind: origin.kind, subject: origin.subject },
  );
  if (!commandString(input.correlationId)) invalid('correlation');
  if (input.expectedVersion !== undefined && !commandString(input.expectedVersion)) {
    invalid('correlation');
  }
  const key = input.idempotencyKey;
  if (
    (key === undefined && command.idempotency.mode === 'required') ||
    (key !== undefined && !commandString(key, 256, 16))
  ) invalid('idempotency_required');
  const trace = input.trace === undefined ? undefined : traceContext(input.trace);
  try {
    const envelope: CommandEnvelope<TInput> = Object.freeze({
      input: frozenCommandInput(input.input),
      actor,
      correlationId: input.correlationId,
      ...(key === undefined ? {} : { idempotencyKey: key }),
      ...(input.expectedVersion === undefined ? {} : { expectedVersion: input.expectedVersion }),
      ...(trace === undefined ? {} : { trace }),
    });
    const scope = command.idempotency.scope(Object.freeze({ input: envelope.input, actor }));
    if (!commandString(scope)) throw new TypeError('[netscript.command.identity] invalid scope');
    const selected = command.idempotency.fingerprint(envelope.input);
    const request = canonicalCommandJson({
      command: command.name,
      definitionVersion: command.definitionVersion,
      scope,
      input: selected,
      actor: { kind: actor.kind, subject: actor.subject },
      expectedVersion: envelope.expectedVersion ?? null,
    });
    return Object.freeze({
      envelope,
      scope,
      requestHash: await commandDigest(request),
      ...(key === undefined ? {} : { keyHash: await commandDigest(key) }),
    });
  } catch (cause) {
    throw new CommandError({ kind: 'codec_failure', retryable: false, phase: 'fingerprint' }, {
      cause,
    });
  }
}
