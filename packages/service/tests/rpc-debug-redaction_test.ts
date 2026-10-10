import { assertEquals, assertExists } from '@std/assert';
import { configure, type LogRecord, resetLogging } from '@netscript/logger';
import { os } from '@orpc/server';
import { createService } from '../mod.ts';

Deno.test('withRPC threads redactFields to the debug RPC logging plugin', async () => {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: ['netscript', 'services', 'redaction'], sinks: ['memory'], lowestLevel: 'debug' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  try {
    const router = { save: os.handler(() => ({ saved: true })) };
    const app = createService(router, { name: 'redaction' })
      .withRPC({ debug: true, redactFields: ['brief'] })
      .build();

    const response = await app.request('/api/rpc/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: { brief: 'private brief', handle: 'h', title: 'visible' } }),
    });
    assertEquals(response.status, 200);
    await response.body?.cancel();

    const started = records.find((record) => record.rawMessage === 'RPC procedure started');
    assertExists(started);
    assertEquals(started.properties.input, {
      brief: '[REDACTED]',
      handle: '[REDACTED]',
      title: 'visible',
    });
  } finally {
    await resetLogging();
  }
});
