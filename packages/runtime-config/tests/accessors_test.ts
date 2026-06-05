import { assertEquals } from 'jsr:@std/assert';
import {
  getJobOverride,
  getRuntimeTask,
  getSagaOverride,
  getTriggerOverride,
  isFeatureEnabled,
  type RuntimeConfig,
} from '../mod.ts';

const CONFIG: RuntimeConfig = {
  jobs: [{ id: 'cleanup', enabled: false }],
  sagas: [{ id: 'registration', timeout: 120000 }],
  triggers: [{ id: 'inbox', paths: ['./incoming'] }],
  features: [{ id: 'new-routing', enabled: false }],
  tasks: [{
    id: 'daily-report',
    name: 'Daily report',
    runtime: 'deno',
    entrypoint: './tasks/daily-report.ts',
  }],
};

Deno.test('accessors: resolve overrides by identifier', () => {
  assertEquals(getJobOverride(CONFIG, 'cleanup')?.enabled, false);
  assertEquals(getSagaOverride(CONFIG, 'registration')?.timeout, 120000);
  assertEquals(getTriggerOverride(CONFIG, 'inbox')?.paths, ['./incoming']);
  assertEquals(getRuntimeTask(CONFIG, 'daily-report')?.entrypoint, './tasks/daily-report.ts');
});

Deno.test('accessors: return undefined for missing identifiers', () => {
  assertEquals(getJobOverride(CONFIG, 'missing'), undefined);
  assertEquals(getSagaOverride(CONFIG, 'missing'), undefined);
  assertEquals(getTriggerOverride(CONFIG, 'missing'), undefined);
  assertEquals(getRuntimeTask(CONFIG, 'missing'), undefined);
});

Deno.test('isFeatureEnabled: uses explicit flag value or default fallback', () => {
  assertEquals(isFeatureEnabled(CONFIG, 'new-routing'), false);
  assertEquals(isFeatureEnabled(CONFIG, 'missing'), true);
  assertEquals(isFeatureEnabled(CONFIG, 'missing', false), false);
});
