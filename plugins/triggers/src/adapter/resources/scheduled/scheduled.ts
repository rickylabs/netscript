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
    return [
      textArtifact(
        triggerPath(input),
        substituteTokens(scheduledStub, {
          CRON: input.cron ?? '0 9 * * *',
          TIMEZONE_LINE: input.timezone ? `,\n    timezone: ${JSON.stringify(input.timezone)}` : '',
          TRIGGER_EXPORT: `${exportStem(input.id)}Trigger`,
          TRIGGER_ID: input.id,
        }),
      ),
    ];
  },
};

/** Scheduled trigger plugin resource descriptor. */
export const scheduledResource: PluginResource<ScheduledInput> = {
  name: 'scheduled',
  scaffolder: scheduledScaffolder,
  defaultInput: DEFAULT_SCHEDULED_INPUT,
  parseInput: parseScheduledInput,
};
