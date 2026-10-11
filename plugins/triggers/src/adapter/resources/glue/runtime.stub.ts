/** Type-checked source stub for generated background child glue. @module */
import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Background runtime glue with the shared child health transport. */
export const runtimeGlueStub: StubSource<never> = defineStub({
  source: [
    '/** Triggers background child health and runtime glue. @module */',
    "import '@netscript/kv/redis';",
    "import { runChildHealthProcess } from '@netscript/plugin/health';",
    "import { startCombinedProcess } from '@netscript/plugin-triggers/runtime';",
    '',
    'if (import.meta.main) {',
    '  await runChildHealthProcess(async (health, signal) => {',
    '    await startCombinedProcess({ health, signal });',
    '  });',
    '}',
    '',
  ].join('\n'),
  tokens: [],
});
