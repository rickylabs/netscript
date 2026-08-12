import { assert, assertMatch, assertStringIncludes } from '@std/assert';

const workflows = [
  'ci.yml',
  'code-quality.yml',
  'openhands-phase-eval.yml',
  'e2e-cli.yml',
  'openhands-agent.yml',
  'surface-diff.yml',
];

Deno.test('every pull-request workflow handles ready_for_review', async () => {
  for (const name of workflows) {
    const source = await Deno.readTextFile(`.github/workflows/${name}`);
    assertStringIncludes(source, 'ready_for_review', name);
  }
});

Deno.test('draft PRs schedule no core, e2e, quality, or surface jobs', async () => {
  const core = await Deno.readTextFile('.github/workflows/ci.yml');
  for (const job of ['close-gate', 'classify', 'check-test', 'quality', 'deps-report']) {
    const block = core.match(
      new RegExp(`^  ${job}:\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9-]*:|\\z)`, 'm'),
    )?.[1];
    assert(block, `missing core job ${job}`);
    assertStringIncludes(block, 'github.event.pull_request.draft == false', job);
  }

  const e2e = await Deno.readTextFile('.github/workflows/e2e-cli.yml');
  assertMatch(e2e, /classify:[\s\S]*?github\.event\.pull_request\.draft == false/);

  const quality = await Deno.readTextFile('.github/workflows/code-quality.yml');
  assertMatch(quality, /code-quality:[\s\S]*?github\.event\.pull_request\.draft == false/);

  const surface = await Deno.readTextFile('.github/workflows/surface-diff.yml');
  assertMatch(surface, /classify:[\s\S]*?github\.event\.pull_request\.draft == false/);
  assertMatch(surface, /surface-diff:[\s\S]*?github\.event\.pull_request\.draft == false/);
});

Deno.test('capability-vector and label overrides remain composed beneath draft gating', async () => {
  const e2e = await Deno.readTextFile('.github/workflows/e2e-cli.yml');
  for (
    const token of [
      'run_static',
      'run_runtime',
      'needs_desktop',
      'ci:skip-scaffold',
      'ci:skip-e2e',
      'ci:full',
    ]
  ) {
    assertStringIncludes(e2e, token);
  }
});
