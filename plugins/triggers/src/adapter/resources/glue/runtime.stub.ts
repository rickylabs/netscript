/** Type-checked source stub for generated background child glue. @module */
import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Background runtime glue with the shared child health transport. */
export const runtimeGlueStub: StubSource<never> = defineStub({
  source: [
    '/** Triggers background child health and runtime glue. @module */',
    "import '@netscript/kv/redis';",
    "import { runChildHealthProcess } from '@netscript/plugin/health';",
    "import { startCombinedProcess, TriggerHealthMonitor } from '@netscript/plugin-triggers/runtime';",
    '',
    'if (import.meta.main) {',
    '  const health = new TriggerHealthMonitor();',
    '  await runChildHealthProcess(async (_health, signal) => {',
    '    await startCombinedProcess({ health, signal });',
    '  }, () => health.snapshot(), {',
    '    health,',
    "    restartHistoryPath: '.data/child-health/triggers.json',",
    '  });',
    '}',
    '',
  ].join('\n'),
  tokens: [],
});
