import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import {
  applyImplEvalStatusTransition,
  applyStatusTransition,
  decideImplEvalStatusTransition,
  decidePhaseEvaluationCurrency,
  decideStatusTransition,
  IMPL_EVAL_STATUS,
  PHASE_EVAL_RECOVERY,
} from './phase-eval-status.mjs';

interface IssueLabelOperations {
  listLabelsOnIssue(): Promise<string[]>;
  removeLabel(label: string): Promise<void>;
  addLabels(labels: string[]): Promise<void>;
}

function workflowStep(source: string, name: string): string {
  const lines = source.split('\n');
  const start = lines.indexOf(`      - name: ${name}`);
  if (start < 0) throw new Error(`Missing workflow step: ${name}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('      - name: ')) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function operations(
  labels: string[],
  removeError?: (label: string) => unknown,
) {
  const removed: string[] = [];
  const added: string[][] = [];
  const client: IssueLabelOperations = {
    listLabelsOnIssue: () => Promise.resolve(labels),
    removeLabel: (label: string) => {
      const error = removeError?.(label);
      if (error !== undefined) return Promise.reject(error);
      removed.push(label);
      return Promise.resolve();
    },
    addLabels: (next: string[]) => {
      added.push(next);
      return Promise.resolve();
    },
  };
  return { client, removed, added };
}

Deno.test('race regression: a concurrently removed status label does not fail cleanup', async () => {
  const { client, removed, added } = operations(
    ['status:impl', 'area:tooling'],
    () => ({ status: 404, response: { data: { message: 'Label does not exist' } } }),
  );

  await applyImplEvalStatusTransition(client);

  assertEquals(removed, []);
  assertEquals(added, [['status:impl-eval']]);
});

Deno.test('narrow tolerance: permission failures still fail cleanup', async () => {
  const { client } = operations(
    ['status:impl'],
    () => ({
      status: 403,
      response: { data: { message: 'Resource not accessible by integration' } },
    }),
  );

  await assertRejects(() => applyImplEvalStatusTransition(client));
});

Deno.test('narrow tolerance: an unrelated 404 still fails cleanup', async () => {
  const { client } = operations(
    ['status:impl'],
    () => ({ status: 404, response: { data: { message: 'Not Found' } } }),
  );

  await assertRejects(() => applyImplEvalStatusTransition(client));
});

Deno.test('terminal decision contains exactly one status label', () => {
  const decision = decideImplEvalStatusTransition([
    'type:fix',
    'status:impl',
    'status:plan-eval',
    'area:tooling',
  ]);

  assertEquals(decision, {
    remove: ['status:impl', 'status:plan-eval'],
    add: ['status:impl-eval'],
  });
  const terminal = [
    'type:fix',
    'area:tooling',
    ...decision.add,
  ];
  assertEquals(terminal.filter((label) => label.startsWith('status:')), ['status:impl-eval']);
});

Deno.test('delta-only transition is a no-op when the destination is already the only status', async () => {
  const { client, removed, added } = operations(['type:fix', IMPL_EVAL_STATUS]);
  const decision = await applyStatusTransition(client, IMPL_EVAL_STATUS);
  assertEquals(decision, { remove: [], add: [] });
  assertEquals(removed, []);
  assertEquals(added, []);
});

Deno.test('delta-only transition removes only competing statuses and does not re-add destination', () => {
  assertEquals(
    decideStatusTransition(['status:impl', IMPL_EVAL_STATUS, 'area:tooling'], IMPL_EVAL_STATUS),
    { remove: ['status:impl'], add: [] },
  );
});

Deno.test('phase currency fails closed without spend for stale head or phase', () => {
  const current = decidePhaseEvaluationCurrency({
    eventHead: 'a'.repeat(40),
    liveHead: 'a'.repeat(40),
    expectedStatus: IMPL_EVAL_STATUS,
    liveLabels: [IMPL_EVAL_STATUS],
  });
  assertEquals(current, { dispatch: true, reason: 'current', recovery: '' });

  for (
    const stale of [
      decidePhaseEvaluationCurrency({
        eventHead: 'a'.repeat(40),
        liveHead: 'b'.repeat(40),
        expectedStatus: IMPL_EVAL_STATUS,
        liveLabels: [IMPL_EVAL_STATUS],
      }),
      decidePhaseEvaluationCurrency({
        eventHead: 'a'.repeat(40),
        liveHead: 'a'.repeat(40),
        expectedStatus: IMPL_EVAL_STATUS,
        liveLabels: ['status:impl'],
      }),
    ]
  ) {
    assertEquals(stale.dispatch, false);
    assertStringIncludes(stale.recovery, PHASE_EVAL_RECOVERY);
  }
});

Deno.test('atomic generation claim remains before trigger creation', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-phase-eval.yml');
  const importPrimitive =
    'const { dispatchClaimedPhaseEvaluation, phaseEvalMarker } = await import(';
  const claim = 'const outcome = await dispatchClaimedPhaseEvaluation(';
  const earlyReturn = 'if (!outcome.claimed) {';
  const marker = 'const marker = phaseEvalMarker(claimKey);';
  const create = 'body: `${trigger}\\n${marker}';

  assertStringIncludes(workflow, claim);
  assertStringIncludes(workflow, earlyReturn);
  assertStringIncludes(workflow, marker);
  assertStringIncludes(workflow, create);
  assertEquals(workflow.indexOf(importPrimitive) < workflow.indexOf(claim), true);
  assertEquals(workflow.indexOf(claim) < workflow.indexOf(create), true);
  assertEquals(workflow.indexOf(create) < workflow.indexOf(earlyReturn), true);
});

