import { assertEquals } from '@std/assert';
import {
  createChildLogger,
  createJobLogger,
  createLogger,
  createPackageLogger,
  createServiceLogger,
  createWorkerLogger,
} from '../mod.ts';

Deno.test('logger creators produce expected categories', () => {
  assertEquals(createServiceLogger('users').category, ['netscript', 'services', 'users']);
  assertEquals(createPackageLogger('kv').category, ['netscript', 'packages', 'kv']);
  assertEquals(createWorkerLogger('executor').category, ['netscript', 'workers', 'executor']);
  assertEquals(createJobLogger('daily-export').category, ['netscript', 'jobs', 'daily-export']);
  assertEquals(createLogger('custom').category, ['netscript', 'custom']);
  assertEquals(createLogger(['custom', 'leaf']).category, ['custom', 'leaf']);
});

Deno.test('createChildLogger uses the parent category', () => {
  const parent = createServiceLogger('users');
  const child = createChildLogger(parent, 'getById');

  assertEquals(child.category, ['netscript', 'services', 'users', 'getById']);
});
