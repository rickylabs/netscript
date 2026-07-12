/** Workers task resource scaffolder.
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
import {
  exportStem,
  fileStem,
  parseTaskInput,
  type TaskInput,
  type WorkersTaskRuntime,
} from '../input.ts';
import { denoTaskStub, powershellTaskStub, pythonTaskStub, shellTaskStub } from './task.stub.ts';
import { renderWorkerResourceMetadata } from '../resource-metadata.ts';

/** Canonical starter task input emitted during workers install. */
export const DEFAULT_TASK_INPUT: TaskInput = { id: 'validate-payload', runtime: 'deno' };

/** Unified workers task item scaffolder used by install and add task. */
export const taskScaffolder: ItemScaffolder<TaskInput> = {
  name: 'task',
  emit(input: TaskInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        taskPath(input.id, input.runtime, input.entrypoint),
        renderWorkerResourceMetadata({
          kind: 'task',
          id: input.id,
          enabled: true,
          entrypoint: taskPath(input.id, input.runtime, input.entrypoint),
          runtime: input.runtime,
          timeout: input.timeoutMs,
          maxRetries: input.maxRetries,
        }) + taskSource(input),
      ),
    ];
  },
};

/** Workers task plugin resource descriptor. */
export const taskResource: PluginResource<TaskInput> = {
  name: 'task',
  scaffolder: taskScaffolder,
  defaultInput: DEFAULT_TASK_INPUT,
  parseInput: parseTaskInput,
};

/** Return the generated userland path for a task input. */
export function taskPath(
  id: string,
  runtime: WorkersTaskRuntime,
  entrypoint?: string,
): string {
  if (entrypoint) return normalizeEntrypoint(entrypoint);
  const extension = runtime === 'python'
    ? '.py'
    : runtime === 'shell'
    ? '.sh'
    : runtime === 'powershell'
    ? '.ps1'
    : '.ts';
  return `workers/tasks/${fileStem(id)}${extension}`;
}

function normalizeEntrypoint(entrypoint: string): string {
  const normalized = entrypoint.trim().replaceAll('\\', '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error('Task --entrypoint must be a project-relative path without parent traversal.');
  }
  return normalized;
}

function taskSource(input: TaskInput): string {
  switch (input.runtime) {
    case 'python':
      return substituteTokens(pythonTaskStub, { TASK_ID: input.id });
    case 'shell':
      return substituteTokens(shellTaskStub, { TASK_ID: input.id });
    case 'powershell':
      return substituteTokens(powershellTaskStub, { TASK_ID: input.id });
    case 'deno':
      return substituteTokens(denoTaskStub, {
        TASK_ID: input.id,
        TASK_EXPORT: `${exportStem(input.id)}Task`,
      });
  }
}
