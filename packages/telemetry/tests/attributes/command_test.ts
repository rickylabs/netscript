import { assertEquals, assertThrows } from '@std/assert';
import {
  CommandAttributes,
  commandResultAttributes,
  CommandSpanNames,
  commandStartAttributes,
  type OtelCommandTelemetryResult,
  type OtelCommandTelemetryStart,
} from '../../attributes.ts';
const definitions = [{ name: 'values.update', definitionVersion: 1 }];
const start: OtelCommandTelemetryStart = {
  ...definitions[0]!,
  isolation: 'default',
  provider: 'postgres',
  idempotency: 'claimed',
};
const result: OtelCommandTelemetryResult = {
  outcome: 'applied',
  idempotency: 'claimed',
  auditCount: 1,
  outboxCount: 2,
};

Deno.test('command vocabulary selects exact RFC attributes and excludes hostile extras', () => {
  assertEquals(CommandSpanNames, {
    EXECUTE: 'command.execute',
    OUTBOX_RELAY: 'command.outbox.relay',
    OUTBOX_PUBLISH: 'command.outbox.publish',
  });
  assertEquals(Object.values(CommandAttributes), [
    'netscript.command.name',
    'netscript.command.definition.version',
    'netscript.command.outcome',
    'netscript.command.idempotency',
    'netscript.command.isolation',
    'netscript.command.store.provider',
    'netscript.command.audit.count',
    'netscript.command.outbox.count',
  ]);
  assertEquals(
    commandStartAttributes(Object.assign({}, start, { payload: 'SECRET' }), definitions),
    {
      'netscript.command.name': 'values.update',
      'netscript.command.definition.version': 1,
      'netscript.command.isolation': 'default',
      'netscript.command.store.provider': 'postgres',
      'netscript.command.idempotency': 'claimed',
    },
  );
  assertEquals(commandResultAttributes(Object.assign({}, result, { secret: 'SECRET' })), {
    'netscript.command.outcome': 'applied',
    'netscript.command.idempotency': 'claimed',
    'netscript.command.audit.count': 1,
    'netscript.command.outbox.count': 2,
  });
});

Deno.test('command vocabulary rejects unregistered names versions and open enum values', () => {
  for (
    const patch of [
      { name: 'other' },
      { name: 'A'.repeat(121) },
      { definitionVersion: 0 },
      { definitionVersion: 2 },
      { definitionVersion: NaN },
      { provider: 'SECRET' },
      { isolation: 'SECRET' },
      { idempotency: 'SECRET' },
    ]
  ) {
    const bad = Object.assign({}, start, patch);
    assertThrows(() => commandStartAttributes(bad, definitions), TypeError);
  }
  for (
    const patch of [
      { outcome: 'SECRET' },
      { idempotency: 'SECRET' },
      { errorType: 'SECRET' },
      { auditCount: -1 },
      { auditCount: 65 },
      { outboxCount: NaN },
      { outboxCount: 0.5 },
    ]
  ) {
    assertThrows(() => commandResultAttributes(Object.assign({}, result, patch)), TypeError);
  }
});

Deno.test('command vocabulary emits counts only for success and closed failure kinds', () => {
  for (
    const outcome of ['applied', 'replayed', 'conflict', 'rejected', 'failed', 'cancelled'] as const
  ) {
    const attrs = commandResultAttributes({ ...result, outcome, errorType: 'aborted' });
    assertEquals(attrs['error.type'], 'aborted');
    assertEquals(
      attrs['netscript.command.audit.count'],
      outcome === 'applied' || outcome === 'replayed' ? 1 : undefined,
    );
    assertEquals(
      attrs['netscript.command.outbox.count'],
      outcome === 'applied' || outcome === 'replayed' ? 2 : undefined,
    );
    assertEquals(attrs['netscript.command.outcome'], outcome);
  }
});
