import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from '@std/assert';
import {
  applyImplEvalStatusTransition,
  decideImplEvalStatusTransition,
  type IssueLabelOperations,
} from './phase-eval-status.ts';

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
    () => ({ status: 403, response: { data: { message: 'Resource not accessible by integration' } } }),
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
  const marker = 'const marker = `<!-- openhands-phase-eval generation=${generationEvent.id} phase=${phase} head=${pr.head.sha} -->`;';
  const claim = 'String(comment.body ?? \'\').includes(marker)';
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
