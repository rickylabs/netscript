import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import {
  applyImplEvalStatusTransition,
  decideImplEvalStatusTransition,
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

Deno.test('generation deduplication remains before trigger creation', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-phase-eval.yml');
  const marker =
    'const marker = `<!-- openhands-phase-eval generation=${generationEvent.id} phase=${phase} head=${pr.head.sha} -->`;';
  const claim = "String(comment.body ?? '').includes(marker)";
  const earlyReturn = 'if (existing) {';
  const create = 'github.rest.issues.createComment({';

  assertStringIncludes(workflow, marker);
  assertStringIncludes(workflow, claim);
  assertStringIncludes(workflow, earlyReturn);
  assertStringIncludes(workflow, create);
  assertEquals(workflow.indexOf(marker) < workflow.indexOf(claim), true);
  assertEquals(workflow.indexOf(claim) < workflow.indexOf(earlyReturn), true);
  assertEquals(workflow.indexOf(earlyReturn) < workflow.indexOf(create), true);
});

Deno.test('status bookkeeping failures are reported but cannot suppress dispatch', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-phase-eval.yml');
  const checkout = workflowStep(workflow, 'Check out trusted phase-eval scripts');
  const transition = workflowStep(workflow, 'Enter IMPL-EVAL status on ready transition');
  const diagnostic = workflowStep(
    workflow,
    'Record attributed IMPL-EVAL status-transition failure',
  );
  const dispatch = workflowStep(workflow, 'Resolve and dispatch exactly one evaluator');

  assertStringIncludes(checkout, 'continue-on-error: true');
  assertStringIncludes(checkout, 'persist-credentials: false');
  assertStringIncludes(checkout, 'github.event.pull_request.base.ref');
  assertStringIncludes(transition, 'id: enter_impl_eval_status');
  assertStringIncludes(transition, 'continue-on-error: true');
  assertStringIncludes(transition, 'core.setOutput(');
  assertStringIncludes(transition, "'failure_reason'");
  assertStringIncludes(diagnostic, "steps.enter_impl_eval_status.outcome == 'failure'");
  assertStringIncludes(diagnostic, 'evaluator dispatch continues');
  assertStringIncludes(diagnostic, 'REQUEST_ACTOR: ${{ github.actor }}');
  assertStringIncludes(diagnostic, 'FAILURE_REASON:');
  assertStringIncludes(dispatch, '!cancelled()');
  assertStringIncludes(
    dispatch,
    "steps.require_chainable_trigger_token.outcome == 'success'",
  );
  assertEquals(dispatch.includes('enter_impl_eval_status.outcome'), false);
  assertEquals(dispatch.includes('checkout_trusted_phase_eval_scripts.outcome'), false);
});
