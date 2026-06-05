import { assertEquals } from 'jsr:@std/assert';
import { summarizeRuntimeConfig, type RuntimeConfig } from '../mod.ts';

Deno.test('summarizeRuntimeConfig: returns structured disabled override summary', async () => {
  await withRuntimeDir(async (dir) => {
    const config: RuntimeConfig = {
      jobs: [{ id: 'cleanup', enabled: false }],
      sagas: [{ id: 'registration', enabled: false }],
      triggers: [{ id: 'inbox', enabled: false, paths: ['./incoming', './retry'] }],
      features: [{ id: 'new-routing', enabled: false }],
      tasks: [],
    };

    const summary = summarizeRuntimeConfig(config, '[test]');

    assertEquals(summary.sourceDir, dir);
    assertEquals(summary.disabledJobs, ['cleanup']);
    assertEquals(summary.disabledSagas, ['registration']);
    assertEquals(summary.disabledTriggers, ['inbox']);
    assertEquals(summary.disabledFeatures, ['new-routing']);
    assertEquals(summary.triggerPathOverrides, [{
      id: 'inbox',
      paths: ['./incoming', './retry'],
    }]);
    assertEquals(summary.messages, [
      `[test] Loaded from: ${dir}`,
      '[test] Disabled jobs: cleanup',
      '[test] Disabled sagas: registration',
      '[test] Disabled triggers: inbox',
      '[test] Disabled features: new-routing',
      "[test] Trigger 'inbox' paths overridden: ./incoming; ./retry",
    ]);
  });
});

Deno.test('summarizeRuntimeConfig: includes only source message for empty config', async () => {
  await withRuntimeDir(async (dir) => {
    const summary = summarizeRuntimeConfig({
      jobs: [],
      sagas: [],
      triggers: [],
      features: [],
      tasks: [],
    });

    assertEquals(summary.messages, [`[runtime-config] Loaded from: ${dir}`]);
  });
});

async function withRuntimeDir(test: (dir: string) => Promise<void>): Promise<void> {
  const previous = Deno.env.get('NETSCRIPT_RUNTIME_CONFIG_DIR');
  const dir = await Deno.makeTempDir();
  Deno.env.set('NETSCRIPT_RUNTIME_CONFIG_DIR', dir);

  try {
    await test(dir);
  } finally {
    if (previous === undefined) {
      Deno.env.delete('NETSCRIPT_RUNTIME_CONFIG_DIR');
    } else {
      Deno.env.set('NETSCRIPT_RUNTIME_CONFIG_DIR', previous);
    }
    await Deno.remove(dir, { recursive: true });
  }
}
