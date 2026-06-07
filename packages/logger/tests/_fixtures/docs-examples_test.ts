import { assert, assertEquals } from '@std/assert';
import {
  configureLogging,
  createJobLogger,
  createPackageLogger,
  createServiceLogger,
  createWorkerLogger,
  isLoggingConfigured,
  resetLogging,
  withContext,
} from '../../mod.ts';
import { loggerMiddleware, type LoggerMiddlewareEnv } from '../../middleware.ts';
import { Hono } from 'hono';

Deno.test('logger docs examples: configure root service logging', async () => {
  await resetLogging();

  await configureLogging({ level: 'info', format: 'text' });

  const logger = createServiceLogger('users');
  logger.info('Service starting', { port: 3000 });

  assert(isLoggingConfigured());
  await resetLogging();
});

Deno.test('logger docs examples: install Hono request middleware', async () => {
  const app = new Hono<LoggerMiddlewareEnv>();

  app.use('*', loggerMiddleware('users'));
  app.get('/health', (ctx) => ctx.json({ ok: true, requestId: ctx.get('requestId') }));

  const response = await app.request('http://localhost/health', {
    headers: { 'X-Request-ID': 'req-docs' },
  });

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { ok: true, requestId: 'req-docs' });
});

Deno.test('logger docs examples: create role-specific categories', async () => {
  await resetLogging();
  await configureLogging({ level: 'debug', format: 'text' });

  const serviceLogger = createServiceLogger('orders');
  const packageLogger = createPackageLogger('kv');
  const workerLogger = createWorkerLogger('email-dispatch');
  const jobLogger = createJobLogger('daily-export');

  serviceLogger.info('Service ready');
  packageLogger.debug('Cache lookup');
  workerLogger.info('Worker listening');
  jobLogger.info('Job accepted');

  assert(isLoggingConfigured());
  await resetLogging();
});

Deno.test('logger docs examples: reset logging state in tests', async () => {
  await resetLogging();
  await configureLogging({ level: 'info', format: 'text' });

  assert(isLoggingConfigured());

  await resetLogging();
  assertEquals(isLoggingConfigured(), false);
});

Deno.test('logger docs examples: propagate context with LogTape', async () => {
  await resetLogging();
  await configureLogging({ level: 'info', format: 'text' });

  const logger = createServiceLogger('payments');

  await withContext(
    { requestId: 'req_123', operation: 'capture' },
    () => {
      logger.info('Payment capture requested');
    },
  );

  assert(isLoggingConfigured());
  await resetLogging();
});

Deno.test('logger docs examples: middleware preserves failure boundary', async () => {
  const app = new Hono<LoggerMiddlewareEnv>();

  app.use('*', loggerMiddleware('billing', { errorLevel: 'error' }));
  app.get('/boom', () => {
    throw new Error('example failure');
  });

  const response = await app.request('http://localhost/boom');

  assertEquals(response.status, 500);
});
