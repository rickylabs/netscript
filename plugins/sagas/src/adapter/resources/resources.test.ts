import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
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
