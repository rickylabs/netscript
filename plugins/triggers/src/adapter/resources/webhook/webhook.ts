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
    const job = input.job === undefined
      ? undefined
      : enqueueJobSource(input.job, 'event.payload.body');
    return [
      textArtifact(
        triggerPath(input),
        substituteTokens(stub, {
          BUILDER_IMPORTS: job === undefined ? 'defineWebhook' : 'defineWebhook, enqueueJob',
          HANDLER: job?.handler ?? emptyHandler(),
          JOB_BLOCK: job?.definition ?? '',
          JOB_IMPORT: job?.import ?? '',
          METADATA_LINES: metadataLines(input.description, input.tags),
          PATH: input.path ?? `/webhooks/${input.id}`,
          SECRET_ENV_LINE: input.secretEnv
            ? `,\n    secretEnv: ${JSON.stringify(input.secretEnv)}`
            : '',
          TRIGGER_EXPORT: `${exportStem(input.id)}Trigger`,
          TRIGGER_ID: input.id,
          VERIFIER: input.verifier ?? (input.secretEnv ? 'hmac-sha256' : 'memory'),
        }),
      ),
    ];
  },
};

function enqueueJobSource(
  jobId: string,
  payload: string,
): Readonly<{ import: string; definition: string; handler: string }> {
  const symbol = `${exportStem(jobId)}Job`;
  const literal = JSON.stringify(jobId);
  return {
    import: "import type { JobDefinition } from '@netscript/plugin-workers-core';\n",
    definition:
      `\nconst ${symbol} = {\n  id: ${literal} as JobDefinition<${literal}>['id'],\n  name: ${literal},\n  topic: 'default',\n} satisfies JobDefinition<${literal}>;\n`,
    handler:
      `(event) =>\n    Promise.resolve([\n      enqueueJob(${symbol}, { payload: ${payload} }),\n    ])`,
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
