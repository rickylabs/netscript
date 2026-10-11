import { assert, assertEquals, assertThrows } from '@std/assert';
import type { TelemetrySpan } from '@netscript/telemetry/query';
import { assertWorkersConcurrency, readWorkersConcurrency } from './verify-workers-concurrency.ts';

function execution(concurrency?: number): TelemetrySpan {
  return {
    traceId: 'generated-worker-proof',
    spanId: 'completed-job',
    name: 'job.execute',
    kind: 'internal',
    startTimeUnixMs: 0,
    statusCode: 1,
    attributes: {
      'netscript.job.id': 'health-check',
      ...(concurrency === undefined ? {} : { 'netscript.worker.concurrency': concurrency }),
    },
    events: [],
    links: [],
  };
}

Deno.test('generated workers receipt accepts declared concurrency on a completed health-check', () => {
  const span = execution(2);
  assertEquals(assertWorkersConcurrency([span], 2), span);
});

Deno.test('generated workers receipt rejects main telemetry without concurrency', () => {
  assertThrows(() => assertWorkersConcurrency([execution()], 2), Error, 'observed=undefined');
});

Deno.test('generated workers receipt rejects silent runtime fallback to one', () => {
  assertThrows(() => assertWorkersConcurrency([execution(1)], 2), Error, 'declared=2, observed=1');
});

Deno.test('generated workers receipt requires execution evidence and rejects mixed values', () => {
  assertThrows(() => assertWorkersConcurrency([], 2), Error, 'No generated health-check');
  assertThrows(
    () => assertWorkersConcurrency([execution(1), execution(2)], 2),
    Error,
    'observed=1',
  );
});

Deno.test('runtime tiers execute the generated concurrency receipt after the health-check job', async () => {
  const { resolveSuite } = await import('../../../presentation/cli/suites/registry.ts');
  for (const database of ['postgres', 'sqlite'] as const) {
    const suite = resolveSuite('scaffold.runtime', { database });
    const ids = suite.gates.map((gate) => String(gate.id));
    assert(ids.indexOf('behavior.workers-executions') >= 0);
    assert(
      ids.indexOf('behavior.workers-concurrency') > ids.indexOf('behavior.workers-executions'),
    );
    assertEquals(ids.filter((id) => id === 'behavior.workers-concurrency').length, 1);
    const gate = suite.gates.find((gate) => gate.id === 'behavior.workers-concurrency');
    assert(gate?.kind === 'command');
    assertEquals(gate.critical, true);
  }
});

Deno.test('workers receipt reads appsettings from the generated project root', async () => {
  const projectRoot = await Deno.makeTempDir();
  try {
    const settings = JSON.parse(
      await Deno.readTextFile(
        new URL('../../../../../../aspire/tests/_fixtures/appsettings.json', import.meta.url),
      ),
    );
    settings.NetScript.BackgroundProcessors.workers = {
      Entrypoint: 'workers/main.ts',
      Concurrency: 2,
      ConcurrencyEnvVar: 'WORKERS_CONCURRENCY',
    };
    await Deno.writeTextFile(`${projectRoot}/appsettings.json`, JSON.stringify(settings));
    const entry = await readWorkersConcurrency(projectRoot);
    assertEquals(entry.Concurrency, 2);
    assertEquals(entry.ConcurrencyEnvVar, 'WORKERS_CONCURRENCY');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
