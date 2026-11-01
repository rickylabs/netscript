/** Captures native HTTP records in bounded children without sharing logger/runtime singletons. */
import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { createRuntimeSandbox } from './service-runtime-fixture.ts';

/** Run each factory's real listener with omitted and independently configured levels. */
export async function assertPluginRequestLogging(
  owner: string,
  imports: string,
  setup: string,
  start: string,
  cleanup = '',
  startupListeners = 0,
): Promise<void> {
  await using sandbox = await createRuntimeSandbox('request-logging');
  const root = fromFileUrl(new URL('../../../../', import.meta.url));
  const allocatedPorts = Array.from({ length: startupListeners }, () => {
    using listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    return listener.addr.port;
  });
  const source = `
import { assertEquals } from '@std/assert';
import { configure, markConfigured, resetLogging, type LogRecord } from '@netscript/logger';
${imports}
const scratch = ${JSON.stringify(sandbox.scratch)};
Deno.chdir(scratch);
const allocatedPorts = ${JSON.stringify(allocatedPorts)};
const records: LogRecord[] = [];
await configure({
  reset: true,
  sinks: { memory: (record: LogRecord) => records.push(record) },
  loggers: [
    { category: ['netscript', 'services', '${owner}'], sinks: ['memory'], lowestLevel: 'debug' },
    { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
  ],
});
markConfigured();
${setup}
try {
  for (const options of [
    {},
    { requestLevel: 'info' as const },
    { responseLevel: 'info' as const },
    { requestLevel: 'debug' as const, responseLevel: 'debug' as const },
    { requestLevel: 'info' as const, responseLevel: 'info' as const },
  ]) {
    const running = await (${start});
    try {
      const origin = 'http://127.0.0.1:' + running.addr.port;
      records.length = 0;
      const response = await fetch(origin + '/');
      assertEquals(response.status, 200);
      await response.body?.cancel();
      const http = records.filter((record) => record.properties.path === '/');
      assertEquals(http.map((record) => [record.rawMessage, record.level]), [
        ['HTTP request started', options.requestLevel ?? 'debug'],
        ['HTTP request completed', options.responseLevel ?? 'debug'],
      ]);
      records.length = 0;
      const health = await fetch(origin + '/health/live');
      await health.body?.cancel();
      assertEquals(records.filter((record) => record.properties.path === '/health/live'), []);
      records.length = 0;
      const missing = await fetch(origin + '/logging-missing-route');
      assertEquals(missing.status, 404);
      await missing.body?.cancel();
      const failed = records.filter((record) => record.properties.path === '/logging-missing-route');
      assertEquals(failed.map((record) => [record.rawMessage, record.level]), [
        ['HTTP request started', options.requestLevel ?? 'debug'],
        ['HTTP request completed', 'warning'],
      ]);
    } finally {
      await running.stop();
    }
  }
} finally {
  ${cleanup}
  await resetLogging();
}
console.log('request logging records verified: ${owner}');
// Factory-owned listeners and test KV are closed above. Process exit bounds plugin singleton
// producers which have no public disposal API; the sandbox always reaps this owned child.
Deno.exit(0);
`;
  const run = await sandbox.run(source, {
    cwd: root,
    preferredPorts: allocatedPorts,
    unstableKv: true,
  });
  assertEquals(run.code, 0, run.stderr + run.stdout);
  assertStringIncludes(run.stdout, `request logging records verified: ${owner}`);
}
