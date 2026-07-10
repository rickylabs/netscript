import { assert } from '@std/assert';

const root = new URL('../../../', import.meta.url);
const denoConfig = JSON.parse(await Deno.readTextFile(new URL('deno.json', root))) as {
  tasks: Record<string, string>;
};
const wrappers = {
  'agentic:wsl-foundation': 'wsl/wsl-foundation.ts',
  'agentic:launch-codex-slice': 'codex/launch-codex-slice.ts',
  'agentic:codex-resume': 'codex/codex-resume.ts',
  'agentic:codex-status': 'codex/codex-status.ts',
  'agentic:smoke-claude-remote': 'claude/claude-remote-smoke.ts',
} as const;

Deno.test('S5 retains every legacy task as a thin compatibility entry point', async () => {
  for (const [task, file] of Object.entries(wrappers)) {
    assert(
      denoConfig.tasks[task]?.includes(`.llm/tools/agentic/${file}`),
      `${task} mapping changed`,
    );
    const source = await Deno.readTextFile(new URL(file, import.meta.url));
    assert(source.length > 0, `${file} missing`);
    if (file !== 'wsl/wsl-foundation.ts') {
      assert(
        source.includes('@deprecated Retained through one compatibility cycle'),
        `${file} retirement boundary missing`,
      );
    }
  }
});

Deno.test('compatibility wrappers retain stable flag and delegation contracts', async () => {
  const launch = await Deno.readTextFile(new URL('codex/launch-codex-slice.ts', import.meta.url));
  const resume = await Deno.readTextFile(new URL('codex/codex-resume.ts', import.meta.url));
  const status = await Deno.readTextFile(new URL('codex/codex-status.ts', import.meta.url));
  const smoke = await Deno.readTextFile(new URL('claude/claude-remote-smoke.ts', import.meta.url));
  const foundation = await Deno.readTextFile(new URL('wsl/wsl-foundation.ts', import.meta.url));
  for (
    const flag of [
      '--brief',
      '--worktree',
      '--branch',
      '--provider',
      '--model',
      '--effort',
      '--dry-run',
      '--parse-log',
    ]
  ) {
    assert(launch.includes(flag), `launch lost ${flag}`);
  }
  for (const flag of ['--thread-id', '--message', '--message-file', '--dry-run']) {
    assert(resume.includes(flag), `resume lost ${flag}`);
  }
  for (const flag of ['--worktree', '--sessions', '--pretty']) {
    assert(status.includes(flag), `status lost ${flag}`);
  }
  for (const flag of ['--env-aware', '--live', '--prompt', '--timeout-ms']) {
    assert(smoke.includes(flag), `smoke lost ${flag}`);
  }
  assert(
    launch.includes('agentic-lib.ts') && resume.includes('agentic-lib.ts') &&
      status.includes('agentic-lib.ts'),
    'Codex wrappers stopped delegating to shared primitives',
  );
  assert(
    foundation.includes('wsl-foundation-lib.ts'),
    'foundation wrapper stopped delegating to its contract library',
  );
});
