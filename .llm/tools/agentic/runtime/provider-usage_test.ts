import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { copilotLedgerPath, reserveCopilotCredits } from './provider-usage.ts';

Deno.test('Copilot ledger path excludes repository-local accounting', () => {
  assertEquals(
    copilotLedgerPath({ HOME: '/home/test' }, '/work/repo'),
    '/home/test/.config/netscript-agentic/copilot-credits.json',
  );
  assertThrows(() => copilotLedgerPath({ HOME: '/work/repo/user' }, '/work/repo'));
  assertThrows(() => copilotLedgerPath({}, '/work/repo'));
});

Deno.test('Copilot reservations persist caps, roll months, and refuse missing or locked ledgers', async () => {
  const home = await Deno.makeTempDir();
  const env = { HOME: home };
  const path = copilotLedgerPath(env, '/unrelated/repository');
  const now = '2026-09-04T20:00:00Z';
  const options = { env, cap: 100, now, worktree: '/unrelated/repository' };
  try {
    await Deno.mkdir(`${home}/.config/netscript-agentic`, { recursive: true });
    assertEquals((await reserveCopilotCredits(options)).reason, 'usage_unproven');
    await Deno.writeTextFile(
      path,
      JSON.stringify({
        schemaVersion: 1,
        month: '2026-08',
        updatedAt: '2026-08-31T23:59:00Z',
        usedCredits: 7000,
      }),
    );
    assertEquals((await reserveCopilotCredits(options)).allowed, true);
    assertEquals(JSON.parse(await Deno.readTextFile(path)).usedCredits, 100);
    assertEquals((await reserveCopilotCredits(options)).allowed, true);
    assertEquals(JSON.parse(await Deno.readTextFile(path)).usedCredits, 200);
    await Deno.writeTextFile(`${path}.lock`, '');
    await assertRejects(() => reserveCopilotCredits(options), Error, 'unavailable or locked');
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});
import { ROUTING_MODEL_IDS } from '../config/models.ts';
import { fetchOpenCodeGoUsageSnapshot, parseOpenCodeGoUsagePayload } from './provider-usage.ts';

const capturedAt = '2026-09-04T18:00:00.000Z';
const payload = {
  usage: {
    rolling: { status: 'rate-limited', percent: 104.5, resetsAt: 'rolling-reset' },
    weekly: { status: 'ok', percent: 41.8, resetsAt: 'weekly-reset' },
    monthly: { status: 'ok', percent: 20.9, resetsAt: 'monthly-reset' },
  },
};

Deno.test('OpenCode Go live payload normalizes all percentage windows', () => {
  assertEquals(parseOpenCodeGoUsagePayload(payload, capturedAt), {
    provider: 'opencode_go',
    capturedAt,
    percentageWindows: {
      rolling_five_hours: {
        status: 'rate-limited',
        percent: 104.5,
        resetsAt: 'rolling-reset',
      },
      weekly: { status: 'ok', percent: 41.8, resetsAt: 'weekly-reset' },
      monthly: { status: 'ok', percent: 20.9, resetsAt: 'monthly-reset' },
    },
  });
});

Deno.test('OpenCode Go usage fetch authenticates without retaining or reporting the key', async () => {
  const secret = 'opaque-never-report';
  let observedAuthorization = '';
  const snapshot = await fetchOpenCodeGoUsageSnapshot(ROUTING_MODEL_IDS.grok46Go, {
    env: { OPENCODE_API_KEY: secret },
    now: () => capturedAt,
    fetch: (_input, init) => {
      observedAuthorization = new Headers(init?.headers).get('authorization') ?? '';
      return Promise.resolve(Response.json(payload));
    },
  });
  assertEquals(observedAuthorization, `Bearer ${secret}`);
  assertEquals(JSON.stringify(snapshot).includes(secret), false);
});

Deno.test('OpenCode Go usage network, HTTP, and malformed responses fail closed value-free', async () => {
  const common = { env: { OPENCODE_API_KEY: 'opaque-never-report' } };
  await assertRejects(
    () =>
      fetchOpenCodeGoUsageSnapshot(ROUTING_MODEL_IDS.grok46Go, {
        ...common,
        fetch: () => Promise.reject(new Error('secret transport details')),
      }),
    Error,
    'OpenCode Go usage request failed',
  );
  await assertRejects(
    () =>
      fetchOpenCodeGoUsageSnapshot(ROUTING_MODEL_IDS.grok46Go, {
        ...common,
        fetch: () => Promise.resolve(new Response('', { status: 401 })),
      }),
    Error,
    'OpenCode Go usage request returned HTTP 401',
  );
  await assertRejects(
    () =>
      fetchOpenCodeGoUsageSnapshot(ROUTING_MODEL_IDS.grok46Go, {
        ...common,
        fetch: () => Promise.resolve(Response.json({ usage: {} })),
      }),
    Error,
    'OpenCode Go usage response is missing rolling',
  );
});
