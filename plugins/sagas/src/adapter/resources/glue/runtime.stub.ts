/** Type-checked source stub for the generated sagas runtime glue.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Sagas background runtime glue stub. */
export const runtimeGlueStub: StubSource<never> = defineStub({
  source: [
    '/** Runtime glue emitted into generated projects for the sagas background process.',
    ' *',
    ' * @module',
    ' */',
    '',
    "import { runSagaRunner } from '@netscript/plugin-sagas/runtime';",
    '',
    'if (import.meta.main) {',
    '  await runSagaRunner({',
    "    registryModule: projectFileUrl('.netscript/generated/plugin-sagas/sagas.registry.ts').href,",
    '  });',
    '}',
    '',
    'function projectFileUrl(relativePath: string): URL {',
    "  const root = Deno.cwd().replaceAll('\\\\', '/');",
    "  const normalizedRoot = root.endsWith('/') ? root : `${root}/`;",
    "  const base = normalizedRoot.startsWith('/')",
    '    ? `file://${normalizedRoot}`',
    '    : `file:///${normalizedRoot}`;',
    '  return new URL(relativePath, base);',
    '}',
    '',
  ].join('\n'),
  tokens: [],
});
