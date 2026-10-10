import { assertEquals, assertThrows } from '@std/assert';
import { createRuntimeBehaviorGates } from '../../../../src/application/gates/scaffold/runtime/behavior-gates.ts';
import { sagaProcessDatabaseUrl } from '../../../../src/application/gates/scaffold/verify-saga-publish-process.ts';

Deno.test('saga process proof is required in the PostgreSQL runtime tier and absent from SQLite', () => {
  const id = 'behavior.sagas-publish-process';
  const postgres = createRuntimeBehaviorGates('postgres').find((gate) => String(gate.id) === id);
  assertEquals(postgres?.critical, true);
  assertEquals(postgres?.kind, 'command');
  assertEquals(createRuntimeBehaviorGates('sqlite').some((gate) => String(gate.id) === id), false);
});

Deno.test('saga process gate uses the described allocation and refuses another provider', () => {
  const described = (value?: string) =>
    JSON.stringify({
      resources: [{
        name: 'users',
        environment: value ? { DATABASE_URL: value } : {},
      }],
    });
  const url = 'postgresql://fixture:password@127.0.0.1:45678/fixture';
  assertEquals(sagaProcessDatabaseUrl(described(url)), url);
  assertThrows(() => sagaProcessDatabaseUrl(described()), Error, 'DATABASE_URL');
  assertThrows(() => sagaProcessDatabaseUrl(described('file:./sqlite.db')), Error, 'PostgreSQL');
  assertThrows(
    () => sagaProcessDatabaseUrl(described('private-invalid-value')),
    Error,
    'PostgreSQL',
  );
});
