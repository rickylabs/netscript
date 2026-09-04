import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { isOpenHandsCommentCandidate } from '../../../../.github/scripts/openhands-comment-trigger.mjs';
import { OPEN_EVALUATOR_MODEL_IDS, OPENROUTER_MODEL_IDS } from '../config/models.ts';

type Event = {
  action: 'ready_for_review' | 'labeled' | 'synchronize';
  label?: string;
  labels: string[];
  draft?: boolean;
};

type PhaseDecision = 'dispatch-plan' | 'dispatch-impl' | 'skip-impl' | 'ignore';

function decision(event: Event): PhaseDecision {
  if (event.action === 'ready_for_review') {
    if (!event.labels.includes('openhands')) return 'ignore';
    return event.labels.includes('impl-eval:skip') ? 'skip-impl' : 'dispatch-impl';
  }
  if (event.action !== 'labeled') return 'ignore';
  const hasOpenHands = event.labels.includes('openhands');
  const completesPlanPair = hasOpenHands &&
    (event.label === 'status:plan-eval' ||
      (event.label === 'openhands' && event.labels.includes('status:plan-eval')));
  if (completesPlanPair) return 'dispatch-plan';
  const completesImplPair = hasOpenHands && !event.draft &&
    (event.label === 'status:impl-eval' ||
      (event.label === 'openhands' && event.labels.includes('status:impl-eval')));
  return completesImplPair ? 'dispatch-impl' : 'ignore';
}

const MODELS = new Map([
  ['eval:model:qwen', `openrouter/${OPENROUTER_MODEL_IDS.planEvaluator}`],
  ['eval:model:glm', `openrouter/${OPENROUTER_MODEL_IDS.implEvaluator}`],
]);

