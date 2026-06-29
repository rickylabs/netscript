/** Workers background workspace barrel scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { exportStem, fileStem } from '../input.ts';
import { DEFAULT_JOB_INPUT } from '../job/job.ts';
import { DEFAULT_TASK_INPUT } from '../task/task.ts';
import { barrelStub } from './barrel.stub.ts';

/** Input accepted by the workers barrel scaffolder. */
export interface BarrelInput {
  /** Job id exported by the generated barrel. */
  readonly jobId: string;
  /** Task id exported by the generated barrel. */
  readonly taskId: string;
}

/** Canonical barrel input emitted during workers install. */
export const DEFAULT_BARREL_INPUT: BarrelInput = {
  jobId: DEFAULT_JOB_INPUT.id,
  taskId: DEFAULT_TASK_INPUT.id,
};

/** Workers barrel item scaffolder emitted during install. */
export const barrelScaffolder: ItemScaffolder<BarrelInput> = {
  name: 'barrel',
  emit(input: BarrelInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'workers/mod.ts',
        substituteTokens(barrelStub, {
          JOB_EXPORT: `${exportStem(input.jobId)}Job`,
          JOB_FILE: fileStem(input.jobId),
          TASK_EXPORT: `${exportStem(input.taskId)}Task`,
          TASK_FILE: fileStem(input.taskId),
        }),
      ),
    ];
  },
};
