/** Webhook trigger resource scaffolder.
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
import { exportStem, parseWebhookInput, triggerPath, type WebhookInput } from '../input.ts';
import { webhookStub } from './webhook.stub.ts';

/** Canonical starter webhook input emitted during triggers install. */
export const DEFAULT_WEBHOOK_INPUT: WebhookInput = {
  id: 'generic-inbound-webhook',
  fileName: 'generic-inbound-webhook',
  path: 'inbound/generic',
};

/** Unified webhook trigger item scaffolder used by install and add webhook. */
export const webhookScaffolder: ItemScaffolder<WebhookInput> = {
  name: 'webhook',
  emit(input: WebhookInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        triggerPath(input),
        substituteTokens(webhookStub, {
          PATH: input.path ?? `/webhooks/${input.id}`,
          SECRET_ENV_LINE: input.secretEnv
            ? `,\n    secretEnv: ${JSON.stringify(input.secretEnv)}`
            : '',
          TRIGGER_EXPORT: `${exportStem(input.id)}Trigger`,
          TRIGGER_ID: input.id,
        }),
      ),
    ];
  },
};

/** Webhook trigger plugin resource descriptor. */
export const webhookResource: PluginResource<WebhookInput> = {
  name: 'webhook',
  scaffolder: webhookScaffolder,
  defaultInput: DEFAULT_WEBHOOK_INPUT,
  parseInput: parseWebhookInput,
};
