import { assertEquals } from '@std/assert';
import { z } from 'zod';
import { commandBaseContract, throwCommandContractError } from '@netscript/contracts/commands';
import {
  canonicalCommandJson,
  type CommandEnvelope,
  CommandError,
  type CommandError as ServiceCommandError,
  defineCommand,
  jsonCodec,
  parseCanonicalCommandJson,
} from '@netscript/service/commands';

Deno.test('public command consumer composes receipt codecs with opt-in transport failures', () => {
  const response = z.object({ updated: z.boolean() });
  const definition = defineCommand({
    name: 'items.update',
    definitionVersion: 1,
    idempotency: {
      scope: ({ actor }) => actor.subject,
      fingerprint: (input: { id: string }) => input,
      response: jsonCodec(response),
    },
    records: { audit: 'required', outbox: 'forbidden' },
    handle: () => Promise.resolve({ updated: true }),
  });
  const envelope: CommandEnvelope<{ id: string }> = {
    input: { id: 'item' },
    actor: { kind: 'principal', subject: 'actor' },
    correlationId: 'correlation',
    expectedVersion: 'version',
    idempotencyKey: 'request',
  };
  const route = commandBaseContract.meta({ access: { authentication: 'required' } })
    .input(z.object({ id: z.string() })).output(response);
  assertEquals(definition.idempotency.scope(envelope), 'actor');
  assertEquals(
    definition.idempotency.response.decode(parseCanonicalCommandJson(
      canonicalCommandJson(definition.idempotency.response.encode({ updated: true })),
    )),
    { updated: true },
  );
  assertEquals(route['~orpc'].meta.access?.authentication, 'required');
  const failure: ServiceCommandError = new CommandError({
    kind: 'in_progress',
    retryable: true,
    retryAfterMs: 25,
  }, {
    cause: new Error('trusted private cause'),
  });
  const translation = (() => {
    try {
      throwCommandContractError(failure, {
        COMMAND_CONFLICT: ({ data }) => ({ code: 'COMMAND_CONFLICT', data }),
        IDEMPOTENCY_KEY_REUSE: ({ data }) => ({ code: 'IDEMPOTENCY_KEY_REUSE', data }),
        COMMAND_IN_PROGRESS: ({ data }) => ({ code: 'COMMAND_IN_PROGRESS', data }),
      });
    } catch (error) {
      return error;
    }
  })();
  assertEquals(translation, {
    code: 'COMMAND_IN_PROGRESS',
    data: { kind: 'in_progress', retryable: true, retryAfterMs: 25 },
  });
});
