import { assert, assertEquals } from '@std/assert';
import { gateArgv } from './catalog.ts';

interface RootConfig {
  tasks?: Record<string, unknown>;
}

Deno.test('README fence gate plumbing and blocking quality placement are exact', async () => {
  const config = JSON.parse(await Deno.readTextFile('deno.json')) as RootConfig;
  assertEquals(
    config.tasks?.['docs:readme-fences'],
    'deno run --allow-read --allow-write --allow-run .llm/tools/docs/check-readme-fences.ts',
  );
  assertEquals(gateArgv('readme-fences'), ['deno', 'task', 'docs:readme-fences']);

  const workflow = await Deno.readTextFile('.github/workflows/ci.yml');
  const gateOccurrences = [...workflow.matchAll(/--gate readme-fences/g)];
  assertEquals(gateOccurrences.length, 1);
  const qualityStart = workflow.indexOf('\n  quality:');
  const depsReportStart = workflow.indexOf('\n  deps-report:');
  const gatePosition = gateOccurrences[0]?.index ?? -1;
  assert(
    qualityStart !== -1 && gatePosition > qualityStart && gatePosition < depsReportStart,
    'the blocking README fence gate must appear exactly once in the quality job',
  );
  assert(
    workflow.includes(
      '--id quality-readme-fences\n          --output .llm/tmp/gate-receipts/quality/readme-fences.json',
    ),
    'the blocking gate must emit its durable quality receipt',
  );
});

Deno.test('the README fence gate runs on docs-only diffs, not just Deno diffs', async () => {
  // Its subject is README markdown. `classifyPath('packages/cli/README.md')` yields
  // `needs_docs`, not `needs_deno`, so a RUN_DENO guard would skip the gate on exactly
  // the diffs that edit the files it checks. `RUN` is the quality job's own
  // `needs_deno || needs_docs` gate, and it is the only correct guard here.
  const workflow = await Deno.readTextFile('.github/workflows/ci.yml');
  const step = workflow.slice(workflow.indexOf('- name: README fence integrity'));
  const guard = step.slice(0, step.indexOf('run:'));
  assert(
    /\n\s+if: env\.RUN == 'true'\n/.test(guard),
    'the README fence gate must be guarded on RUN (deno OR docs), never RUN_DENO alone',
  );
  assert(
    !guard.includes("env.RUN_DENO == 'true'"),
    'narrowing the guard back to RUN_DENO would silently stop gating README-only PRs',
  );
});
