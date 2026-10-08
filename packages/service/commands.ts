/**
 * Opaque command definitions, redacted failures and synchronous bounded canonical codecs.
 *
 * Defining or encoding a command performs no transaction or transport work. This subpath
 * requires no permissions. Actor roles/claims stay outside durable envelopes.
 *
 * @example
 * ```ts
 * import { canonicalCommandJson, jsonCodec } from '@netscript/service/commands';
 * import { z } from 'zod';
 * const codec = jsonCodec(z.object({ updated: z.boolean() }));
 * canonicalCommandJson(codec.encode({ updated: true }));
 * ```
 *
 * @module
 */
export { defineCommand } from './src/commands/application/define-command.ts';
export { jsonCodec } from './src/commands/application/json-codec.ts';
export {
  canonicalCommandJson,
  parseCanonicalCommandJson,
} from './src/commands/application/canonical-json.ts';
export type { CommandCodec, CommandJsonLimits } from './src/commands/domain/codec.ts';
export type {
  CommandActor,
  CommandEnvelope,
  CommandJson,
  CommandTraceContext,
} from './src/commands/domain/values.ts';
export type {
  CommandAuditInput,
  CommandContext,
  CommandDefinition,
  commandDefinitionBinding,
  CommandDefinitionSpec,
  commandExecutorCapability,
  CommandIdempotency,
  CommandIdempotencyMode,
  CommandIdempotencySpec,
  CommandOutboxInput,
  CommandRecordRequirement,
} from './src/commands/domain/definition.ts';
export { CommandError, type CommandFailure } from './src/commands/domain/failure.ts';
export type { IsolationLevel } from '@netscript/database';
