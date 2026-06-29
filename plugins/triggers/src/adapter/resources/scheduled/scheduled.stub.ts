/** Type-checked source stub for generated scheduled triggers.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked scheduled trigger stub with named substitution tokens. */
export const scheduledStub: StubSource<
  'CRON' | 'TIMEZONE_LINE' | 'TRIGGER_EXPORT' | 'TRIGGER_ID'
> = defineStub({
  source: `import { defineScheduledTrigger } from '@netscript/plugin-triggers-core/builders';
import type {
  ScheduledTriggerDefinition,
  ScheduledTriggerPayload,
  TriggerContext,
  TriggerEvent,
} from '@netscript/plugin-triggers-core/domain';

/**
 * Starter scheduled trigger for %%TRIGGER_ID%%.
 */
export const %%TRIGGER_EXPORT%%: ScheduledTriggerDefinition<
  '%%TRIGGER_ID%%',
  TriggerEvent<'scheduled', ScheduledTriggerPayload>,
  TriggerContext
> = defineScheduledTrigger(
  // deno-lint-ignore require-await -- starter handler; the runtime contract is async.
  async () => {
    return [];
  },
  {
    id: '%%TRIGGER_ID%%',
    cron: '%%CRON%%'%%TIMEZONE_LINE%%,
    persistent: false,
    backfill: { enabled: true, windowMs: 3_600_000, policy: 'fire-once' },
  },
);

export default %%TRIGGER_EXPORT%%;
`,
  tokens: ['CRON', 'TIMEZONE_LINE', 'TRIGGER_EXPORT', 'TRIGGER_ID'] as const,
});
