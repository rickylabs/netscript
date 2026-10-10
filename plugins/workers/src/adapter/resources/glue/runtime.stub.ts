/** Type-checked source stub for generated background child glue. @module */
import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Background runtime glue with the shared child health transport. */
export const runtimeGlueStub: StubSource<never> = defineStub({
  source: [
    '/** Workers background child health and runtime glue. @module */',
    "import { runChildHealthProcess, type ChildHealthSnapshot } from '@netscript/plugin/health';",
    "import { startCombinedProcess } from '@netscript/plugin-workers/runtime';",
    '',
    'if (import.meta.main) {',
    '  let snapshot: (() => ChildHealthSnapshot) | undefined;',
    '  await runChildHealthProcess(',
    '    async (health, signal) => {',
    '      await startCombinedProcess({ health, signal, onStarted: (readHealth) => { snapshot = readHealth; } });',
    '    },',
    '    () => snapshot?.(),',
    '  );',
    '}',
    '',
  ].join('\n'),
  tokens: [],
});
