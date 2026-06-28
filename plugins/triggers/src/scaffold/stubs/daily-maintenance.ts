/**
 * Sample scheduled trigger emitted into a user workspace at `triggers/daily-maintenance.ts`.
 *
 * This file is shipped as a real, type-checked stub inside `@netscript/plugin-triggers` and is
 * copied verbatim into the user's workspace by `plugin add triggers`. The user owns and edits it;
 * the scaffolder never rewrites it after the first scaffold. Keep it minimal, dependency-direction
 * clean (import only the published runtime core `@netscript/plugin-triggers-core/builders`), and
 * free of scaffold-time tokens so it can be emitted with no interpolation.
 *
 * @module
 */

import { defineScheduledTrigger } from '@netscript/plugin-triggers-core/builders';
import type {
  ScheduledTriggerDefinition,
  ScheduledTriggerPayload,
  TriggerContext,
  TriggerEvent,
} from '@netscript/plugin-triggers-core/domain';

/**
 * A starter scheduled (cron) trigger. Replace the handler body with your own recurring logic; the
 * `default` export and the `@netscript/plugin-triggers-core` import are all the triggers runtime
 * needs to discover and run it.
 */
export const dailyMaintenanceTrigger: ScheduledTriggerDefinition<
  'daily-maintenance',
  TriggerEvent<'scheduled', ScheduledTriggerPayload>,
  TriggerContext
> = defineScheduledTrigger(
  // deno-lint-ignore require-await -- starter handler; the runtime contract is async.
  async () => {
    return [];
  },
  {
    id: 'daily-maintenance' as const,
    cron: '0 3 * * *',
    persistent: false,
    backfill: { enabled: true, windowMs: 3_600_000, policy: 'fire-once' },
  },
);

export default dailyMaintenanceTrigger;
