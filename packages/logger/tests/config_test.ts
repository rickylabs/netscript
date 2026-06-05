import { assert, assertEquals } from '@std/assert';
import { configureLogging, ensureLogging, isLoggingConfigured, resetLogging } from '../mod.ts';

Deno.test('configureLogging marks logging as configured', async () => {
  await resetLogging();
  assertEquals(isLoggingConfigured(), false);

  await configureLogging({ format: 'text', level: 'info' });

  assertEquals(isLoggingConfigured(), true);

  await resetLogging();
});

Deno.test('resetLogging clears configured state for later ensureLogging calls', async () => {
  await ensureLogging({ format: 'text', level: 'info' });
  assertEquals(isLoggingConfigured(), true);

  await resetLogging();
  assertEquals(isLoggingConfigured(), false);

  await ensureLogging({ format: 'text', level: 'debug' });
  assert(isLoggingConfigured());

  await resetLogging();
});
