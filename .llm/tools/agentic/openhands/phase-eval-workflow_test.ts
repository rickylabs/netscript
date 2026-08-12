import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { OPEN_EVALUATOR_MODEL_IDS } from '../config/models.ts';

type Event = {
  action: 'ready_for_review' | 'labeled' | 'synchronize';
  label?: string;
  labels: string[];
  draft?: boolean;
};

type PhaseDecision = 'dispatch-plan' | 'dispatch-impl' | 'skip-impl' | 'ignore';

function decision(event: Event): PhaseDecision {
  if (event.action === 'ready_for_review') {
    return event.labels.includes('impl-eval:skip') ? 'skip-impl' : 'dispatch-impl';
  }
  if (event.action !== 'labeled') return 'ignore';
  const hasOpenHands = event.labels.includes('openhands');
  const completesPlanPair = hasOpenHands &&
    (event.label === 'status:plan-eval' ||
      (event.label === 'openhands' && event.labels.includes('status:plan-eval')));
  if (completesPlanPair) return 'dispatch-plan';
  return !event.draft && event.label === 'status:impl-eval' ? 'dispatch-impl' : 'ignore';
}

const MODELS = new Map([
  ['eval:model:minimax', 'openrouter/minimax/minimax-m3'],
  ['eval:model:deepseek', 'openrouter/deepseek/deepseek-v4-flash-0731'],
  ['eval:model:qwen', 'openrouter/qwen/qwen3.8-max'],
]);

async function selectModel(phase: 'plan' | 'impl', labels: string[]): Promise<string> {
  const selected = labels.filter((label) => label.startsWith('eval:model:'));
  if (selected.some((label) => !MODELS.has(label))) throw new Error('unknown evaluator label');
  if (selected.length > 1) throw new Error('conflicting evaluator labels');
  return selected.length
    ? MODELS.get(selected[0])!
    : phase === 'plan'
    ? 'openrouter/minimax/minimax-m3'
    : 'openrouter/deepseek/deepseek-v4-flash-0731';
}

function nextStatus(
  phase: 'plan' | 'impl',
  verdict: 'PASS' | 'FAIL_FIX' | 'FAIL_RESCOPE' | 'FAIL_DEBT' | 'FAIL_PLAN' | 'NONE',
): string | null {
  if (verdict === 'NONE') return null;
  if (phase === 'plan') return verdict === 'PASS' ? 'status:impl' : 'status:plan';
  if (verdict === 'PASS') return 'status:augment-review';
  return verdict === 'FAIL_RESCOPE' || verdict === 'FAIL_PLAN' ? 'status:plan' : 'status:impl';
}

Deno.test('phase evaluator event matrix dispatches only deliberate transitions', () => {
  assertEquals(decision({ action: 'ready_for_review', labels: [] }), 'dispatch-impl');
  assertEquals(
    decision({ action: 'ready_for_review', labels: ['impl-eval:skip'] }),
    'skip-impl',
  );
  assertEquals(
    decision({
      action: 'labeled',
      label: 'status:plan-eval',
      labels: ['status:plan-eval', 'openhands'],
      draft: true,
    }),
    'dispatch-plan',
  );
  assertEquals(
    decision({
      action: 'labeled',
      label: 'openhands',
      labels: ['status:plan-eval', 'openhands'],
      draft: true,
    }),
    'dispatch-plan',
  );
  assertEquals(
    decision({ action: 'labeled', label: 'status:plan-eval', labels: ['status:plan-eval'] }),
    'ignore',
  );
  assertEquals(
    decision({
      action: 'labeled',
      label: 'status:impl-eval',
      labels: ['status:impl-eval'],
      draft: false,
    }),
    'dispatch-impl',
  );
  assertEquals(
    decision({
      action: 'labeled',
      label: 'status:impl-eval',
      labels: ['status:impl-eval', 'openhands'],
      draft: true,
    }),
    'ignore',
  );
  assertEquals(
    decision({ action: 'labeled', label: 'eval:model:qwen', labels: ['eval:model:qwen'] }),
    'ignore',
  );
  assertEquals(decision({ action: 'synchronize', labels: ['status:impl-eval'] }), 'ignore');
});

