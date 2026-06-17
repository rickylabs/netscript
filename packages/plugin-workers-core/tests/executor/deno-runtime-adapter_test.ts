import { assertEquals } from '@std/assert';
import { DenoRuntimeAdapter } from '../../src/executor/mod.ts';
import type { TaskDefinition } from '../../src/domain/mod.ts';

Deno.test('DenoRuntimeAdapter executes a script and captures output', async () => {
  await withCurrentDenoExecutable(async () => {
    const dir = await Deno.makeTempDir();
    const script = `${dir}/echo.ts`;
    await Deno.writeTextFile(
      script,
      'console.log("hello"); console.log(JSON.stringify({ok:true}));',
    );

    const stdout: string[] = [];
    const result = await new DenoRuntimeAdapter().execute(taskFixture(script), {
      args: [],
      cwd: dir,
      env: {},
      timeout: 300000,
      onStdout: (line) => stdout.push(line),
    });

    assertEquals(result.success, true);
    assertEquals(result.exitCode, 0);
    assertEquals(result.result, { ok: true });
    assertEquals(stdout.includes('hello'), true);
  });
});

Deno.test('DenoRuntimeAdapter captures a non-zero exit', async () => {
  await withCurrentDenoExecutable(async () => {
    const dir = await Deno.makeTempDir();
    const script = `${dir}/fail.ts`;
    await Deno.writeTextFile(script, 'console.error("failure line"); Deno.exit(3);');

    const stderr: string[] = [];
    const result = await new DenoRuntimeAdapter().execute(taskFixture(script), {
      args: [],
      cwd: dir,
      env: {},
      timeout: 300000,
      onStderr: (line) => stderr.push(line),
    });

    assertEquals(result.success, false);
    assertEquals(result.exitCode, 3);
    assertEquals(stderr, ['failure line']);
  });
});

async function withCurrentDenoExecutable(fn: () => Promise<void>): Promise<void> {
  const original = Deno.env.get('DENO_EXECUTABLE');
  Deno.env.set('DENO_EXECUTABLE', Deno.execPath());
  try {
    await fn();
  } finally {
    if (original === undefined) {
      Deno.env.delete('DENO_EXECUTABLE');
    } else {
      Deno.env.set('DENO_EXECUTABLE', original);
    }
  }
}

function taskFixture(entrypoint: string): TaskDefinition {
  return {
    id: 'task.fixture' as TaskDefinition['id'],
    name: 'Fixture Task',
    type: 'deno',
    entrypoint,
    topic: 'default',
    source: 'local',
    args: [],
    timeout: 300000,
    maxRetries: 1,
    priority: 50,
    enabled: true,
    tags: [],
    permissions: { env: false, ffi: false, net: false, read: false, run: false, write: false },
    timezone: 'UTC',
    retryDelay: 1000,
    maxConcurrency: 1,
    persist: true,
  };
}
