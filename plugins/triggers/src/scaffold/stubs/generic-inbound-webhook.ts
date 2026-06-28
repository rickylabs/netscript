/**
 * Sample webhook trigger emitted into a user workspace at `triggers/generic-inbound-webhook.ts`.
 *
 * This file is shipped as a real, type-checked stub inside `@netscript/plugin-triggers` and is
 * copied verbatim into the user's workspace by `plugin add triggers`. The user owns and edits it;
 * the scaffolder never rewrites it after the first scaffold. Keep it minimal, dependency-direction
 * clean (import only the published runtime core `@netscript/plugin-triggers-core/builders`), and
 * free of scaffold-time tokens so it can be emitted with no interpolation.
 *
 * @module
 */

import { defineWebhook } from '@netscript/plugin-triggers-core/builders';
import type {
  TriggerContext,
  TriggerEvent,
  WebhookDefinition,
  WebhookTriggerPayload,
} from '@netscript/plugin-triggers-core/domain';

/**
 * A starter inbound-webhook trigger. Replace the handler body with your own ingress logic; the
 * `default` export and the `@netscript/plugin-triggers-core` import are all the triggers runtime
 * needs to discover and run it.
 */
export const genericInboundWebhookTrigger: WebhookDefinition<
  'generic-inbound-webhook',
  TriggerEvent<'webhook', WebhookTriggerPayload<unknown>>,
  TriggerContext
> = defineWebhook(
  // deno-lint-ignore require-await -- starter handler; the runtime contract is async.
  async () => {
    return [];
  },
  {
    id: 'generic-inbound-webhook' as const,
    path: 'inbound/generic',
    verifier: 'hmac-sha256',
  },
);

export default genericInboundWebhookTrigger;
