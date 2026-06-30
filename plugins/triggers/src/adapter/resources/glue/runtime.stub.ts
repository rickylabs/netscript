/** Type-checked source stub for the generated triggers runtime glue.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Triggers background runtime glue stub. */
export const runtimeGlueStub: StubSource<never> = defineStub({
  source: [
    '/** Runtime glue emitted into generated projects for the triggers background process.',
    ' *',
    ' * @module',
    ' */',
    '',
    "import { startCombinedProcess } from '@netscript/plugin-triggers/runtime';",
    '',
    'if (import.meta.main) {',
    '  await startCombinedProcess();',
    '}',
    '',
  ].join('\n'),
  tokens: [],
});
