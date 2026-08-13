import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { selectLatestCurrentHeadImplEval } from '../lib/agentic-lib.ts';
import { fetchAllPullRequestComments } from './gh-pr.ts';

Deno.test('gh-pr merge requires terminal current-head IMPL provenance by default', async () => {
  const source = await Deno.readTextFile('.llm/tools/agentic/github/gh-pr.ts');
  assertStringIncludes(source, 'evaluateCurrentHeadImplEvalGate');
  assertStringIncludes(source, 'selectLatestCurrentHeadImplEval(comments, currentHead)');
  assertStringIncludes(source, 'fetchLatestVerdict(');
  assertStringIncludes(
    source,
    'evaluateCurrentHeadImplEvalGate(comment !== null, status, headSha)',
  );
  assertStringIncludes(source, 'terminal IMPL PASS for current head ${headSha}');
  assertStringIncludes(source, "gate.blocked === 'no-eval-comment'");
  assertStringIncludes(source, "case '--no-eval-gate':");
});

Deno.test('gh-pr paginates beyond 100 comments until the final short page', async () => {
  const requested: string[] = [];
  const head = 'a'.repeat(40);
  const comments = await fetchAllPullRequestComments(
    'rickylabs',
    'netscript',
    42,
    'secret',
    (_method, path) => {
      requested.push(path);
      const page = Number(new URL(`https://example.test${path}`).searchParams.get('page'));
      const count = page <= 2 ? 100 : 7;
      return Promise.resolve({
        ok: true,
        status: 200,
        body: Array.from({ length: count }, (_, index) => ({
          body: page === 2 && index === 50
            ? [
              '<!-- openhands-agent-summary -->',
              `<!-- openhands-run: ${
                JSON.stringify({ phase: 'impl', evaluated_head: head, verdict: 'PASS' })
              } -->`,
              '## OpenHands Agent — Completed',
            ].join('\n')
            : `page-${page}-comment-${index}`,
          created_at: `2026-08-13T${String(page).padStart(2, '0')}:00:00Z`,
        })),
      });
    },
  );
  assertEquals(comments.length, 207);
  assertEquals(requested, [
    '/repos/rickylabs/netscript/issues/42/comments?per_page=100&page=1',
    '/repos/rickylabs/netscript/issues/42/comments?per_page=100&page=2',
    '/repos/rickylabs/netscript/issues/42/comments?per_page=100&page=3',
  ]);
  assertEquals(comments.at(-1)?.body, 'page-3-comment-6');
  const selected = selectLatestCurrentHeadImplEval(comments, head);
  assertEquals(selected.ok, true, 'a current-head evaluator beyond page 1 remains discoverable');
  if (selected.ok) assertEquals(selected.status.formalVerdict, 'PASS');
});

Deno.test('gh-pr pagination fails closed on any page error', async () => {
  await assertRejects(
    () =>
      fetchAllPullRequestComments('rickylabs', 'netscript', 42, 'secret', (_method, path) => {
        const page = Number(new URL(`https://example.test${path}`).searchParams.get('page'));
        return Promise.resolve(
          page === 1
            ? { ok: true, status: 200, body: Array.from({ length: 100 }, () => ({ body: 'x' })) }
            : { ok: false, status: 503, body: { message: 'unavailable' } },
        );
      }),
    Error,
    'page 2 failed',
  );
});
