/** Type-checked source stub for generated background child glue. @module */
import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Background runtime glue with the shared child health transport. */
export const runtimeGlueStub: StubSource<never> = defineStub({
  source: [
    '/** Sagas background child health and runtime glue. @module */',
    "import '@netscript/kv/redis';",
    "import { runChildHealthProcess } from '@netscript/plugin/health';",
    "import { type SagaRuntimeSupervisor, startSagaRunner } from '@netscript/plugin-sagas/runtime';",
    '',
    'if (import.meta.main) {',
    '  let supervisor: SagaRuntimeSupervisor | undefined;',
    '  await runChildHealthProcess(',
    '    async (health, signal) => {',
    '      supervisor = await startSagaRunner({ supervisor: { health } });',
    '      try {',
    '        await Promise.race([',
    '          supervisor.waitForDelivery(),',
    '          new Promise<void>((resolve) => {',
    '            if (signal.aborted) resolve();',
    "            else signal.addEventListener('abort', () => resolve(), { once: true });",
    '          }),',
    '        ]);',
    '      } finally {',
    "        await supervisor.stop('background-child-shutdown');",
    '      }',
    '    },',
    '    () => supervisor?.snapshot().childHealth,',
    '  );',
    '}',
    '',
  ].join('\n'),
  tokens: [],
});
