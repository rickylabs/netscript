/**
 * Sample workers task emitted into a user workspace at `workers/tasks/validate-payload.ts`.
 *
 * This file is shipped as a real, type-checked stub inside `@netscript/plugin-workers` and is
 * copied verbatim into the user's workspace by `plugin add workers`. The user owns and edits it;
 * the scaffolder never rewrites it after the first scaffold. Keep it minimal and free of
 * scaffold-time tokens so it can be emitted with no interpolation.
 *
 * @module
 */

import { defineTask, type TaskDefinition } from '@netscript/plugin-workers-core';

/**
 * A starter in-process workers task that echoes its payload back as valid.
 *
 * Replace the handler body with your own task logic; the export name and the
 * `@netscript/plugin-workers-core` import are all the workers runtime needs to discover and run it.
 */
export const validatePayloadTask: TaskDefinition<'validate-payload'> = defineTask(
  'validate-payload',
)
  .handler((context) => {
    return { payload: context.payload, valid: true };
  })
  .build();
