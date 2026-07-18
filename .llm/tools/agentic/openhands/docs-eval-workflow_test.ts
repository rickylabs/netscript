import { assert, assertEquals } from '@std/assert';

type Event = {
  kind: 'ready_for_review' | 'comment' | 'synchronize' | 'labeled';
  body?: string;
  association?: string;
  labels: string[];
  markerExists?: boolean;
};

function decision(event: Event): 'dispatch' | 'dedupe' | 'skip' | 'ignore' {
  const eligible = event.labels.some((label) =>
    label === 'type:docs' || label === 'area:docs' || label === 'ci:full'
  );
  const authorizedRequest = event.kind === 'comment' && event.body === '/docs-eval rerun' &&
    ['OWNER', 'MEMBER', 'COLLABORATOR'].includes(event.association ?? '');
  if (!eligible || (event.kind !== 'ready_for_review' && !authorizedRequest)) return 'ignore';
  if (event.labels.includes('docs-eval:skip')) return 'skip';
  if (event.markerExists) return 'dedupe';
  return 'dispatch';
}

Deno.test('docs eval event matrix permits only ready transition or authorized request', () => {
  const docs = ['type:docs'];
  assertEquals(decision({ kind: 'ready_for_review', labels: docs }), 'dispatch');
  assertEquals(
    decision({ kind: 'comment', body: '/docs-eval rerun', association: 'MEMBER', labels: docs }),
    'dispatch',
  );
  assertEquals(decision({ kind: 'synchronize', labels: docs }), 'ignore');
  assertEquals(decision({ kind: 'labeled', labels: docs }), 'ignore');
  assertEquals(
    decision({ kind: 'comment', body: '/docs-eval rerun', association: 'NONE', labels: docs }),
    'ignore',
  );
  assertEquals(
    decision({ kind: 'comment', body: 'please rerun docs', association: 'OWNER', labels: docs }),
    'ignore',
  );
});

Deno.test('docs eval escape hatches and durable marker are deterministic', () => {
  assertEquals(
    decision({ kind: 'ready_for_review', labels: ['area:docs', 'docs-eval:skip'] }),
    'skip',
  );
  assertEquals(decision({ kind: 'ready_for_review', labels: ['ci:full'] }), 'dispatch');
  assertEquals(
    decision({ kind: 'ready_for_review', labels: ['type:docs'], markerExists: true }),
    'dedupe',
  );
  assertEquals(decision({ kind: 'ready_for_review', labels: [] }), 'ignore');
});

Deno.test('workflow source encodes the serialized exactly-once contract', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/docs-openhands-eval.yml');
  assert(workflow.includes('types: [ready_for_review]'));
  assert(workflow.includes('issue_comment:'));
  assert(!workflow.includes('types: [opened, synchronize, labeled]'));
  assert(workflow.includes("github.event.comment.body == '/docs-eval rerun'"));
  assert(workflow.includes('cancel-in-progress: false'));
  assert(workflow.includes('docs-openhands-eval head=${headSha}'));
  assert(workflow.includes('if (existing)'));
  assert(!workflow.includes('!answered'));
  assert(workflow.includes('secrets.PAT_TOKEN'));
  assert(!workflow.includes('secrets.PAT_TOKEN || secrets.GITHUB_TOKEN'));
});

Deno.test('OpenHands runner installs the missing LiteLLM MCP dependency', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/openhands-agent.yml');
  assert(workflow.includes('uv pip install --system fastapi'));
});
