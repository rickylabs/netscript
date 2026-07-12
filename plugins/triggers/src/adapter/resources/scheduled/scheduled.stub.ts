/** Type-checked source stub for generated scheduled triggers.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked scheduled trigger stub with named substitution tokens. */
export const scheduledStub: StubSource<
  | 'BUILDER_IMPORTS'
  | 'CRON'
  | 'HANDLER'
  | 'JOB_BLOCK'
  | 'JOB_IMPORT'
  | 'METADATA_LINES'
  | 'TIMEZONE_LINE'
  | 'TRIGGER_EXPORT'
  | 'TRIGGER_ID'
> = defineStub({
  source: `import { %%BUILDER_IMPORTS%% } from '@netscript/plugin-triggers-core/builders';
import type {
  ScheduledTriggerDefinition,
  ScheduledTriggerPayload,
  TriggerContext,
  TriggerEvent,
} from '@netscript/plugin-triggers-core/domain';
%%JOB_IMPORT%%%%JOB_BLOCK%%

/**
 * Starter scheduled trigger for %%TRIGGER_ID%%.
 */
export const %%TRIGGER_EXPORT%%: ScheduledTriggerDefinition<
  '%%TRIGGER_ID%%',
  TriggerEvent<'scheduled', ScheduledTriggerPayload>,
  TriggerContext
> = defineScheduledTrigger(
  %%HANDLER%%,
  {
    id: '%%TRIGGER_ID%%',
    cron: '%%CRON%%'%%TIMEZONE_LINE%%,
    persistent: false,
    backfill: { enabled: true, windowMs: 3_600_000, policy: 'fire-once' }%%METADATA_LINES%%,
  },
);

export default %%TRIGGER_EXPORT%%;
`,
  tokens: [
    'BUILDER_IMPORTS',
    'CRON',
    'HANDLER',
    'JOB_BLOCK',
    'JOB_IMPORT',
    'METADATA_LINES',
    'TIMEZONE_LINE',
    'TRIGGER_EXPORT',
    'TRIGGER_ID',
  ] as const,
});
