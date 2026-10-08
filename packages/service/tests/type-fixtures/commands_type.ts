import {
  type CommandActor,
  type CommandDefinition,
  type commandDefinitionBinding,
  type CommandEnvelope,
  type CommandFailure,
  defineCommand,
  jsonCodec,
} from '@netscript/service/commands';
import { z } from 'zod';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
type Assert<T extends true> = T;
type Input = Readonly<{ id: string }>;
type Output = Readonly<{ updated: boolean }>;
type Tx = Readonly<{ save(id: string): Promise<number> }>;

const definition = defineCommand<'items.update', Input, Output, Tx>({
  name: 'items.update',
  definitionVersion: 1,
  idempotency: {
    scope: ({ input }) => input.id,
    fingerprint: (input) => ({ id: input.id }),
    response: jsonCodec(z.object({ updated: z.boolean() })),
  },
  records: { audit: 'required', outbox: 'optional' },
  handle: async ({ tx, envelope }) => ({ updated: await tx.save(envelope.input.id) > 0 }),
});
type _LiteralName = Assert<Equal<typeof definition.name, 'items.update'>>;
type _ExactInput = Assert<Equal<Parameters<typeof definition.idempotency.fingerprint>[0], Input>>;
type _ExactOutput = Assert<
  Equal<ReturnType<typeof definition.idempotency.response.decode>, Output>
>;

function proveOpaqueDefinition(): void {
  // @ts-expect-error TS2339: no public handler is available on an opaque definition.
  void definition.handle;
  // @ts-expect-error TS2540: durable names are immutable.
  definition.name = 'items.update';
  // @ts-expect-error TS2540: nested replay policy is immutable.
  definition.idempotency.mode = 'optional';
  // @ts-expect-error TS2345: a selected definition binds its semantic input.
  definition.idempotency.fingerprint({ id: 1 });
  // @ts-expect-error TS2322: the handler binding keeps a definition invariant in input.
  const widened: CommandDefinition<'items.update', { id: string | number }, Output, Tx> =
    definition;
  // @ts-expect-error TS2741: public fields alone cannot manufacture an opaque definition.
  const forged: CommandDefinition<'items.update', Input, Output, Tx> = {
    name: definition.name,
    definitionVersion: 1,
    idempotency: definition.idempotency,
    records: definition.records,
  };
  declareBindingInvocation();
  void widened;
  void forged;
}

declare const binding: typeof commandDefinitionBinding;
function declareBindingInvocation(): void {
  // @ts-expect-error TS2345: a caller cannot supply the private executor capability token.
  definition[binding](Symbol('caller'), definition);
}
const actor: CommandActor = { kind: 'principal', subject: 'actor', scheme: 'session' };
const envelope: CommandEnvelope<Input> = {
  input: { id: 'item' },
  actor,
  correlationId: 'correlation',
  expectedVersion: '1',
};
// @ts-expect-error TS2322: version tokens are normalized to strings.
const invalidVersion: CommandEnvelope<Input> = { ...envelope, expectedVersion: 1 };
// @ts-expect-error TS2353: system actors cannot carry credential scheme.
const invalidActor: CommandActor = { kind: 'system', subject: 'background', scheme: 'session' };
// @ts-expect-error TS2322: retryability narrows with the failure kind.
const invalidFailure: CommandFailure = { kind: 'optimistic_conflict', retryable: true };
void proveOpaqueDefinition;
void invalidVersion;
void invalidActor;
void invalidFailure;
