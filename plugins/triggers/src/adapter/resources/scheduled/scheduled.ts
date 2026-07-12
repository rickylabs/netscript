/** Scheduled trigger resource scaffolder.
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
import { exportStem, parseScheduledInput, type ScheduledInput, triggerPath } from '../input.ts';
import { scheduledStub } from './scheduled.stub.ts';

/** Canonical starter scheduled trigger input emitted during triggers install. */
export const DEFAULT_SCHEDULED_INPUT: ScheduledInput = {
  id: 'daily-maintenance',
  fileName: 'daily-maintenance',
  cron: '0 3 * * *',
};

/** Unified scheduled trigger item scaffolder used by install and add scheduled. */
export const scheduledScaffolder: ItemScaffolder<ScheduledInput> = {
  name: 'scheduled',
  emit(input: ScheduledInput): readonly ScaffoldArtifact[] {
    const job = input.job === undefined ? undefined : enqueueJobSource(input.job);
    return [
      textArtifact(
        triggerPath(input),
        substituteTokens(scheduledStub, {
          BUILDER_IMPORTS: job === undefined
            ? 'defineScheduledTrigger'
            : 'defineScheduledTrigger, enqueueJob',
          CRON: input.cron ?? '0 9 * * *',
          HANDLER: job?.handler ?? emptyHandler(),
          JOB_BLOCK: job?.definition ?? '',
          JOB_IMPORT: job?.import ?? '',
          METADATA_LINES: metadataLines(input.description, input.tags),
          TIMEZONE_LINE: input.timezone ? `,\n    timezone: ${JSON.stringify(input.timezone)}` : '',
          TRIGGER_EXPORT: `${exportStem(input.id)}Trigger`,
          TRIGGER_ID: input.id,
        }),
      ),
    ];
  },
};

function enqueueJobSource(
  jobId: string,
): Readonly<{ import: string; definition: string; handler: string }> {
  const symbol = `${exportStem(jobId)}Job`;
  const literal = JSON.stringify(jobId);
  return {
    import: "import type { JobDefinition } from '@netscript/plugin-workers-core';\n",
    definition:
      `\nconst ${symbol} = {\n  id: ${literal} as JobDefinition<${literal}>['id'],\n  name: ${literal},\n  topic: 'default',\n} satisfies JobDefinition<${literal}>;\n`,
    handler:
      `(event) =>\n    Promise.resolve([\n      enqueueJob(${symbol}, { payload: event.payload }),\n    ])`,
  };
}

function emptyHandler(): string {
  return `// deno-lint-ignore require-await -- starter handler; the runtime contract is async.\n  async () => {\n    return [];\n  }`;
}

function metadataLines(description?: string, tags?: readonly string[]): string {
  return `${description === undefined ? '' : `,\n    description: ${JSON.stringify(description)}`}${
    tags === undefined ? '' : `,\n    tags: ${JSON.stringify(tags)}`
  }`;
}

/** Scheduled trigger plugin resource descriptor. */
export const scheduledResource: PluginResource<ScheduledInput> = {
  name: 'scheduled',
  scaffolder: scheduledScaffolder,
  defaultInput: DEFAULT_SCHEDULED_INPUT,
  parseInput: parseScheduledInput,
};
