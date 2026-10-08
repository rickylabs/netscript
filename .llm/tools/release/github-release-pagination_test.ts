import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fetchClosedIssues, generateWhatsChanged } from './github-release.ts';
import type { GitHubResponse } from './github-api.ts';

const repo = `${crypto.randomUUID()}/${crypto.randomUUID()}`;
const since = new Date(0).toISOString();
const issue = (number: number) => ({ number, title: `issue ${number}` });
const response = (items: unknown[], total_count: number): GitHubResponse => ({
  ok: true,
  status: 200,
  body: { items, total_count, incomplete_results: false },
});

Deno.test('closed issues paginate raw results beyond one page preserving order and PR guard', async () => {
  const items: unknown[] = Array.from({ length: 205 }, (_, index) => issue(index + 1));
  items[1] = { ...issue(2), pull_request: {} };
  items[101] = issue(100);
  const paths: string[] = [];
  const result = await fetchClosedIssues(repo, '', since, (method, path) => {
    assertEquals(method, 'GET');
    paths.push(path);
    const page = Number(new URLSearchParams(path.split('?')[1]).get('page'));
    return Promise.resolve(response(items.slice((page - 1) * 100, page * 100), items.length));
  });
  assertEquals(paths.length, 3);
  for (const [index, path] of paths.entries()) {
    const query = new URLSearchParams(path.split('?')[1]);
    assertEquals(query.get('page'), String(index + 1));
    assertEquals(query.get('per_page'), '100');
    assertEquals(query.get('sort'), 'updated');
    assertEquals(query.get('order'), 'desc');
    assertStringIncludes(query.get('q')!, `closed:>${since}`);
  }
  assertEquals(result, items.filter((_, index) => index !== 1 && index !== 101));
});

Deno.test('empty closed-issue window terminates after the first valid empty page', async () => {
  let calls = 0;
  assertEquals(
    await fetchClosedIssues(repo, '', '', () => {
      calls++;
      return Promise.resolve(response([], 0));
    }),
    [],
  );
  assertEquals(calls, 1);
});

Deno.test('closed-issue search ceiling explicitly refuses truncated notes', async () => {
  for (const total of [1000, 1001]) {
    await assertRejects(
      () => fetchClosedIssues(repo, '', since, () => Promise.resolve(response([], total))),
      Error,
      '1000-result ceiling; narrow the release window',
    );
  }
});

Deno.test('failed incomplete and malformed search pages never become complete notes', async () => {
  const bad: GitHubResponse[] = [
    { ok: false, status: 504, body: {} },
    { ok: true, status: 200, body: { items: [], total_count: 0, incomplete_results: true } },
    { ok: true, status: 200, body: { total_count: 0, incomplete_results: false } },
    { ok: true, status: 200, body: { items: [], total_count: -1, incomplete_results: false } },
    { ok: true, status: 200, body: { items: [], total_count: 0 } },
    response([{}], 1),
  ];
  for (const page of bad) {
    await assertRejects(
      () => fetchClosedIssues(repo, '', since, () => Promise.resolve(page)),
      Error,
    );
  }
  let calls = 0;
  await assertRejects(
    () =>
      fetchClosedIssues(repo, '', since, () => {
        calls++;
        return Promise.resolve(
          calls === 1 ? response(Array.from({ length: 100 }, (_, i) => issue(i + 1)), 101) : bad[0],
        );
      }),
    Error,
    'page 2 failed',
  );
});

Deno.test('short pages and changing totals refuse an incomplete release window', async () => {
  await assertRejects(
    () => fetchClosedIssues(repo, '', since, () => Promise.resolve(response([issue(1)], 2))),
    Error,
    'ended before total_count',
  );
  let calls = 0;
  await assertRejects(
    () =>
      fetchClosedIssues(repo, '', since, () => {
        calls++;
        return Promise.resolve(response(
          Array.from({ length: calls === 1 ? 100 : 50 }, (_, i) => issue(i + calls * 100)),
          calls === 1 ? 205 : 150,
        ));
      }),
    Error,
    'total changed',
  );
});

Deno.test('native merged-PR notes preserve a body beyond a search page without client truncation', async () => {
  const body = Array.from({ length: 205 }, (_, index) => `* merged PR ${index + 1}`).join('\n');
  let calls = 0;
  const result = await generateWhatsChanged(
    repo,
    '',
    'v0.0.8',
    'v0.0.7',
    (method, path, _token, payload) => {
      calls++;
      assertEquals(method, 'POST');
      assertEquals(path, `/repos/${repo}/releases/generate-notes`);
      assertEquals(payload, { tag_name: 'v0.0.8', previous_tag_name: 'v0.0.7' });
      return Promise.resolve({ ok: true, status: 200, body: { body } });
    },
  );
  assertEquals(result, body);
  assertEquals(calls, 1);
});
