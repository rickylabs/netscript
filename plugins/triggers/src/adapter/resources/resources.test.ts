import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { getActiveProvider, getKv, resetKv } from '@netscript/kv';
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
  assertEquals(artifactText(scheduled).includes('persistent'), false);
  assertEquals(artifactText(scheduled).includes('backfill'), false);
  assertStringIncludes(artifactText(fileWatch), 'incomingLedgerTrigger');
});

Deno.test('add webhook job wiring emits a typed enqueue action and metadata', async () => {
  const [artifact] = webhookScaffolder.emit({
    id: 'shipping-status',
    path: 'shipping/status',
    verifier: 'hmac-sha256',
    secretEnv: 'WEBHOOK_SHIPPING_SECRET',
    job: 'process-shipping-update',
    description: 'Processes carrier callbacks.',
    tags: ['webhook', 'shipping'],
  });
  const source = artifactText(artifact);

  assertStringIncludes(source, 'defineWebhook, enqueueJob');
  assertStringIncludes(source, "JobDefinition<'process-shipping-update'>");
  assertStringIncludes(source, 'enqueueJob(processShippingUpdateJob');
  assertStringIncludes(source, "verifier: 'hmac-sha256'");
  assertStringIncludes(source, "secretEnv: 'WEBHOOK_SHIPPING_SECRET'");
  assertStringIncludes(source, "description: 'Processes carrier callbacks.'");
  assertStringIncludes(source, "tags: ['webhook', 'shipping']");

  const definition = await importGeneratedDefinition(source);
  const actions = await definition.handler({ payload: { body: { shipmentId: 's-1' } } });
  assertEquals(actions[0]?.kind, 'enqueue-job');
  assertEquals(actions[0]?.jobId, 'process-shipping-update');
  assertEquals(actions[0]?.options.payload, { shipmentId: 's-1' });
});

Deno.test('add scheduled job wiring emits a compiling typed enqueue action', async () => {
  const [artifact] = scheduledScaffolder.emit({
    id: 'nightly-rollup',
    cron: '0 2 * * 1',
    timezone: 'Europe/Zurich',
    job: 'roll-up-ledger',
    description: 'Rolls up the weekly ledger.',
    tags: ['scheduled', 'ledger'],
  });
  const source = artifactText(artifact);

  assertStringIncludes(source, 'defineScheduledTrigger, enqueueJob');
  assertStringIncludes(source, 'enqueueJob(rollUpLedgerJob');
  assertStringIncludes(source, "cron: '0 2 * * 1'");
  assertStringIncludes(source, "timezone: 'Europe/Zurich'");

  const definition = await importGeneratedDefinition(source);
  const payload = { scheduledAt: '2026-07-13T00:00:00.000Z' };
  const actions = await definition.handler({ payload });
  assertEquals(actions[0]?.kind, 'enqueue-job');
  assertEquals(actions[0]?.jobId, 'roll-up-ledger');
  assertEquals(actions[0]?.options.payload, payload);
});

Deno.test('triggers install starter sources are format-stable at generator boundaries', () => {
  const artifacts = collectInstallArtifacts(triggersAdapterPlugin);
  const scheduled = artifacts.find((artifact) => artifact.path === 'triggers/daily-maintenance.ts');
  const fileWatch = artifacts.find((artifact) =>
    artifact.path === 'triggers/incoming-file-watch.ts'
  );

  assertEquals(artifactText(scheduled!).includes("domain';\n\n\n/**"), false);
  assertStringIncludes(artifactText(fileWatch!), "paths: ['./shared/incoming']");
  assertStringIncludes(artifactText(fileWatch!), "patterns: ['*.json', '*.csv']");
  assertStringIncludes(artifactText(fileWatch!), "ignored: ['*.tmp', '.*']");
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

Deno.test('generated triggers runtime activates the selected Redis adapter', async () => {
  const runtimeArtifact = collectInstallArtifacts(triggersAdapterPlugin).find((artifact) =>
    artifact.path === 'triggers/runtime.ts'
  );
  if (!runtimeArtifact) {
    throw new Error('triggers install must emit triggers/runtime.ts');
  }

  const previousProvider = Deno.env.get('CACHE_PROVIDER');
  const previousRedisUri = Deno.env.get('REDIS_URI');
  const path = await Deno.makeTempFile({
    dir: new URL('.', import.meta.url).pathname,
    prefix: 'generated-triggers-runtime-',
    suffix: '.ts',
  });

  try {
    await resetKv();
    Deno.env.set('CACHE_PROVIDER', 'redis');
    Deno.env.set('REDIS_URI', 'redis://127.0.0.1:6379');
    await Deno.writeTextFile(path, artifactText(runtimeArtifact));

    // Import from inside this generated workspace so the glue and assertion resolve the same
    // @netscript/kv module instance. Importing the emitted source must perform real registration;
    // merely containing the provider import text is insufficient.
    await import(`${new URL(`file://${path}`).href}?test=${crypto.randomUUID()}`);
    await getKv();
    assertEquals(getActiveProvider(), 'redis');
  } finally {
    await resetKv();
    restoreEnvironment('CACHE_PROVIDER', previousProvider);
    restoreEnvironment('REDIS_URI', previousRedisUri);
    await Deno.remove(path);
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

type GeneratedDefinition = Readonly<{
  handler(event: Readonly<{ payload: unknown }>): Promise<
    readonly Readonly<{
      kind: string;
      jobId: string;
      options: Readonly<{ payload?: unknown }>;
    }>[]
  >;
}>;

async function importGeneratedDefinition(source: string): Promise<GeneratedDefinition> {
  const path = await Deno.makeTempFile({
    dir: new URL('.', import.meta.url).pathname,
    prefix: 'generated-trigger-',
    suffix: '.ts',
  });
  try {
    await Deno.writeTextFile(path, source);
    const module = await import(`${new URL(`file://${path}`).href}?test=${crypto.randomUUID()}`);
    return module.default as GeneratedDefinition;
  } finally {
    await Deno.remove(path);
  }
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    Deno.env.delete(name);
  } else {
    Deno.env.set(name, value);
  }
}
