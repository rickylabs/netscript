import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { createRuntimeBehaviorGates } from '../../../../src/application/gates/scaffold/runtime/behavior-gates.ts';
import {
  resolveSagaProcessDatabaseUrl,
  sagaProcessDatabaseUrl,
} from '../../../../src/application/gates/scaffold/verify-saga-publish-process.ts';

Deno.test('saga provider-borrowing conformance is noncritical in the PostgreSQL runtime tier and absent from SQLite', () => {
  const id = 'behavior.sagas-provider-conformance';
  const postgres = createRuntimeBehaviorGates('postgres').find((gate) => String(gate.id) === id);
  assertEquals(postgres?.critical, false);
  assertEquals(postgres?.kind, 'command');
  assertEquals(createRuntimeBehaviorGates('sqlite').some((gate) => String(gate.id) === id), false);
});

Deno.test('saga process gate uses the described allocation and refuses another provider', () => {
  const described = (value?: string | null) =>
    JSON.stringify({
      resources: [{
        name: 'users',
        environment: value === undefined ? {} : { DATABASE_URL: value },
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

Deno.test('resolveSagaProcessDatabaseUrl falls back to process env when describe redacts DATABASE_URL to null', async () => {
  const redactedDescribe = JSON.stringify({
    resources: [{ name: 'users', environment: { DATABASE_URL: null } }],
  });
  const processUrl = 'postgresql://postgres:secret@127.0.0.1:45678/app';
  assertEquals(
    await resolveSagaProcessDatabaseUrl(redactedDescribe, () => Promise.resolve(processUrl)),
    processUrl,
  );
  await assertRejects(
    () => resolveSagaProcessDatabaseUrl(redactedDescribe, () => Promise.resolve(undefined)),
    Error,
    'DATABASE_URL',
  );
  const error = await assertRejects(
    () =>
      resolveSagaProcessDatabaseUrl(
        redactedDescribe,
        () => Promise.resolve('mysql://root:topsecret@127.0.0.1:3306/app'),
      ),
    Error,
    'PostgreSQL',
  );
  assertEquals(error.message.includes('topsecret'), false);
});
