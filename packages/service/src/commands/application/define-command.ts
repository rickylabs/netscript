import { commandDefinitionBinding, commandExecutorCapability } from '../domain/definition.ts';
import type {
  CommandContext,
  CommandDefinition,
  CommandDefinitionSpec,
  CommandIdempotencyMode,
  CommandRecordRequirement,
} from '../domain/definition.ts';

const COMMAND_NAME = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const IDEMPOTENCY_MODES: readonly CommandIdempotencyMode[] = ['required', 'optional'];
const RECORD_REQUIREMENTS: readonly CommandRecordRequirement[] = [
  'required',
  'optional',
  'forbidden',
];
const ISOLATION_LEVELS = [
  'ReadUncommitted',
  'ReadCommitted',
  'RepeatableRead',
  'Serializable',
  'Snapshot',
];

/**
 * Validate a specification and freeze an opaque definition without executing its handler.
 *
 * @example
 * ```ts
 * import { defineCommand, jsonCodec } from '@netscript/service/commands';
 * import { z } from 'zod';
 * const command = defineCommand({
 *   name: 'items.update', definitionVersion: 1,
 *   idempotency: {
 *     scope: () => 'items', fingerprint: (input: { id: string }) => input,
 *     response: jsonCodec(z.object({ updated: z.boolean() })),
 *   },
 *   records: { audit: 'optional', outbox: 'forbidden' },
 *   handle: async () => ({ updated: true }),
 * });
 * ```
 */
export function defineCommand<TName extends string, TInput, TOutput, TTx>(
  specification: CommandDefinitionSpec<TName, TInput, TOutput, TTx>,
): CommandDefinition<TName, TInput, TOutput, TTx> {
  if (
    typeof specification.name !== 'string' || specification.name.length > 120 ||
    !COMMAND_NAME.test(specification.name) ||
    !Number.isSafeInteger(specification.definitionVersion) ||
    specification.definitionVersion < 1
  ) {
    throw new TypeError('[netscript.command.definition] invalid durable name or version');
  }
  const mode = specification.idempotency.mode ?? 'required';
  if (
    !IDEMPOTENCY_MODES.includes(mode) ||
    !RECORD_REQUIREMENTS.includes(specification.records.audit) ||
    !RECORD_REQUIREMENTS.includes(specification.records.outbox) ||
    (specification.isolationLevel !== undefined &&
      !ISOLATION_LEVELS.includes(specification.isolationLevel)) ||
    typeof specification.handle !== 'function' ||
    typeof specification.idempotency.scope !== 'function' ||
    typeof specification.idempotency.fingerprint !== 'function' ||
    typeof specification.idempotency.response.encode !== 'function' ||
    typeof specification.idempotency.response.decode !== 'function'
  ) {
    throw new TypeError('[netscript.command.definition] invalid command policy or callback');
  }
  // A typed map per definition preserves handler generics without heterogeneous-map assertions.
  const handlers = new WeakMap<
    CommandDefinition<TName, TInput, TOutput, TTx>,
    (context: CommandContext<TInput, TTx>) => Promise<TOutput>
  >();
  const definition: CommandDefinition<TName, TInput, TOutput, TTx> = Object.freeze({
    name: specification.name,
    definitionVersion: specification.definitionVersion,
    ...(specification.isolationLevel === undefined
      ? {}
      : { isolationLevel: specification.isolationLevel }),
    idempotency: Object.freeze({
      mode,
      scope: specification.idempotency.scope,
      fingerprint: specification.idempotency.fingerprint,
      response: Object.freeze({
        encode: specification.idempotency.response.encode.bind(specification.idempotency.response),
        decode: specification.idempotency.response.decode.bind(specification.idempotency.response),
      }),
    }),
    records: Object.freeze({
      audit: specification.records.audit,
      outbox: specification.records.outbox,
    }),
    [commandDefinitionBinding]: (
      capability: typeof commandExecutorCapability,
      original: CommandDefinition<TName, TInput, TOutput, TTx>,
    ) => {
      if (capability !== commandExecutorCapability) {
        throw new TypeError(
          '[netscript.command.definition] foreign binding capability',
        );
      }
      const handler = handlers.get(original);
      if (handler === undefined) {
        throw new TypeError('[netscript.command.definition] foreign definition');
      }
      return handler;
    },
  });
  handlers.set(definition, specification.handle);
  return definition;
}

/** Resolve a genuine definition's handler for the internal executor only. */
export function commandHandler<TName extends string, TInput, TOutput, TTx>(
  definition: CommandDefinition<TName, TInput, TOutput, TTx>,
): (context: CommandContext<TInput, TTx>) => Promise<TOutput> {
  return definition[commandDefinitionBinding](commandExecutorCapability, definition);
}
