import { assertEquals } from 'jsr:@std/assert';
import { dirname, join } from '@std/path';
import { loadRuntimeConfig } from '../mod.ts';

Deno.test('loadRuntimeConfig: returns empty defaults when pointer is missing', async () => {
  await withRuntimeDir(async () => {
    const config = await loadRuntimeConfig();

    assertEquals(config, {
      jobs: [],
      sagas: [],
      triggers: [],
      features: [],
      tasks: [],
    });
  });
});

Deno.test('loadRuntimeConfig: loads topic files from JSON pointer', async () => {
  await withRuntimeDir(async (dir) => {
    await writeJson(join(dir, 'current'), {
      version: '1.0.0',
      jobs: 'jobs/v1.0.0.json',
      sagas: 'sagas/v1.0.0.json',
      triggers: 'triggers/v1.0.0.json',
      features: 'features/v1.0.0.json',
      tasks: 'tasks/v1.0.0.json',
    });
    await writeJson(join(dir, 'jobs', 'v1.0.0.json'), {
      overrides: [{ id: 'cleanup', enabled: false }],
    });
    await writeJson(join(dir, 'sagas', 'v1.0.0.json'), {
      overrides: [{ id: 'registration', timeout: 120000 }],
    });
    await writeJson(join(dir, 'triggers', 'v1.0.0.json'), {
      overrides: [{ id: 'inbox', paths: ['./incoming'] }],
    });
    await writeJson(join(dir, 'features', 'v1.0.0.json'), {
      flags: [{ id: 'new-routing', enabled: true }],
    });
    await writeJson(join(dir, 'tasks', 'v1.0.0.json'), {
      tasks: [{
        id: 'daily-report',
        name: 'Daily report',
        runtime: 'deno',
        entrypoint: './tasks/daily-report.ts',
      }],
    });

    const config = await loadRuntimeConfig();

    assertEquals(config.jobs[0].id, 'cleanup');
    assertEquals(config.sagas[0].id, 'registration');
    assertEquals(config.triggers[0].paths, ['./incoming']);
    assertEquals(config.features[0].enabled, true);
    assertEquals(config.tasks[0].runtime, 'deno');
  });
});

Deno.test('loadRuntimeConfig: derives conventional topic files from plain pointer', async () => {
  await withRuntimeDir(async (dir) => {
    await Deno.writeTextFile(join(dir, 'current'), '1.2.3');
    await writeJson(join(dir, 'jobs', 'v1.2.3.json'), {
      overrides: [{ id: 'cleanup', enabled: false }],
    });

    const config = await loadRuntimeConfig();

    assertEquals(config.jobs, [{ id: 'cleanup', enabled: false }]);
    assertEquals(config.features, []);
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

async function writeJson(path: string, value: unknown): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, JSON.stringify(value));
}
