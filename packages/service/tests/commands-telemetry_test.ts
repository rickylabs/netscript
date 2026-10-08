import { assert, assertEquals } from '@std/assert';
import { createOtelCommandTelemetryPort } from '../../telemetry/commands.ts';
import {
  CommandError,
  type CommandTelemetryPort,
  createCommandExecutor,
} from '@netscript/service/commands';
import {
  createMemoryCommandStore,
  type MemoryCommandBusiness,
} from '@netscript/service/commands/testing';
import {
  command,
  envelope,
  intents,
  ports,
  tracked,
} from './_fixtures/command-executor-fixture.ts';
import { recording, start } from '../../telemetry/tests/commands/native-fixture.ts';

Deno.test('command executor records applied replay busy and failure without private identities', async () => {
  await Promise.resolve();
  await recording(async (tracer, exporter) => {
    await Promise.resolve();
    const definition = command(async (ctx) => {
      await Promise.resolve();
      intents(ctx);
      return 'SECRET response';
    });
    const telemetry: CommandTelemetryPort = createOtelCommandTelemetryPort({
      definitions: [definition],
      tracer,
    });
    const store = createMemoryCommandStore();
    const executor = createCommandExecutor({ store, ...ports(), telemetry });
    const secret = {
      ...envelope,
      input: { value: 'SECRET payload' },
      actor: { kind: 'system' as const, subject: 'SECRET actor' },
      correlationId: 'SECRET correlation',
      idempotencyKey: 'SECRET key-00000001',
    };
    assertEquals((await executor.execute(definition, secret)).outcome, 'applied');
    assertEquals((await executor.execute(definition, secret)).outcome, 'replayed');
    const busy = createCommandExecutor({
      store: tracked(store, [], { decision: () => ({ kind: 'busy' }) }),
      ...ports(),
      telemetry,
    });
    try {
      await busy.execute(definition, secret);
    } catch (error) {
      assert(error instanceof CommandError);
    }
    const original = new Error('SECRET error stack');
    try {
      await executor.execute(
        command(async () => {
          await Promise.resolve();
          throw original;
        }),
        { ...secret, idempotencyKey: 'SECRET key-00000002' },
      );
    } catch (error) {
      assert(error === original);
    }
    const spans = exporter.getFinishedSpans();
    assertEquals(spans.map((s) => s.attributes['netscript.command.outcome']), [
      'applied',
      'replayed',
      'failed',
      'failed',
    ]);
    assertEquals(spans.map((s) => s.attributes['netscript.command.idempotency']), [
      'claimed',
      'replayed',
      'busy',
      'claimed',
    ]);
    assertEquals(spans.map((s) => s.attributes['netscript.command.outbox.count']), [
      1,
      0,
      undefined,
      undefined,
    ]);
    assertEquals(spans[2]!.attributes['error.type'], 'in_progress');
    assertEquals(spans[3]!.attributes['error.type'], undefined);
    assertEquals(spans.map((s) => s.status.code), [1, 1, 2, 2]);
    assertEquals(
      JSON.stringify(
        spans.map((s) => ({ attributes: s.attributes, status: s.status, events: s.events })),
      ).includes('SECRET'),
      false,
    );
  });
});

Deno.test('command executor traces early missing-key unsupported-isolation and cancellation before any store call', async () => {
  await Promise.resolve();
  await recording(async (tracer, exporter) => {
    await Promise.resolve();
    const telemetry: CommandTelemetryPort = createOtelCommandTelemetryPort({
      definitions: [start],
      tracer,
    });
    const events: string[] = [];
    const store = tracked(createMemoryCommandStore(), events);
    const executor = createCommandExecutor({ store, ...ports(), telemetry });
    const abort = new AbortController();
    abort.abort(new Error('SECRET cancellation'));
    const unsupported = Object.assign({}, command(), { isolationLevel: 'Snapshot' as const });
    // Genuine definition with unsupported isolation is created rather than forging the opaque binding.
    const { defineCommand } = await import('@netscript/service/commands');
    const snapshot = defineCommand<
      'values.update',
      { value: string },
      string,
      MemoryCommandBusiness
    >({
      name: start.name,
      definitionVersion: 1,
      isolationLevel: unsupported.isolationLevel,
      idempotency: command().idempotency,
      records: command().records,
      handle: () => Promise.resolve('value'),
    });
    const attempts = [
      () => executor.execute(command(), { ...envelope, idempotencyKey: undefined }),
      () => executor.execute(snapshot, envelope),
      () => executor.execute(command(), envelope, { signal: abort.signal }),
    ];
    const kinds = ['invalid_envelope', 'unsupported_capability', 'aborted'];
    for (let index = 0; index < attempts.length; index++) {
      try {
        await attempts[index]!();
        throw new Error('expected rejection');
      } catch (error) {
        assert(error instanceof CommandError);
        assertEquals(error.failure.kind, kinds[index]);
      }
    }
    assertEquals(events, []);
    const spans = exporter.getFinishedSpans();
    assertEquals(spans.map((s) => s.attributes['netscript.command.outcome']), [
      'rejected',
      'rejected',
      'cancelled',
    ]);
    assertEquals(spans.map((s) => s.attributes['netscript.command.idempotency']), [
      'missing',
      'claimed',
      'claimed',
    ]);
    assertEquals(spans.map((s) => s.attributes['error.type']), kinds);
    assertEquals(spans.map((s) => s.attributes['netscript.command.audit.count']), [
      undefined,
      undefined,
      undefined,
    ]);
  });
});

Deno.test('command executor committed success survives a throwing completion observer', async () => {
  await Promise.resolve();
  const store = createMemoryCommandStore();
  let calls = 0;
  const telemetry: CommandTelemetryPort = {
    trace: (_start, operation) =>
      operation({
        finish() {
          throw new Error('SECRET observer');
        },
      }),
  };
  const executor = createCommandExecutor({ store, ...ports(), telemetry });
  const result = await executor.execute(
    command(async (ctx) => {
      await Promise.resolve();
      calls++;
      ctx.tx.set('effect', 'committed');
      return 'value';
    }),
    envelope,
  ).catch(() => {
    assert(false, 'observer replaced committed success');
  });
  assertEquals(result.outcome, 'applied');
  assertEquals(calls, 1);
  assertEquals(store.snapshot().business.effect, 'committed');
});
