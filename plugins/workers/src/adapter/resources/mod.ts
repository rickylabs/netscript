/** Workers adapter resources.
 *
 * @module
 */

export { type BarrelInput, barrelScaffolder, DEFAULT_BARREL_INPUT } from './barrel/barrel.ts';
export {
  DEFAULT_RUNTIME_GLUE_INPUT,
  type RuntimeGlueInput,
  runtimeGlueScaffolder,
} from './glue/glue.ts';
export { DEFAULT_JOB_INPUT, jobResource, jobScaffolder } from './job/job.ts';
export { DEFAULT_TASK_INPUT, taskPath, taskResource, taskScaffolder } from './task/task.ts';
export { workflowResource, workflowScaffolder } from './workflow/workflow.ts';
export {
  fileStem,
  parseJobInput,
  parseTaskInput,
  parseTaskRuntime,
  parseWorkflowInput,
  requiredResourceId,
  WORKERS_TASK_RUNTIMES,
} from './input.ts';
export type {
  JobInput,
  TaskInput,
  WorkersResourceInput,
  WorkersTaskRuntime,
  WorkflowInput,
} from './input.ts';
