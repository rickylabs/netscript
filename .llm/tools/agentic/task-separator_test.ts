import { assertEquals, assertMatch } from '@std/assert';
import { fromFileUrl } from '@std/path';

const repo = fromFileUrl(new URL('../../../', import.meta.url)).replace(/\/$/, '');
const decoder = new TextDecoder();

interface CommandResult {
  readonly code: number;
  readonly output: string;
}

async function runDeno(
  args: readonly string[],
  env: Record<string, string> = {},
): Promise<CommandResult> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: [...args],
    cwd: repo,
    env,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: result.code,
    output: `${decoder.decode(result.stdout)}${decoder.decode(result.stderr)}`,
  };
}

async function hybridFixture(): Promise<{ home: string; env: Record<string, string> }> {
  const home = await Deno.makeTempDir({ dir: '/tmp', prefix: 'hybrid-separator-home-' });
  const bin = await Deno.makeTempDir({ dir: '/tmp', prefix: 'hybrid-separator-bin-' });
  const claude = `${bin}/claude`;
  await Deno.writeTextFile(
    claude,
    `#!/bin/sh
set -eu
mkdir -p "$HOME/.claude/sessions"
printf '%s\\n' "$$" >> "$HOME/claude-child-pids"
printf '{"pid":%s,"cwd":"%s","sessionId":"fixture-session","bridgeSessionId":"fixture-bridge"}\\n' "$$" "$PWD" > "$HOME/.claude/sessions/$$.json"
sleep 1
`,
  );
  await Deno.chmod(claude, 0o755);
  return {
    home,
    env: {
      HOME: home,
      PATH: `${bin}:${Deno.env.get('PATH') ?? '/usr/bin:/bin'}`,
    },
  };
}

async function childPids(home: string): Promise<string[]> {
  try {
    return (await Deno.readTextFile(`${home}/claude-child-pids`)).trim().split('\n').filter(
      Boolean,
    );
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
}

const directHybridArgs = [
  'run',
  '--no-lock',
  '--allow-read',
  '--allow-write=/tmp',
  '--allow-run=claude',
  '--allow-env',
  '.llm/tools/agentic/claude/hybrid-launcher.ts',
];

Deno.test('hybrid launcher direct script and deno task forms each launch one proven supervisor', async () => {
  const forms = [
    (cwd: string) => [...directHybridArgs, '--cwd', cwd],
    (cwd: string) => ['task', 'agentic:claude-hybrid', '--', '--cwd', cwd],
  ];
  for (const form of forms) {
    const fixture = await hybridFixture();
    try {
      const result = await runDeno(form(repo), fixture.env);
      assertEquals(result.code, 0, result.output);
      const evidenceLine = result.output.split('\n').find((line) =>
        line.includes('"event":"hybrid_remote_control_attached"')
      );
      assertMatch(evidenceLine ?? '', /"pid":\d+/);
      const evidence = JSON.parse(evidenceLine ?? '{}');
      assertEquals(evidence.cwd, repo);
      assertEquals(evidence.sessionId, 'fixture-session');
      assertEquals(evidence.bridgeSessionId, 'fixture-bridge');
      assertEquals((await childPids(fixture.home)).length, 1, result.output);
    } finally {
      await Deno.remove(fixture.home, { recursive: true }).catch(() => {});
      const bin = fixture.env.PATH.split(':')[0];
      await Deno.remove(bin, { recursive: true }).catch(() => {});
    }
  }
});

Deno.test('hybrid parser failures reject the later token and never spawn a child', async () => {
  const forms = [
    [...directHybridArgs, '--cwd', repo, '--unexpected'],
    ['task', 'agentic:claude-hybrid', '--', '--cwd', repo, '--unexpected'],
    ['task', 'agentic:claude-hybrid', '--', '--', '--cwd', repo],
    ['task', 'agentic:claude-hybrid', '--', '--cwd', repo, '--'],
  ];
  for (const args of forms) {
    const fixture = await hybridFixture();
    try {
      const result = await runDeno(args, fixture.env);
      assertEquals(result.code === 0, false, result.output);
      assertMatch(result.output, /unknown argument: --(?:unexpected)?/i);
      assertEquals(await childPids(fixture.home), [], result.output);
    } finally {
      await Deno.remove(fixture.home, { recursive: true }).catch(() => {});
      const bin = fixture.env.PATH.split(':')[0];
      await Deno.remove(bin, { recursive: true }).catch(() => {});
    }
  }
});

Deno.test('codex resume help works through direct script and documented task separator forms', async () => {
  const direct = await runDeno([
    'run',
    '--no-lock',
    '--allow-read',
    '--allow-run',
    '.llm/tools/agentic/codex/codex-resume.ts',
    '--help',
  ]);
  const task = await runDeno(['task', 'agentic:codex-resume', '--', '--help']);
  assertEquals(direct.code, 0, direct.output);
  assertEquals(task.code, 0, task.output);
  assertMatch(direct.output, /--thread-id/);
  assertMatch(task.output, /--thread-id/);
});
