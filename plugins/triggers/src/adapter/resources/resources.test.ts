import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { triggersAdapterPlugin } from '../plugin.ts';
import {
  DEFAULT_WEBHOOK_INPUT,
  fileWatchScaffolder,
  scheduledScaffolder,
  webhookScaffolder,
} from './mod.ts';
import { webhookStub } from './webhook/webhook.stub.ts';

const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'contracts/',
  'src/runtime/',
  'src/aspire/',
  'bin/',
  'scaffold.plugin.json',
  'deno.json',
] as const;

Deno.test('triggers install starter webhook enqueues the workers health-check job', () => {
  const installWebhook = collectInstallArtifacts(triggersAdapterPlugin).find((artifact) =>
    artifact.path === 'triggers/generic-inbound-webhook.ts'
  );
  const addWebhook = webhookScaffolder.emit(DEFAULT_WEBHOOK_INPUT)[0];

  assertEquals(installWebhook?.path, addWebhook.path);
  assertEquals(installWebhook ? artifactText(installWebhook) : undefined, artifactText(addWebhook));
  assertStringIncludes(artifactText(addWebhook), "id: 'inbound/generic'");
  assertStringIncludes(artifactText(addWebhook), 'enqueueJob');
  assertStringIncludes(artifactText(addWebhook), 'workers-plugin-health-check');
});

Deno.test('triggers add resources emit the same shape at user-named paths', () => {
  const [webhook] = webhookScaffolder.emit({ id: 'payment-webhook', path: 'payments' });
  const [scheduled] = scheduledScaffolder.emit({ id: 'nightly-rollup', cron: '0 1 * * *' });
  const [fileWatch] = fileWatchScaffolder.emit({ id: 'incoming-ledger' });

  assertEquals(webhook.path, 'triggers/payment-webhook-trigger.ts');
  assertEquals(scheduled.path, 'triggers/nightly-rollup-trigger.ts');
  assertEquals(fileWatch.path, 'triggers/incoming-ledger-trigger.ts');
  assertStringIncludes(artifactText(webhook), 'paymentWebhookTrigger');
  assertStringIncludes(artifactText(scheduled), 'nightlyRollupTrigger');
  assertStringIncludes(artifactText(fileWatch), 'incomingLedgerTrigger');
});

Deno.test('triggers install emits only userland glue under triggers', () => {
  const artifacts = collectInstallArtifacts(triggersAdapterPlugin);

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'triggers/generic-inbound-webhook.ts',
    'triggers/daily-maintenance.ts',
    'triggers/incoming-file-watch.ts',
    'triggers/mod.ts',
    'triggers/runtime.ts',
  ]);
  for (const artifact of artifacts) {
    assertEquals(artifact.path.startsWith('triggers/'), true);
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assertEquals(
        artifact.path.includes(forbidden),
        false,
        `artifact ${artifact.path} must not contain ${forbidden}`,
      );
    }
  }
});

Deno.test('triggers resources preserve supported trigger sub-kinds', () => {
  assertStringIncludes(artifactText(webhookScaffolder.emit({ id: 'a' })[0]), 'defineWebhook');
  assertStringIncludes(
    artifactText(fileWatchScaffolder.emit({ id: 'b' })[0]),
    'defineFileWatch',
  );
  assertStringIncludes(
    artifactText(scheduledScaffolder.emit({ id: 'c' })[0]),
    'defineScheduledTrigger',
  );
});

Deno.test('triggers resource token map rejects misspelled tokens at compile time', () => {
  // @ts-expect-error TRIGGER_EXPORT is required by webhookStub.
  substituteTokens(webhookStub, {
    PATH: 'broken',
    SECRET_ENV_LINE: '',
    TRIGGER_ID: 'broken',
  });
  assertEquals(true, true);
});
