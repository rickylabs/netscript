import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { sagasAdapterPlugin } from '../plugin.ts';
import { DEFAULT_SAGA_INPUT, sagaScaffolder } from './mod.ts';
import { sagaDefinitionStub } from './saga/saga.stub.ts';

const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'contracts/',
  'src/runtime/',
  'src/aspire/',
  'bin/',
  'scaffold.plugin.json',
  'deno.json',
] as const;

Deno.test('sagas install starter saga is byte-identical to add saga default emission', () => {
  const installSaga = collectInstallArtifacts(sagasAdapterPlugin).find((artifact) =>
    artifact.path === 'sagas/user-registration-saga.ts'
  );
  const addSaga = sagaScaffolder.emit(DEFAULT_SAGA_INPUT)[0];

  assertEquals(installSaga?.path, addSaga.path);
  assertEquals(installSaga ? artifactText(installSaga) : undefined, artifactText(addSaga));

  const config = collectInstallArtifacts(sagasAdapterPlugin).find((artifact) =>
    artifact.path === 'sagas/user-registration.config.ts'
  );
  const source = config ? artifactText(config) : '';
  assertStringIncludes(
    source,
    ".description('Registers a user through the default saga workflow.')",
  );
  assertStringIncludes(source, ".topic('users')");
  assertStringIncludes(source, ".tags(...['sample', 'users'])");
});

Deno.test('sagas TypeScript literals escape apostrophes without changing values', () => {
  const config = sagaScaffolder.emit({
    id: 'customer-welcome',
    durability: 't1',
    description: "Registers O'Brien",
  })[1];
  assertStringIncludes(artifactText(config), ".description('Registers O\\'Brien')");
});

Deno.test('sagas add saga emits the same shape at the user-named path', () => {
  const artifacts = sagaScaffolder.emit({ id: 'invoice-payment', durability: 't2' });

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'sagas/invoice-payment-saga.ts',
    'sagas/invoice-payment.config.ts',
  ]);
  assertStringIncludes(artifactText(artifacts[0]), 'InvoicePaymentSaga');
  assertStringIncludes(artifactText(artifacts[0]), "defineSaga(\n  'invoice-payment'");
  assertStringIncludes(
    artifactText(artifacts[0]),
    ".compensate<Message['type'], Message['payload']>",
  );
  assertStringIncludes(artifactText(artifacts[1]), 'InvoicePaymentSagaConfig');
});

Deno.test('sagas install emits only userland glue under sagas', () => {
  const artifacts = collectInstallArtifacts(sagasAdapterPlugin);

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'sagas/user-registration-saga.ts',
    'sagas/user-registration.config.ts',
    'sagas/mod.ts',
    'sagas/runtime.ts',
  ]);
  for (const artifact of artifacts) {
    assertEquals(artifact.path.startsWith('sagas/'), true);
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assertEquals(
        artifact.path.includes(forbidden),
        false,
        `artifact ${artifact.path} must not contain ${forbidden}`,
      );
    }
  }
});

Deno.test('sagas install runtime glue registers Redis before starting the runner', () => {
  const runtimeArtifact = collectInstallArtifacts(sagasAdapterPlugin).find((artifact) =>
    artifact.path === 'sagas/runtime.ts'
  );
  assert(runtimeArtifact, 'sagas install must emit sagas/runtime.ts');

  const source = artifactText(runtimeArtifact);
  const registrationImport = "import '@netscript/kv/redis';";
  const runnerImport = "import { startSagaRunner } from '@netscript/plugin-sagas/runtime';";

  assertStringIncludes(source, registrationImport);
  assertStringIncludes(source, runnerImport);
  assert(
    source.indexOf(registrationImport) < source.indexOf(runnerImport),
    'Redis adapter registration must run before the saga runner module is imported',
  );
});

Deno.test('sagas install runtime glue exposes a supervisor-backed health endpoint', () => {
  const runtimeArtifact = collectInstallArtifacts(sagasAdapterPlugin).find((artifact) =>
    artifact.path === 'sagas/runtime.ts'
  );
  assert(runtimeArtifact, 'sagas install must emit sagas/runtime.ts');

  const source = artifactText(runtimeArtifact);
  assertStringIncludes(source, 'await startSagaRunner({');
  assertStringIncludes(source, 'Deno.serve({ port }, (request) =>');
  assertStringIncludes(source, "snapshot.status === 'running'");
  assertStringIncludes(source, "Deno.env.get('PORT')");
});

Deno.test('sagas resource token map rejects misspelled tokens at compile time', () => {
  // @ts-expect-error SAGA_EXPORT is required by sagaDefinitionStub.
  substituteTokens(sagaDefinitionStub, {
    COMPLETED_STATUS: 'completed',
    DURABILITY: 't1',
    INITIAL_STATUS: 'pending',
    MESSAGE_TYPE: 'user.registered',
    SAGA_ID: 'broken',
  });
  assertEquals(true, true);
});
