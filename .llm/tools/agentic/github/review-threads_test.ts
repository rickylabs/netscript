import { assertEquals } from '@std/assert';
import {
  assessReviewThreads,
  fetchReviewThreads,
  type ReviewThreadNode,
} from './review-threads.ts';

function thread(values: Partial<ReviewThreadNode> = {}): ReviewThreadNode {
  return {
    isOutdated: false,
    path: 'src/example.ts',
    line: 42,
    originalLine: 40,
    comments: {
      totalCount: 1,
      nodes: [{ author: { login: 'reviewer' }, body: '**Severity: high** Fix this.' }],
    },
    ...values,
  };
}

Deno.test('unanswered review thread blocks', () => {
  const report = assessReviewThreads('rickylabs/netscript', 1056, [thread()]);
  assertEquals(report.ok, false);
  assertEquals(report.unanswered, 1);
  assertEquals(report.threads[0], {
    author: 'reviewer',
    path: 'src/example.ts',
    line: 42,
    severity: 'high',
    answered: false,
    outdated: false,
    blocking: true,
  });
});

Deno.test('replied review thread passes without requiring resolution', () => {
  const report = assessReviewThreads('rickylabs/netscript', 1056, [thread({
    comments: {
      totalCount: 2,
      nodes: [
        { author: { login: 'reviewer' }, body: 'Please change this.' },
        { author: { login: 'author' }, body: 'Fixed in the next commit.' },
      ],
    },
  })]);
  assertEquals(report.ok, true);
  assertEquals(report.threads[0]?.answered, true);
});

Deno.test('reasoned decline is a reply and passes without a code change', () => {
  const report = assessReviewThreads('rickylabs/netscript', 1056, [thread({
    comments: {
      totalCount: 2,
      nodes: [
        { author: { login: 'reviewer' }, body: 'Please change this.' },
        {
          author: { login: 'author' },
          body: 'Declined: command output proves this is intentional.',
        },
      ],
    },
  })]);
  assertEquals(report.ok, true);
  assertEquals(report.unanswered, 0);
});

Deno.test('outdated unanswered review thread is listed but ignored', () => {
  const report = assessReviewThreads('rickylabs/netscript', 1056, [thread({ isOutdated: true })]);
  assertEquals(report.ok, true);
  assertEquals(report.threads[0]?.answered, false);
  assertEquals(report.threads[0]?.outdated, true);
  assertEquals(report.threads[0]?.blocking, false);
});

Deno.test('review-thread GraphQL reader returns every paginated thread', async () => {
  const cursors: Array<string | null> = [];
  const pages = [
    { nodes: [thread({ path: 'first.ts' })], hasNextPage: true, endCursor: 'page-2' },
    { nodes: [thread({ path: 'second.ts' })], hasNextPage: false, endCursor: null },
  ];
  const threads = await fetchReviewThreads(
    'rickylabs/netscript',
    1056,
    'test-token',
    (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { variables: { cursor: string | null } };
      cursors.push(body.variables.cursor);
      const page = pages[cursors.length - 1];
      return Promise.resolve(Response.json({
        data: {
          repository: {
            pullRequest: {
              reviewThreads: {
                nodes: page.nodes,
                pageInfo: {
                  hasNextPage: page.hasNextPage,
                  endCursor: page.endCursor,
                },
              },
            },
          },
        },
      }));
    },
  );
  assertEquals(cursors, [null, 'page-2']);
  assertEquals(threads.map((entry) => entry.path), ['first.ts', 'second.ts']);
});

Deno.test('CI close-gate invokes the answered review-thread task with read-only token access', async () => {
  const workflow = await Deno.readTextFile(
    new URL('../../../../.github/workflows/ci.yml', import.meta.url),
  );
  assertEquals(workflow.includes('name: Answered review-thread gate'), true);
  assertEquals(workflow.includes('deno task agentic:review-threads'), true);
  assertEquals(workflow.includes('GITHUB_TOKEN: ${{ github.token }}'), true);
});
