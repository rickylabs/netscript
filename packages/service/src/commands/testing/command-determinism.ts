import { commandIdentity } from '../application/command-identity.ts';
import type { CommandDefinition } from '../domain/definition.ts';
import type { CommandEnvelope } from '../domain/values.ts';

/** Bounded sample result; equality is evidence for these invocations, not a purity proof. */
export type CommandDeterminismReport = Readonly<{
  samples: number;
  scope: string;
  requestHash: string;
  assurance: 'sampled_equivalence';
}>;

/**
 * Compare 2–32 evaluations of actual identity logic over equivalent detached frozen inputs.
 * Scope and fingerprint execute once per sample. Changing closure state is detected when it
 * changes a sampled identity; unsampled time/random/global dependencies remain an author duty.
 * No handler, transaction or transport is invoked.
 *
 * @example
 * ```ts
 * import { assertCommandDeterminism } from '@netscript/service/commands/testing';
 * import type { CommandDefinition, CommandEnvelope } from '@netscript/service/commands';
 * declare const command: CommandDefinition<'sample.update', { value: string }, string, object>;
 * declare const envelope: CommandEnvelope<{ value: string }>;
 * await assertCommandDeterminism(command, envelope, 4);
 * ```
 */
export async function assertCommandDeterminism<TName extends string, TInput, TOutput, TTx>(
  command: CommandDefinition<TName, TInput, TOutput, TTx>,
  envelope: CommandEnvelope<TInput>,
  samples = 4,
): Promise<CommandDeterminismReport> {
  if (!Number.isSafeInteger(samples) || samples < 2 || samples > 32) {
    throw new TypeError('[netscript.command.testing] invalid determinism sample count');
  }
  const first = await commandIdentity(command, envelope);
  for (let index = 1; index < samples; index++) {
    const next = await commandIdentity(command, first.envelope);
    if (first.scope !== next.scope || first.requestHash !== next.requestHash) {
      throw new Error('[netscript.command.testing] sampled identity is nondeterministic');
    }
  }
  return Object.freeze({
    samples,
    scope: first.scope,
    requestHash: first.requestHash,
    assurance: 'sampled_equivalence',
  });
}
