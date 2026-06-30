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
import { starterWebhookStub, webhookStub } from './webhook.stub.ts';

/** Canonical starter webhook input emitted during triggers install. */
export const DEFAULT_WEBHOOK_INPUT: WebhookInput = {
  id: 'inbound/generic',
  fileName: 'generic-inbound-webhook',
  path: 'inbound/generic',
};

/** Unified webhook trigger item scaffolder used by install and add webhook. */
export const webhookScaffolder: ItemScaffolder<WebhookInput> = {
  name: 'webhook',
  emit(input: WebhookInput): readonly ScaffoldArtifact[] {
    const stub = isDefaultWebhookInput(input) ? starterWebhookStub : webhookStub;
    return [
      textArtifact(
        triggerPath(input),
        substituteTokens(stub, {
          PATH: input.path ?? `/webhooks/${input.id}`,
          SECRET_ENV_LINE: input.secretEnv
            ? `,\n    secretEnv: ${JSON.stringify(input.secretEnv)}`
            : '',
          TRIGGER_EXPORT: `${exportStem(input.id)}Trigger`,
          TRIGGER_ID: input.id,
          VERIFIER: input.secretEnv ? 'hmac-sha256' : 'memory',
        }),
      ),
    ];
  },
};

function isDefaultWebhookInput(input: WebhookInput): boolean {
  return input.id === DEFAULT_WEBHOOK_INPUT.id &&
    input.fileName === DEFAULT_WEBHOOK_INPUT.fileName &&
    input.path === DEFAULT_WEBHOOK_INPUT.path &&
    input.secretEnv === undefined;
}

/** Webhook trigger plugin resource descriptor. */
export const webhookResource: PluginResource<WebhookInput> = {
  name: 'webhook',
  scaffolder: webhookScaffolder,
  defaultInput: DEFAULT_WEBHOOK_INPUT,
  parseInput: parseWebhookInput,
};
