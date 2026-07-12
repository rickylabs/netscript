import { assertEquals, assertExists } from '@std/assert';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import { LocalTriggersRuntimeBackend } from '../../src/cli/local-runtime-backend.ts';
import { TriggersCli } from '../../src/cli/triggers-cli.ts';
import type {
  TriggerEnabledResponse,
  TriggerEventPage,
  TriggerEventQuery,
  TriggerRuntimeState,
  TriggersServiceClient,
} from '../../src/cli/http-triggers-service.ts';
import type { TriggerInspectionEntry } from '../../src/cli/triggers-cli-backend-support.ts';
import { updateTriggerSource } from '../../src/cli/trigger-source-editor.ts';

Deno.test('local triggers backend round-trips update, preview, remove, and persisted events', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-triggers-cli-' });
  const files = new LocalProjectFiles(root);
  const service = new RecordingTriggersService();
  const cli = new TriggersCli(new LocalTriggersRuntimeBackend({ files, service }));

  try {
    const added = await run(cli, {
      command: 'add-scheduled',
      values: ['weekly-rollup'],
      flags: { cron: '0 1 * * *', timezone: 'UTC', job: 'roll-up-ledger' },
    });
    assertEquals(added.code, 0);

    const mondayUpdate = await run(cli, {
      command: 'update',
      values: ['weekly-rollup'],
      flags: {
        cron: '0 2 * * 1',
        timezone: 'UTC',
        description: 'Weekly ledger rollup.',
        tags: 'scheduled,ledger',
      },
    });
    assertEquals(mondayUpdate.code, 0);

    const listed = await run(cli, { command: 'list' });
    const listedData = listed.data as { triggers: TriggerInspectionEntry[] };
    assertEquals(listedData.triggers, [{
      id: 'weekly-rollup',
      kind: 'scheduled',
      file: 'triggers/weekly-rollup-trigger.ts',
      cron: '0 2 * * 1',
      timezone: 'UTC',
      path: undefined,
      verifier: undefined,
      secretEnv: undefined,
      description: 'Weekly ledger rollup.',
      tags: ['scheduled', 'ledger'],
    }]);

    const mondayPreview = await run(cli, {
      command: 'preview',
      values: ['weekly-rollup'],
      flags: { count: 3 },
    });
    const mondayTimes = (mondayPreview.data as { fireTimes: string[] }).fireTimes.map((value) =>
      new Date(value)
    );
    assertEquals(mondayTimes.length, 3);
    assertEquals(mondayTimes.every((date) => date.getUTCDay() === 1), true);
    assertEquals(mondayTimes.every((date) => date.getUTCHours() === 2), true);

    const monthDayUpdate = await run(cli, {
      command: 'update',
      values: ['weekly-rollup'],
      flags: { cron: '30 4 15 * *' },
    });
    assertEquals(monthDayUpdate.code, 0);
    const monthDayPreview = await run(cli, {
      command: 'preview',
      values: ['weekly-rollup'],
      flags: { count: 2 },
    });
    const monthDayTimes = (monthDayPreview.data as { fireTimes: string[] }).fireTimes.map((value) =>
      new Date(value)
    );
    assertEquals(monthDayTimes.length, 2);
    assertEquals(monthDayTimes.every((date) => date.getUTCDate() === 15), true);
    assertEquals(monthDayTimes.every((date) => date.getUTCHours() === 4), true);
    assertEquals(monthDayTimes.every((date) => date.getUTCMinutes() === 30), true);

    const events = await run(cli, {
      command: 'events',
      values: ['weekly-rollup'],
      flags: { status: 'completed', limit: 7, json: true },
    });
    assertEquals(events.code, 0);
    assertEquals(service.eventQueries, [{
      triggerId: 'weekly-rollup',
      status: 'completed',
      limit: 7,
    }]);
    assertEquals((events.data as { total: number; format: string }).total, 1);
    assertEquals((events.data as { total: number; format: string }).format, 'json');

    const removed = await run(cli, { command: 'remove', values: ['weekly-rollup'] });
    assertEquals(removed.code, 0);
    assertEquals(await files.readTextFile('triggers/weekly-rollup-trigger.ts'), undefined);
    const registry = removed.data as { registry?: { triggerCount?: number } };
    assertEquals(registry.registry?.triggerCount, 0);
    assertExists(
      await files.readTextFile('.netscript/generated/plugin-triggers/triggers.registry.ts'),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('local triggers backend updates webhook security fields without changing job wiring', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-triggers-webhook-cli-' });
  const files = new LocalProjectFiles(root);
  const cli = new TriggersCli(
    new LocalTriggersRuntimeBackend({ files, service: new RecordingTriggersService() }),
  );

  try {
    assertEquals(
      (await run(cli, {
        command: 'add-webhook',
        values: ['payment-webhook'],
        flags: { path: 'payments/old', job: 'capture-payment' },
      })).code,
      0,
    );
    assertEquals(
      (await run(cli, {
        command: 'update',
        values: ['payment-webhook'],
        flags: {
          path: 'payments/inbound',
          verifier: 'hmac-sha256',
          'secret-env': 'PAYMENT_WEBHOOK_SECRET',
          description: 'Verified payment callbacks.',
          tags: 'webhook,payments',
        },
      })).code,
      0,
    );

    const listed = await run(cli, { command: 'list' });
    const triggers = (listed.data as { triggers: TriggerInspectionEntry[] }).triggers;
    assertEquals(triggers[0], {
      id: 'payment-webhook',
      kind: 'webhook',
      file: 'triggers/payment-webhook-trigger.ts',
      cron: undefined,
      timezone: undefined,
      path: 'payments/inbound',
      verifier: 'hmac-sha256',
      secretEnv: 'PAYMENT_WEBHOOK_SECRET',
      description: 'Verified payment callbacks.',
      tags: ['webhook', 'payments'],
    });
    const source = await files.readTextFile('triggers/payment-webhook-trigger.ts');
    assertExists(source);
    assertEquals(source.includes('enqueueJob(capturePaymentJob'), true);
    assertEquals(source.includes('id: "capture-payment" as JobDefinition'), true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('trigger source updates replace multiline tags without leaving stale syntax', () => {
  const source = `export default defineWebhook(() => Promise.resolve([]), {
  id: 'payment-webhook',
  path: 'payments',
  verifier: 'memory',
  tags: [
    'old',
    'payments',
  ],
});
`;
  const updated = updateTriggerSource(source, 'webhook', { tags: ['verified', 'payments'] });
  assertEquals(updated.includes("'old'"), false);
  assertEquals(updated.includes('tags: ["verified","payments"],'), true);
});

async function run(cli: TriggersCli, args: PluginCliArgs): Promise<PluginCliResult> {
  const command = cli.commands().find((candidate) => candidate.name === args.command);
  assertExists(command);
  return await command.run(args);
}

class RecordingTriggersService implements TriggersServiceClient {
  readonly eventQueries: TriggerEventQuery[] = [];

  listTriggers(_enabled?: boolean): Promise<readonly TriggerRuntimeState[]> {
    return Promise.resolve([]);
  }

  listEvents(query: TriggerEventQuery = {}): Promise<TriggerEventPage> {
    this.eventQueries.push(query);
    return Promise.resolve({
      events: [persistedEvent()],
      total: 1,
      limit: query.limit ?? 50,
      offset: 0,
    });
  }

  setEnabled(id: string, enabled: boolean): Promise<TriggerEnabledResponse> {
    return Promise.resolve({ id, enabled });
  }
}

function persistedEvent(): TriggerEvent {
  return {
    id: 'evt-cli-ledger' as TriggerEventId,
    triggerId: 'weekly-rollup' as TriggerId,
    kind: 'scheduled',
    status: 'completed',
    payload: {
      scheduledAt: '2026-07-06T02:00:00.000Z',
      firedAt: '2026-07-06T02:00:00.000Z',
      cron: '0 2 * * 1',
      timezone: 'UTC',
    },
    attempt: 0,
    detectedAt: '2026-07-06T02:00:00.000Z',
    updatedAt: '2026-07-06T02:00:01.000Z',
  };
}
