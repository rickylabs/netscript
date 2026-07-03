import { assert, assertEquals, assertExists } from '@std/assert';
import { join } from '@std/path';
import { LocalWorkspaceSandbox } from '../src/adapters/sandbox/local-workspace.ts';

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

Deno.test('sandbox seeds agent-visible files but excludes tests/ and reference/', async () => {
  const taskDir = await Deno.makeTempDir({ prefix: 'bench-task-' });
  await Deno.writeTextFile(join(taskDir, 'prompt.md'), '# prompt');
  await Deno.mkdir(join(taskDir, 'context'));
  await Deno.writeTextFile(join(taskDir, 'context', 'AGENTS.md'), '# ctx');
  await Deno.mkdir(join(taskDir, 'tests'));
  await Deno.writeTextFile(join(taskDir, 'tests', 'frozen-suite.ts'), 'export const suite = {};');
  await Deno.mkdir(join(taskDir, 'reference'));
  await Deno.writeTextFile(join(taskDir, 'reference', 'README.md'), 'deferred');

  const provider = new LocalWorkspaceSandbox();
  const sandbox = await provider.create({ taskId: 't1', taskDir });

  try {
    assertExists(sandbox.workdir);
    assertEquals(sandbox.taskId, 't1');
    assert(await exists(join(sandbox.workdir, 'prompt.md')), 'prompt copied');
    assert(await exists(join(sandbox.workdir, 'context', 'AGENTS.md')), 'context copied');
    assert(!(await exists(join(sandbox.workdir, 'tests'))), 'tests/ withheld from agent');
    assert(!(await exists(join(sandbox.workdir, 'reference'))), 'reference/ withheld from agent');
    // Sandbox lives outside the repo checkout (OS temp).
    assert(!sandbox.workdir.includes('.llm'), 'sandbox must not live under .llm/tmp');
  } finally {
    await provider.dispose(sandbox);
    await Deno.remove(taskDir, { recursive: true });
  }

  assert(!(await exists(sandbox.workdir)), 'dispose removes the sandbox');
});

Deno.test('dispose is idempotent and tolerant of a missing dir', async () => {
  const provider = new LocalWorkspaceSandbox({ seedTaskFiles: false });
  const sandbox = await provider.create({ taskId: 't1', taskDir: '/does/not/exist' });
  await provider.dispose(sandbox);
  await provider.dispose(sandbox); // second dispose must not throw
  assert(!(await exists(sandbox.workdir)));
});
