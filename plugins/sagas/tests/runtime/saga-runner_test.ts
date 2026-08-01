import { assertEquals, assertFalse } from 'jsr:@std/assert@^1';
import { defineSaga } from '@netscript/plugin-sagas-core';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { startSagaRunner } from '../../src/runtime/saga-runner.ts';

Deno.test('startSagaRunner loads a non-empty dependency-shaped registry from the project root', async () => {
  const packageModuleUrl =
    'https://jsr.io/@netscript/plugin-sagas/0.0.2/src/runtime/saga-runner.ts';
  const definition = defineSaga('dependency-shaped')
    .state({ status: 'pending' })
    .on('dependency.started', () => [])
    .build();
  const imported: string[] = [];

  const supervisor = await startSagaRunner({
    readEnv: () => undefined,
    cwd: () => '/consumer/project',
    importer: (specifier) => {
      imported.push(specifier);
      return Promise.resolve({ definitions: [definition] });
    },
    supervisor: {
      createRuntime: () => createSagaRuntime(),
    },
  });

  try {
    assertEquals(imported, [
      'file:///consumer/project/.netscript/generated/plugin-sagas/sagas.registry.ts',
    ]);
    assertFalse(imported[0].startsWith(new URL('.', packageModuleUrl).href));
    assertEquals(supervisor.snapshot().definitionCount, 1);
  } finally {
    await supervisor.stop('dependency-shaped test complete');
  }
});
