/** Workers job resource scaffolder.
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
import { exportStem, fileStem, type JobInput, parseJobInput } from '../input.ts';
import { jobStub } from './job.stub.ts';
import { renderWorkerResourceMetadata } from '../resource-metadata.ts';

/** Canonical starter job input emitted during workers install. */
export const DEFAULT_JOB_INPUT: JobInput = { id: 'health-check' };

/** Unified workers job item scaffolder used by install and add job. */
export const jobScaffolder: ItemScaffolder<JobInput> = {
  name: 'job',
  emit(input: JobInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        `workers/jobs/${fileStem(input.id)}.ts`,
        renderWorkerResourceMetadata({
          kind: 'job',
          id: input.id,
          enabled: true,
          entrypoint: `workers/jobs/${fileStem(input.id)}.ts`,
          topic: input.topic,
          schedule: input.schedule,
          timeout: input.timeoutMs,
          maxRetries: input.maxRetries,
          tags: input.tags,
        }) + substituteTokens(jobStub, {
          JOB_ID: input.id,
          JOB_EXPORT: `${exportStem(input.id)}Job`,
        }),
      ),
    ];
  },
};

/** Workers job plugin resource descriptor. */
export const jobResource: PluginResource<JobInput> = {
  name: 'job',
  scaffolder: jobScaffolder,
  defaultInput: DEFAULT_JOB_INPUT,
  parseInput: parseJobInput,
};