Deno.test('status mutation failure is attributed, blocks dispatch, and fails the workflow', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-phase-eval.yml');
  const transition = workflowStep(workflow, 'Enter IMPL-EVAL status on ready transition');
  const diagnostic = workflowStep(
    workflow,
    'Record attributed IMPL-EVAL status-transition failure',
  );
  const dispatch = workflowStep(workflow, 'Resolve and dispatch exactly one evaluator');
  const failClosed = workflowStep(
    workflow,
    'Fail closed on IMPL-EVAL status-transition failure',
  );

  assertStringIncludes(transition, 'id: enter_impl_eval_status');
  assertStringIncludes(transition, 'continue-on-error: true');
  assertStringIncludes(transition, 'core.setOutput(');
  assertStringIncludes(transition, "'failure_reason'");
  assertStringIncludes(diagnostic, "steps.enter_impl_eval_status.outcome == 'failure'");
  assertStringIncludes(diagnostic, 'evaluator dispatch blocked');
  assertStringIncludes(diagnostic, 'REQUEST_ACTOR: ${{ github.actor }}');
  assertStringIncludes(diagnostic, 'FAILURE_REASON:');
  assertStringIncludes(diagnostic, 'github.rest.issues.createComment');
  assertStringIncludes(dispatch, '!cancelled()');
  assertStringIncludes(
    dispatch,
    "steps.checkout_trusted_primitive.outcome == 'success'",
  );
  assertStringIncludes(dispatch, "steps.enter_impl_eval_status.outcome == 'success'");
  assertStringIncludes(failClosed, "steps.enter_impl_eval_status.outcome == 'failure'");
  assertStringIncludes(failClosed, 'exit 1');
});

Deno.test('ready transition imports the trusted delta-only status helper', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-phase-eval.yml');
  const transition = workflowStep(workflow, 'Enter IMPL-EVAL status on ready transition');

  assertStringIncludes(workflow, 'Check out trusted phase-eval scripts');
  assertStringIncludes(transition, 'await import(');
  assertStringIncludes(transition, "'.phase-eval-trusted/.github/scripts/phase-eval-status.mjs'");
  assertStringIncludes(transition, 'applyImplEvalStatusTransition');
  assertStringIncludes(transition, 'github.rest.issues.listLabelsOnIssue');
  assertEquals(transition.includes("const STATUS_PREFIX = 'status:'"), false);
  assertEquals(
    workflow.indexOf('Check out trusted phase-eval scripts') <
      workflow.indexOf('Enter IMPL-EVAL status on ready transition'),
    true,
  );
});
