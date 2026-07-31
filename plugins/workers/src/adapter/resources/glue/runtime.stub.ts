/** Type-checked source stub for the generated workers runtime glue.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Workers background runtime glue stub. */
export const runtimeGlueStub: StubSource<never> = defineStub({
  source: [
    '/** Runtime glue emitted into generated projects for the workers background process.',
    ' *',
    ' * `startCombinedProcess` resolves the generated job registry from the project',
    ' * root, registers every job it declares, and fails at startup if any of them',
    ' * did not reach the runtime registry. Do not re-resolve the registry path here:',
    ' * a second resolver is how a compiled job ends up missing at dispatch time.',
    ' *',
    ' * @module',
    ' */',
    '',
    "import { startCombinedProcess } from '@netscript/plugin-workers/runtime';",
    '',
    'if (import.meta.main) {',
    '  await startCombinedProcess();',
    '}',
    '',
  ].join('\n'),
  tokens: [],
});