Deno.test('phase evaluator model labels are exact, optional, and mutually exclusive', async () => {
  assertEquals(await selectModel('plan', []), 'openrouter/minimax/minimax-m3');
  assertEquals(
    await selectModel('impl', []),
    'openrouter/deepseek/deepseek-v4-flash-0731',
  );
  for (const [label, model] of MODELS) assertEquals(await selectModel('impl', [label]), model);
  await assertRejects(() => selectModel('impl', ['eval:model:not-real']));
  await assertRejects(() => selectModel('impl', ['eval:model:deepseek', 'eval:model:qwen']));
});

Deno.test('formal verdicts advance or return the harness status deterministically', () => {
  assertEquals(nextStatus('plan', 'PASS'), 'status:impl');
  assertEquals(nextStatus('plan', 'FAIL_PLAN'), 'status:plan');
  assertEquals(nextStatus('plan', 'FAIL_RESCOPE'), 'status:plan');
  assertEquals(nextStatus('impl', 'PASS'), 'status:augment-review');
  assertEquals(nextStatus('impl', 'FAIL_FIX'), 'status:impl');
  assertEquals(nextStatus('impl', 'FAIL_DEBT'), 'status:impl');
  assertEquals(nextStatus('impl', 'FAIL_RESCOPE'), 'status:plan');
  assertEquals(nextStatus('impl', 'FAIL_PLAN'), 'status:plan');
  assertEquals(nextStatus('impl', 'NONE'), null);
});

Deno.test('workflow source encodes trusted, exactly-once phase dispatch', async () => {
  const phase = await Deno.readTextFile('.github/workflows/openhands-phase-eval.yml');
  const runner = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  assertStringIncludes(phase, 'types: [labeled, ready_for_review]');
  assert(!phase.includes('synchronize'));
  assertStringIncludes(phase, "contains(github.event.pull_request.labels.*.name, 'openhands')");
  assertStringIncludes(
    phase,
    "contains(github.event.pull_request.labels.*.name, 'impl-eval:skip')",
  );
  assertStringIncludes(phase, 'ref: pr.base.sha');
  assertStringIncludes(phase, 'openhands-phase-eval generation=${generationEvent.id}');
  assertStringIncludes(phase, '@openhands-agent model=${model}');
  assertStringIncludes(phase, 'head=${pr.head.sha}');
  assertStringIncludes(phase, 'name: selectedLabel');
  assertStringIncludes(runner, "steps.request.outputs.eval_phase != ''");
  assertStringIncludes(runner, "steps.request.outputs.eval_phase == ''");
  assertStringIncludes(runner, "'status:augment-review'");
  assertStringIncludes(runner, 'pr.head.sha !== evaluatedHead');
  assertStringIncludes(
    runner,
    "label.name == 'openhands' && github.event_name == 'issues'",
  );
  assert(!runner.includes('types: [labeled, ready_for_review]'));
});

Deno.test('generic OpenHands stays fail-closed to current open evaluator models', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  for (const model of OPEN_EVALUATOR_MODEL_IDS) {
    assertStringIncludes(workflow, `'openrouter/${model}'`);
  }
  assertStringIncludes(workflow, 'uv pip install --system fastapi');
  assert(!workflow.includes("['sonnet', 'anthropic/claude-sonnet-4']"));
  assert(!workflow.includes("['gpt', 'openai/gpt-5.1']"));
  assert(!workflow.includes("['gemini', 'gemini/gemini-2.5-pro']"));
});

Deno.test('formal evaluator prompts are trusted read-only harness contracts', async () => {
  for (
    const path of [
      '.llm/tools/agentic/openhands/plan-eval-prompt.md',
      '.llm/tools/agentic/openhands/impl-eval-prompt.md',
    ]
  ) {
    const prompt = await Deno.readTextFile(path);
    assert(prompt.startsWith('use harness\n'));
    assertStringIncludes(prompt, 'Do not edit files, create commits, push');
    assertStringIncludes(prompt, 'OPENHANDS_SUMMARY_PATH');
  }
});
