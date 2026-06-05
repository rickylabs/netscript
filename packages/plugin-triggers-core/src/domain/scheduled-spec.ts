import type { TriggerBackfillSpec } from './trigger-spec.ts';

/** Cron expression accepted by scheduled trigger definitions. */
export type CronExpression = string & { readonly __brand?: 'CronExpression' };

/** Static scheduled trigger spec consumed by scheduler ports and builders. */
export type ScheduledTriggerSpec = Readonly<{
  cron: CronExpression;
  timezone?: string;
  persistent?: boolean;
  backfill?: TriggerBackfillSpec;
}>;
