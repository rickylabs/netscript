/** Workers workflow resource scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type PluginResource,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { exportStem, fileStem, parseWorkflowInput, type WorkflowInput } from '../input.ts';
import { workflowStub } from './workflow.stub.ts';

/** Unified workers workflow item scaffolder used by add workflow. */
export const workflowScaffolder: ItemScaffolder<WorkflowInput> = {
  name: 'workflow',
  emit(input: WorkflowInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        `workers/workflows/${fileStem(input.id)}.ts`,
        substituteTokens(workflowStub, {
          WORKFLOW_ID: input.id,
          WORKFLOW_EXPORT: `${exportStem(input.id)}Workflow`,
        }),
      ),
    ];
  },
};

/** Workers workflow plugin resource descriptor. */
export const workflowResource: PluginResource<WorkflowInput> = {
  name: 'workflow',
  scaffolder: workflowScaffolder,
  parseInput: parseWorkflowInput,
};