function selectModel(phase: 'plan' | 'impl', labels: string[]): string {
  const selected = labels.filter((label) => label.startsWith('eval:model:'));
  if (selected.some((label) => !MODELS.has(label))) throw new Error('unknown evaluator label');
  if (selected.length > 1) throw new Error('conflicting evaluator labels');
  const expectedLabel = phase === 'plan' ? 'eval:model:qwen' : 'eval:model:glm';
  if (selected.length && selected[0] !== expectedLabel) throw new Error('phase-mismatched label');
  return selected.length
    ? MODELS.get(selected[0])!
    : phase === 'plan'
    ? `openrouter/${OPENROUTER_MODEL_IDS.planEvaluator}`
    : `openrouter/${OPENROUTER_MODEL_IDS.implEvaluator}`;
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
  assertEquals(decision({ action: 'ready_for_review', labels: [] }), 'ignore');
  assertEquals(
    decision({ action: 'ready_for_review', labels: ['impl-eval:skip'] }),
    'ignore',
  );
  assertEquals(
    decision({ action: 'ready_for_review', labels: ['openhands'] }),
    'dispatch-impl',
  );
  assertEquals(
    decision({ action: 'ready_for_review', labels: ['openhands', 'impl-eval:skip'] }),
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
    'ignore',
  );
  assertEquals(
    decision({
      action: 'labeled',
      label: 'status:impl-eval',
      labels: ['status:impl-eval', 'openhands'],
      draft: false,
    }),
    'dispatch-impl',
  );
  assertEquals(
    decision({
      action: 'labeled',
      label: 'openhands',
      labels: ['status:impl-eval', 'openhands'],
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

Deno.test('phase evaluator model labels are exact, optional, and mutually exclusive', () => {
  assertEquals(selectModel('plan', []), `openrouter/${OPENROUTER_MODEL_IDS.planEvaluator}`);
  assertEquals(
    selectModel('impl', []),
    `openrouter/${OPENROUTER_MODEL_IDS.implEvaluator}`,
  );
  assertEquals(
    selectModel('plan', ['eval:model:qwen']),
    `openrouter/${OPENROUTER_MODEL_IDS.planEvaluator}`,
  );
  assertEquals(
    selectModel('impl', ['eval:model:glm']),
    `openrouter/${OPENROUTER_MODEL_IDS.implEvaluator}`,
  );
  assertThrows(() => selectModel('plan', ['eval:model:glm']));
  assertThrows(() => selectModel('impl', ['eval:model:qwen']));
  assertThrows(() => selectModel('impl', ['eval:model:not-real']));
  assertThrows(() => selectModel('impl', ['eval:model:glm', 'eval:model:qwen']));
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
  assertStringIncludes(
    phase,
    "github.event.action == 'ready_for_review' &&\n       contains(github.event.pull_request.labels.*.name, 'openhands')",
  );
  assertStringIncludes(phase, "contains(github.event.pull_request.labels.*.name, 'openhands')");
  assertStringIncludes(
    phase,
    "contains(github.event.pull_request.labels.*.name, 'impl-eval:skip')",
  );
  assertStringIncludes(phase, 'ref: `heads/${pr.base.ref}`');
  assertStringIncludes(phase, 'ref: trustedBaseSha');
  assertStringIncludes(phase, 'Trusted base SHA: ${trustedBaseSha}');
  assert(!phase.includes('ref: pr.base.sha'));
  assertStringIncludes(phase, 'contents: read');
  assert(!phase.includes('contents: write'));
  assertStringIncludes(phase, 'Check out trusted phase-eval scripts');
  assertStringIncludes(phase, 'id: checkout_trusted_primitive');
  assertStringIncludes(phase, "steps.checkout_trusted_primitive.outcome == 'success'");
  assertStringIncludes(phase, 'persist-credentials: false');
  assertStringIncludes(phase, "'.phase-eval-trusted/.github/scripts/phase-eval-claim.mjs'");
  assertStringIncludes(phase, "'.phase-eval-trusted/.github/scripts/phase-eval-status.mjs'");
  assertStringIncludes(
    phase,
    'const { dispatchClaimedPhaseEvaluation, phaseEvalMarker } = await import(',
  );
  assertStringIncludes(phase, 'const outcome = await dispatchClaimedPhaseEvaluation(');
  assert(!phase.includes('github.rest.git.deleteRef'));
  assertStringIncludes(phase, 'const findExistingTrigger = async () => {');
  assertStringIncludes(phase, 'findExistingTrigger,');
  assertStringIncludes(phase, 'Cycle the phase status to recover with a new');
  assertEquals(phase.match(/github\.rest\.git\.createRef\(/g)?.length, 1);
  assertEquals(phase.match(/github\.rest\.git\.getRef\(/g)?.length, 2);
  assertEquals(phase.match(/github\.rest\.issues\.listComments/g)?.length, 1);
  assertStringIncludes(phase, 'const marker = phaseEvalMarker(claimKey);');
  assertStringIncludes(phase, '@openhands-agent model=${model}');
  assertStringIncludes(phase, 'head=${livePr.head.sha}');
  assertStringIncludes(phase, 'Reasoning effort: not attested');
  assertStringIncludes(phase, 'decidePhaseEvaluationCurrency');
  assertStringIncludes(phase, 'No evaluator was claimed or dispatched.');
  assertStringIncludes(phase, 'Zero-spend stale evaluator event');
  assertStringIncludes(phase, 'name: selectedLabel');
  assertStringIncludes(phase, "const expectedModelLabel = phase === 'plan'");
  assertStringIncludes(phase, 'cannot select the ${phase.toUpperCase()} evaluator');
  assertStringIncludes(phase, 'github-token: ${{ secrets.PAT_TOKEN }}');
  assertStringIncludes(runner, "steps.request.outputs.eval_phase != ''");
  assertStringIncludes(runner, "steps.request.outputs.eval_phase == ''");
  assertStringIncludes(runner, "'status:augment-review'");
  assertStringIncludes(runner, 'pr.head.sha !== evaluatedHead');
  assertStringIncludes(runner, 'currentHead: livePr.head.sha');
  assertStringIncludes(runner, 'liveLabels: liveLabelData.map(({ name }) => name)');
  assertStringIncludes(runner, 'phase: env.EVAL_PHASE || null');
  assertStringIncludes(runner, 'evaluated_head: env.EVAL_HEAD || null');
  assertStringIncludes(runner, 'Reasoning effort: not attested');
  assertStringIncludes(runner, 'Check out trusted status transition helper');
  assertStringIncludes(runner, 'applyStatusTransition');
  assertStringIncludes(phase, 'run-name: Phase eval PR #');
  assertStringIncludes(runner, 'run-name: OpenHands runner ·');
  assertStringIncludes(runner, 'github-token: ${{ secrets.PAT_TOKEN }}');
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

Deno.test('generic OpenHands delegates every literal candidate to trusted policy before spend', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  assertStringIncludes(workflow, 'id: policy');
  assertStringIncludes(workflow, "if: github.event_name == 'issue_comment'");
  assertStringIncludes(workflow, 'id: non_comment');
  assertStringIncludes(workflow, "if: github.event_name != 'issue_comment'");
  assertStringIncludes(
    workflow,
    'dispatch: ${{ steps.non_comment.outputs.dispatch || steps.policy.outputs.dispatch }}',
  );
  assertStringIncludes(
    workflow,
    "'.trigger-policy-trusted/.github/scripts/openhands-comment-trigger.mjs'",
  );
  assertStringIncludes(workflow, 'authorizeOpenHandsCommentTrigger,');
  assertStringIncludes(workflow, 'buildOpenHandsRefusalReply,');
  assertStringIncludes(workflow, 'isReportableOpenHandsDenial,');
  assertStringIncludes(workflow, '} = await import(');
  assertStringIncludes(workflow, 'decision = await authorizeOpenHandsCommentTrigger(');
  assertStringIncludes(workflow, 'await github.rest.git.createRef({ owner, repo, ref, sha });');
  assertStringIncludes(workflow, 'priorCommentBodies: comments');
  assertStringIncludes(workflow, 'github-token: ${{ secrets.PAT_TOKEN }}');
  assertStringIncludes(
    workflow,
    "contains(github.event.comment.body, '@openhands-agent')",
  );
  assert(!workflow.includes('github.event.comment.author_association'));
  assertStringIncludes(workflow, "if: needs.authorize.outputs.dispatch == 'true'");
  assertStringIncludes(
    workflow,
    'MANUAL_TRIGGER_LINE: ${{ needs.authorize.outputs.trigger_line }}',
  );
  assert(!workflow.includes("line.includes('@openhands-agent')"));

  const authorizeStart = workflow.indexOf('  authorize:');
  const agentStart = workflow.indexOf('  agent:');
  const reportStart = workflow.indexOf('      - name: Report denied manual command');
  assert(authorizeStart >= 0 && reportStart > authorizeStart && agentStart > reportStart);
  const authorize = workflow.slice(authorizeStart, agentStart);
  assertStringIncludes(authorize, 'contents: read');
  assertStringIncludes(authorize, 'issues: write');
  assert(!authorize.includes('pull-requests: write'));
  assertStringIncludes(authorize, 'github-token: ${{ secrets.GITHUB_TOKEN }}');
  assertStringIncludes(authorize, "core.setOutput('refusal_marker', refusal?.marker ?? '');");
  assertStringIncludes(authorize, "core.setOutput('refusal_body', refusal?.body ?? '');");
});

Deno.test('refusal reporter posts exactly once per source-comment marker across repeat delivery', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  const start = workflow.indexOf('            async function reportRefusalOnce(');
  const end = workflow.indexOf('\n\n            await reportRefusalOnce(', start);
  assert(start >= 0 && end > start, 'embedded reportRefusalOnce source is present');
  const source = workflow.slice(start, end).replace(/^ {12}/gm, '');
  const reportRefusalOnce = new Function(
    `"use strict"; ${source}; return reportRefusalOnce;`,
  )() as (input: {
    listComments: () => Promise<Array<{ body?: string }>>;
    createComment: (body: string) => Promise<void>;
    marker: string;
    body: string;
  }) => Promise<boolean>;

  const marker = '<!-- openhands-command-refusal:4242 -->';
  const bodies: string[] = [];
  const calls: string[] = [];
  const input = {
    listComments: () => {
      calls.push('list');
      return Promise.resolve(bodies.map((body) => ({ body })));
    },
    createComment: (body: string) => {
      calls.push('post');
      bodies.push(body);
      return Promise.resolve();
    },
    marker,
    body: `${marker}\nOpenHands did not start for source comment 4242.`,
  };

  assertEquals(await reportRefusalOnce(input), true);
  assertEquals(await reportRefusalOnce(input), false);
  assertEquals(calls, ['list', 'post', 'list']);
  assertEquals(calls.filter((call) => call === 'post').length, 1);
  assertEquals(bodies.length, 1);
});

Deno.test('manual generation lookup retries 5x1s and exhausts to an attributable denial', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  const lookupStart = workflow.indexOf('            async function findPhaseGeneration(');
  const lookupEnd = workflow.indexOf(
    '\n\n            function buildGenerationLookupRefusal(',
    lookupStart,
  );
  assert(lookupStart >= 0 && lookupEnd > lookupStart, 'embedded lookup source is present');
  const lookupSource = workflow.slice(lookupStart, lookupEnd).replace(/^ {12}/gm, '');
  const findPhaseGeneration = new Function(
    `"use strict"; ${lookupSource}; return findPhaseGeneration;`,
  )() as (
    loadEvents: () => Promise<Array<{ event: string; label?: { name?: string } }>>,
    expectedStatus: string,
    sleep: (milliseconds: number) => Promise<void>,
  ) => Promise<{ id: number } | undefined>;

  const attempts: number[] = [];
  const sleeps: number[] = [];
  const result = await findPhaseGeneration(
    () => {
      attempts.push(attempts.length + 1);
      return Promise.resolve([]);
    },
    'status:impl-eval',
    (milliseconds) => {
      sleeps.push(milliseconds);
      return Promise.resolve();
    },
  );
  assertEquals(result, undefined);
  assertEquals(attempts, [1, 2, 3, 4, 5]);
  assertEquals(sleeps, [1000, 1000, 1000, 1000, 1000]);

  const refusalStart = workflow.indexOf('            function buildGenerationLookupRefusal(');
  const refusalEnd = workflow.indexOf('\n\n            let decision;', refusalStart);
  assert(refusalStart >= 0 && refusalEnd > refusalStart, 'embedded exhaustion refusal is present');
  const refusalSource = workflow.slice(refusalStart, refusalEnd).replace(/^ {12}/gm, '');
  const buildGenerationLookupRefusal = new Function(
    `"use strict"; ${refusalSource}; return buildGenerationLookupRefusal;`,
  )() as (input: { sourceCommentId: number; expectedStatus: string }) => {
    marker: string;
    body: string;
  };
  const refusal = buildGenerationLookupRefusal({
    sourceCommentId: 4242,
    expectedStatus: 'status:impl-eval',
  });
  assertStringIncludes(refusal.marker, '4242');
  assertStringIncludes(refusal.body, 'source comment 4242');
  assertStringIncludes(refusal.body, 'status:impl-eval');
  assertStringIncludes(refusal.body, 'five attempts');
  assert(!refusal.body.includes('@openhands-agent'));
  assertEquals(isOpenHandsCommentCandidate(refusal.body), false);
  const watcherHeuristicTokenRe =
    /\b(PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|FAIL)\b(?!\s*\|)/;
  assertEquals(watcherHeuristicTokenRe.test(refusal.body), false);

  const agentStart = workflow.indexOf('  agent:');
  assertStringIncludes(
    workflow.slice(agentStart),
    "if: needs.authorize.outputs.dispatch == 'true'",
  );
});

Deno.test('generic OpenHands reports verdict marker cardinality and shape distinctly', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  const functionStart = workflow.indexOf('            function verdictOf(text) {');
  const functionEnd = workflow.indexOf('\n\n            // 1) Summary file', functionStart);
  assert(functionStart >= 0 && functionEnd > functionStart, 'embedded verdictOf source is present');
  const functionSource = workflow.slice(functionStart, functionEnd).replace(/^ {12}/gm, '');
  const verdictOf = new Function(`"use strict"; ${functionSource}; return verdictOf;`)() as (
    text: string,
  ) => { verdict: string | null; state: 'parsed' | 'absent' | 'unparseable' | 'ambiguous' };

  assertEquals(verdictOf('OPENHANDS_VERDICT: PASS'), { verdict: 'PASS', state: 'parsed' });
  assertEquals(verdictOf('## **OPENHANDS_VERDICT: FAIL_FIX**'), {
    verdict: 'FAIL_FIX',
    state: 'parsed',
  });
  assertEquals(verdictOf('No marker was emitted.'), { verdict: null, state: 'absent' });
  assertEquals(verdictOf('## OPENHANDS_VERDICT: APPROVED'), {
    verdict: null,
    state: 'unparseable',
  });
  assertEquals(
    verdictOf('OPENHANDS_VERDICT: PASS\nOPENHANDS_VERDICT: PENDING'),
    { verdict: null, state: 'ambiguous' },
  );
  assertEquals(
    verdictOf('OPENHANDS_VERDICT: PASS\nOPENHANDS_VERDICT: FAIL_FIX'),
    { verdict: null, state: 'ambiguous' },
  );
  assertEquals(
    verdictOf('```text\nOPENHANDS_VERDICT: FAIL_FIX\n```\nOPENHANDS_VERDICT: PASS'),
    { verdict: 'PASS', state: 'parsed' },
  );
  assertEquals(
    verdictOf('OPENHANDS_VERDICT: <PASS|FAIL_FIX>\nOPENHANDS_VERDICT: PASS'),
    { verdict: 'PASS', state: 'parsed' },
  );

  const shellMatcherLine = workflow.split('\n').find((line) =>
    line.includes("| grep -E '") && line.includes('OPENHANDS_VERDICT')
  );
  assert(shellMatcherLine, 'trace step shell verdict matcher is present');
  const shellPattern = shellMatcherLine.slice(
    shellMatcherLine.indexOf("grep -E '") + "grep -E '".length,
    shellMatcherLine.lastIndexOf("'"),
  );
  const shellEquivalent = new RegExp(shellPattern.replaceAll('[[:space:]]', '\\s'));
  assert(shellEquivalent.test('OPENHANDS_VERDICT: PASS'));
  assert(shellEquivalent.test('## **OPENHANDS_VERDICT: FAIL_FIX**'));
  assert(!shellEquivalent.test('## OPENHANDS_VERDICT: APPROVED'));

  assertStringIncludes(workflow, 'agent_verdict_state="absent"');
  assertStringIncludes(workflow, 'agent_verdict_state="unparseable"');
  assertStringIncludes(workflow, 'agent_verdict_state="ambiguous"');
  assertStringIncludes(workflow, 'agent_verdict_state="parsed"');
  assertStringIncludes(workflow, 'marker_count="$(printf');
  assertStringIncludes(workflow, '[ "$marker_count" -gt 1 ] || [ "$valid_count" -gt 1 ]');
  assertStringIncludes(workflow, 'agent_verdict_state=$agent_verdict_state');
  assertStringIncludes(workflow, '"agent_verdict_state": os.environ.get(');
  assertStringIncludes(workflow, "'summary-unparseable'");
  assertStringIncludes(workflow, "'summary-ambiguous'");
  assertStringIncludes(workflow, "'pr-comment-unparseable'");
  assertStringIncludes(workflow, "'pr-comment-ambiguous'");
  assertStringIncludes(workflow, 'Agent emitted no OPENHANDS_VERDICT token.');
  assertStringIncludes(
    workflow,
    'Agent emitted an OPENHANDS_VERDICT marker, but its verdict token or line could not be parsed.',
  );
  assertStringIncludes(workflow, '(?:#{1,6}[ \\t]+)?');
});

Deno.test('read-only formal evaluator with pr-comment preserves a durable verdict off-head', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  assertStringIncludes(
    workflow,
    "const outputMode = matchValue('output') || process.env.DISPATCH_OUTPUT_MODE || 'pr-comment';",
  );

  const commitStart = workflow.indexOf(
    '      - name: Commit run artifacts to PR branch (allow-listed paths only)',
  );
  const preserveStart = workflow.indexOf(
    '      - name: Preserve formal evaluator verdict on isolated artifact ref',
  );
  const createPrStart = workflow.indexOf(
    '      - name: Create pull request for non-PR triggers',
  );
  assert(commitStart >= 0 && preserveStart > commitStart && createPrStart > preserveStart);
  const commitBlock = workflow.slice(commitStart, preserveStart);
  const preserveBlock = workflow.slice(preserveStart, createPrStart);

  assertStringIncludes(commitBlock, "steps.request.outputs.eval_phase == ''");
  assertStringIncludes(preserveBlock, "steps.request.outputs.eval_phase != ''");
  assertStringIncludes(preserveBlock, 'git commit-tree "$artifact_tree" -p "$EVAL_HEAD"');
  assertStringIncludes(
    preserveBlock,
    'openhands-eval-artifacts/pr-${ISSUE_NUMBER}/run-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}',
  );
  assertStringIncludes(
    preserveBlock,
    'git push "$remote" "${record_commit}:refs/heads/${artifact_ref}"',
  );
  assert(!preserveBlock.includes('HEAD:${CHECKOUT_REF}'));
  assertStringIncludes(preserveBlock, '"evaluated_head": os.environ["EVAL_HEAD"]');
  assertStringIncludes(
    preserveBlock,
    '"formal_verdict": os.environ.get("AGENT_VERDICT", "NONE")',
  );
  assertStringIncludes(preserveBlock, '"verdict_source": os.environ.get("VERDICT_SOURCE"');
  assertStringIncludes(preserveBlock, '"verdict_artifact_uri": os.environ["ARTIFACT_URI"]');

  const finalizeStart = workflow.indexOf('      - name: Publish final status comment');
  const transitionStart = workflow.indexOf(
    '      - name: Check out trusted status transition helper',
  );
  const finalizeBlock = workflow.slice(finalizeStart, transitionStart);
  assertStringIncludes(finalizeBlock, "env.OUTPUT_MODE === 'summary-only'");
  assertStringIncludes(finalizeBlock, 'const formalArtifactReady =');
  assertStringIncludes(
    finalizeBlock,
    "summaryInspection.state === 'parsed' && formalArtifactReady",
  );
  assertStringIncludes(finalizeBlock, 'verdict_artifact_uri: formalArtifactReady');
  assertStringIncludes(finalizeBlock, 'evaluated_head: env.EVAL_HEAD || null');
  assertStringIncludes(finalizeBlock, 'env.TRACE_VERDICT_SOURCE ||');
  assertStringIncludes(finalizeBlock, 'evaluated head unchanged');
  assertStringIncludes(finalizeBlock, 'no tracked verdict path is claimed');
  assertStringIncludes(finalizeBlock, "summaryInspection.state !== 'parsed'");
  assertStringIncludes(finalizeBlock, 'not repeat an untrusted verdict token');
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
