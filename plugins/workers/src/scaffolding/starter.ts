import type { WorkersItemScaffolder } from '@netscript/plugin-workers-core/abstracts';
import { JobBuilderScaffolder, JobHandlerScaffolder } from './job-scaffolders.ts';
import {
  DenoTaskScaffolder,
  PsTaskScaffolder,
  PythonTaskScaffolder,
  ShellTaskScaffolder,
} from './task-scaffolders.ts';
import { WorkflowScaffolder } from './workflow-scaffolder.ts';
import type { WorkersScaffoldInput } from './input.ts';

/** Create all first-party workers item scaffolders. */
export function createWorkersItemScaffolders(): readonly WorkersItemScaffolder<
  WorkersScaffoldInput
>[] {
  return Object.freeze([
    new JobHandlerScaffolder(),
    new JobBuilderScaffolder(),
    new DenoTaskScaffolder(),
    new PythonTaskScaffolder(),
    new ShellTaskScaffolder(),
    new PsTaskScaffolder(),
    new WorkflowScaffolder(),
  ]);
}
