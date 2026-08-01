import { assertEquals } from 'jsr:@std/assert@^1';
import {
  projectFileUrl,
  resolveProjectRegistryModule,
} from '../../src/runtime/project-registry-module.ts';

Deno.test('resolveProjectRegistryModule uses explicit, env, then project-root fallback precedence', () => {
  const readEnv = (name: string): string | undefined =>
    name === 'SAGAS_REGISTRY_MODULE'
      ? './env/sagas.registry.ts'
      : name === 'NETSCRIPT_PROJECT_ROOT'
      ? '/workspace/from-env'
      : undefined;

  assertEquals(
    resolveProjectRegistryModule({
      registryModule: './explicit/sagas.registry.ts',
      readEnv,
      cwd: () => '/workspace/from-cwd',
    }),
    'file:///workspace/from-env/explicit/sagas.registry.ts',
  );
  assertEquals(
    resolveProjectRegistryModule({ readEnv, cwd: () => '/workspace/from-cwd' }),
    'file:///workspace/from-env/env/sagas.registry.ts',
  );
  assertEquals(
    resolveProjectRegistryModule({ readEnv: () => undefined, cwd: () => '/workspace/from-cwd' }),
    'file:///workspace/from-cwd/.netscript/generated/plugin-sagas/sagas.registry.ts',
  );
});

Deno.test('projectFileUrl handles Windows drive roots and backslashes on every host', () => {
  assertEquals(
    projectFileUrl('.netscript\\generated\\plugin-sagas\\sagas.registry.ts', 'C:\\work\\app')
      .href,
    'file:///C:/work/app/.netscript/generated/plugin-sagas/sagas.registry.ts',
  );
});

Deno.test('resolveProjectRegistryModule preserves absolute URL and module specifiers', () => {
  for (
    const specifier of [
      'file:///workspace/custom.registry.ts',
      'jsr:@example/registry',
      'https://example.test/registry.ts',
    ]
  ) {
    assertEquals(
      resolveProjectRegistryModule({ registryModule: specifier, readEnv: () => undefined }),
      specifier,
    );
  }
});
