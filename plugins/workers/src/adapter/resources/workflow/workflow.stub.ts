/** Type-checked source stub for generated workers workflows.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Workers workflow definition stub with named substitution tokens. */
export const workflowStub: StubSource<'WORKFLOW_ID' | 'WORKFLOW_EXPORT'> = defineStub({
  source: `import { defineWorkflow } from '@netscript/plugin-workers-core';

/**
 * Starter workers workflow definition for %%WORKFLOW_ID%%.
 */
export const %%WORKFLOW_EXPORT%% = defineWorkflow('%%WORKFLOW_ID%%')
  .sleep('%%WORKFLOW_ID%%-start', 1000)
  .build();
`,
  tokens: ['WORKFLOW_ID', 'WORKFLOW_EXPORT'] as const,
});
