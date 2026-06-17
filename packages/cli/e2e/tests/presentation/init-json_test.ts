import { assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';

function repoRoot(): string {
  return dirname(dirname(dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))))));
}

Deno.test('netscript init --json emits a single structured object', async () => {
  const root = repoRoot();
  const command = new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      'run',
      '-A',
      'packages/cli/bin/netscript-dev.ts',
      'init',
      'json-smoke',
      '--path',
      join(root, '.llm/tmp/init-json-smoke'),
      '--db',
      'none',
      '--no-aspire',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
      '--dry-run',
      '--json',
    ],
  });

  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout).trim();
  const stderr = new TextDecoder().decode(output.stderr).trim();

  assertEquals(output.code, 0, stderr);
  const lines = stdout.split(/\r?\n/);
  assertEquals(lines.length, 1);

  const result = JSON.parse(lines[0]) as {
    command: string;
    project: { name: string; dryRun: boolean };
    totals: { filesCreated: number };
    plugins: unknown[];
    aspire: { enabled: boolean; resourceCount: number };
    nextSteps: string[];
  };

  assertEquals(result.command, 'init');
  assertEquals(result.project.name, 'json-smoke');
  assertEquals(result.project.dryRun, true);
  assertEquals(result.plugins, []);
  assertEquals(result.aspire.enabled, false);
  assertEquals(result.aspire.resourceCount, 0);
  assertStringIncludes(result.nextSteps.join('\n'), 'deno task --cwd apps/dashboard dev');
});
