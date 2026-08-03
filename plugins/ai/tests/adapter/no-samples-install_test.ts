import { assertEquals } from '@std/assert';
import { join, resolve } from '@std/path';

Deno.test({
  name: 'plugin install ai --no-samples omits samples and type-checks the generated workspace',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const repoRoot = resolve(new URL('../../../..', import.meta.url).pathname);
    const smokeRoot = await Deno.makeTempDir({ prefix: 'netscript-ai-no-samples-' });
    const projectName = 'consumer';
    const projectRoot = join(smokeRoot, projectName);
    const cli = join(repoRoot, 'packages', 'cli', 'bin', 'netscript.ts');

    try {
      await run(repoRoot, [
        'run',
        '-A',
        cli,
        'init',
        projectName,
        '--path',
        smokeRoot,
        '--db',
        'none',
        '--ci',
        '--yes',
        '--no-git',
        '--force',
      ]);
      await run(repoRoot, [
        'run',
        '-A',
        cli,
        'plugin',
        'install',
        'ai',
        '--name',
        'ai',
        '--project-root',
        projectRoot,
        '--no-samples',
        '--force',
        '--ci',
        '--local-path',
        join(repoRoot, 'plugins', 'ai'),
      ]);

      for (const required of ['ai/ai.ts', 'ai/models.ts', 'ai/mcp/registry.ts']) {
        await Deno.stat(join(projectRoot, required));
      }
      for (
        const omitted of [
          'ai/tools/echo.ts',
          'ai/agents/assistant.ts',
          'ai/routes/chat-stream.ts',
          'ai/routes/chat.tsx',
        ]
      ) {
        assertEquals(await exists(join(projectRoot, omitted)), false, omitted);
      }
      await run(projectRoot, [
        'check',
        '--unstable-kv',
        'ai/ai.ts',
        'ai/models.ts',
        'ai/mcp/registry.ts',
      ]);
    } finally {
      await Deno.remove(smokeRoot, { recursive: true });
    }
  },
});

async function run(cwd: string, args: readonly string[]): Promise<void> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.success) return;
  const decoder = new TextDecoder();
  throw new Error(
    `deno ${args.join(' ')} failed with ${output.code}\n` +
      decoder.decode(output.stdout) + decoder.decode(output.stderr),
  );
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
