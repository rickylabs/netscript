import { assert, assertEquals, assertMatch, assertThrows } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { normalizeTaskArguments } from './lib/task-arguments.ts';

const repo = fromFileUrl(new URL('../../../', import.meta.url)).replace(/\/$/, '');
const decoder = new TextDecoder();

const STRICT_AGENTIC_TASKS = {
  'agentic:copilot-task': 'copilot/copilot-agent-task.ts',
  'agentic:copilot-preflight': 'opencode/opencode-preflight.ts',
  'agentic:wsl-foundation': 'wsl/wsl-foundation.ts',
  'agentic:runtime': 'runtime/cli/agentic-runtime.ts',
  'agentic:routing-state': 'runtime/cli/routing-state.ts',
  'agentic:expense-watch': 'runtime/cli/expense-watch.ts',
  'agentic:leak-check': 'teardown/leak-check.ts',
  'agentic:teardown': 'teardown/teardown.ts',
  'agentic:antigravity-evidence': 'runtime/cli/antigravity-evidence-cli.ts',
  'agentic:provider-canary': 'runtime/cli/provider-canary.ts',
  'agentic:rollout-canary': 'runtime/cli/rollout-canary-cli.ts',
  'agentic:claude-openrouter-gateway': 'claude/remote-model-launcher.ts',
  'agentic:claude-hybrid': 'claude/hybrid-launcher.ts',
  'agentic:codex-resume': 'codex/codex-resume.ts',
  'agentic:codex-status': 'codex/codex-status.ts',
  'agentic:codex-follow': 'codex/codex-follow.ts',
  'agentic:codex-watch': 'codex/codex-watch.ts',
  'agentic:launch-codex-slice': 'codex/launch-codex-slice.ts',
  'agentic:dispatch-openhands': 'openhands/dispatch-openhands.ts',
  'agentic:openhands-status': 'openhands/openhands-status.ts',
  'agentic:gh-pr': 'github/gh-pr.ts',
  'agentic:gh-watch': 'github/gh-watch.ts',
  'agentic:gh-token': 'github/gh-token.ts',
  'agentic:review-threads': 'github/review-threads.ts',
  'agentic:pr-checks': 'github/pr-checks.ts',
  'agentic:claude-openrouter': 'claude/openrouter-run.ts',
  'agentic:opencode': 'opencode/opencode-run.ts',
  'agentic:opencode-eval': 'opencode/opencode-eval.ts',
  'agentic:opencode-web': 'opencode/opencode-web.ts',
} as const;

const PERMISSIVE_AGENTIC_TASKS = [
  'agentic:check-claude',
  'agentic:dogfood-skills',
  'agentic:dogfood-skills:check',
  'agentic:smoke-claude-remote',
  'agentic:claude-hook-log',
] as const;

interface CommandResult {
  readonly code: number;
  readonly output: string;
}

Deno.test('task arguments accept one leading separator and reject every later separator', () => {
  assertEquals(normalizeTaskArguments(['--cwd', '/repo']), ['--cwd', '/repo']);
  assertEquals(normalizeTaskArguments(['--', '--cwd', '/repo']), ['--cwd', '/repo']);
  assertEquals(normalizeTaskArguments(['--']), []);
  assertThrows(
    () => normalizeTaskArguments(['--cwd', '/repo', '--']),
    Error,
    'Unknown argument: --',
  );
  assertThrows(
    () => normalizeTaskArguments(['--', '--', '--cwd', '/repo']),
    Error,
    'Unknown argument: --',
  );
});

Deno.test('survey accounts for every agentic task and every strict entry normalizes argv', async () => {
  const denoConfig = JSON.parse(await Deno.readTextFile(`${repo}/deno.json`)) as {
    tasks: Record<string, string>;
  };
  const actualTasks = Object.keys(denoConfig.tasks).filter((task) => task.startsWith('agentic:'))
    .sort();
  const surveyedTasks = [
    ...Object.keys(STRICT_AGENTIC_TASKS),
    ...PERMISSIVE_AGENTIC_TASKS,
  ].sort();
  assertEquals(surveyedTasks, actualTasks);
  assertEquals(Object.keys(STRICT_AGENTIC_TASKS).length, 29);
  for (const [task, entry] of Object.entries(STRICT_AGENTIC_TASKS)) {
    assert(
      denoConfig.tasks[task]?.includes(`.llm/tools/agentic/${entry}`),
      `${task} mapping changed`,
    );
    const source = await Deno.readTextFile(`${repo}/.llm/tools/agentic/${entry}`);
    assert(source.includes('normalizeTaskArguments('), `${task} does not normalize task argv`);
  }
});

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

Deno.test('hybrid direct script and deno task forms each launch one simulated proven supervisor', async () => {
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
