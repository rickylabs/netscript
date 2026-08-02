import { assertEquals } from 'jsr:@std/assert@^1';
import { defineSaga } from '@netscript/plugin-sagas-core';
import { registerSagas } from '../../services/src/init.ts';

Deno.test('registerSagas uses the shared project-root seam and registers non-empty definitions', async () => {
  const definition = defineSaga('service-dependency-shaped')
    .state({ status: 'pending' })
    .on('service.started', () => [])
    .build();
  const imported: string[] = [];
  let registered = 0;

  const definitions = await registerSagas({
    readEnv: () => undefined,
    cwd: () => '/consumer/service-project',
    importer: (specifier) => {
      imported.push(specifier);
      return Promise.resolve({ sagaRegistry: new Map([[definition.id, definition]]) });
    },
    registerDefinitions: (loaded) => {
      registered = loaded.length;
      return Promise.resolve(loaded.length);
    },
  });

  assertEquals(imported, [
    'file:///consumer/service-project/.netscript/generated/plugin-sagas/sagas.registry.ts',
  ]);
  assertEquals(definitions.length, 1);
  assertEquals(registered, 1);
});
