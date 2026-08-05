import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from 'jsr:@std/assert@1';
import {
  assertCloseGateWorkflowUsesLiveLabels,
  closeGatePasses,
  fetchGitHubJsonWithRetry,
  type Finding,
  findUncheckedAcceptance,
  findUncheckedPrBody,
  formatPrettyReport,
  type PrFinding,
  type Report,
  resolveClosingIssueReferences,
} from './check-close-gate.ts';

Deno.test('close-gate resolves body, commit, and manual closing-reference sources', () => {
  assertEquals(
    resolveClosingIssueReferences(
      [1166, 1171, 1188],
      'Closes #1171',
      ['fix: finish work\n\nFixes #1188'],
    ),
    [
      { issue: 1166, sources: ['manual link'] },
      { issue: 1171, sources: ['body keyword'] },
      { issue: 1188, sources: ['commit message'] },
    ],
  );
});

Deno.test('manual closing link gates unchecked acceptance and removing the link passes', () => {
  const issue = {
    number: 1166,
    title: 'manual close target',
    body: '## Acceptance\n- [ ] prove the result',
    updated_at: '2026-08-03T19:00:00Z',
    labels: [],
  };
  const linked = resolveClosingIssueReferences([1166], 'Refs #1166', []);
  const removed = resolveClosingIssueReferences([], 'Refs #1166', []);

  assertEquals(linked, [{ issue: 1166, sources: ['manual link'] }]);
  assertEquals(closeGatePasses(false, findUncheckedAcceptance(issue).findings, []), false);
  assertEquals(removed, []);
  assertEquals(closeGatePasses(false, [], []), true);
});

Deno.test('body-keyword-only closing behavior is unchanged without external references', () => {
  assertEquals(resolveClosingIssueReferences([], 'Closes #1171', []), [
    { issue: 1171, sources: ['body keyword'] },
  ]);
});

Deno.test('closing-keyword prose inside acceptance-evidence fences is ignored', () => {
  assertEquals(
    resolveClosingIssueReferences(
      [1188],
      'Closes #1188\n\n```acceptance-evidence\nevidence: "fixture resolves #1166"\n```',
      [],
    ),
    [{ issue: 1188, sources: ['body keyword'] }],
  );
});

Deno.test('close-gate retries transient GitHub failures before returning JSON', async () => {
  const statuses = [503, 502, 200];
  const delays: number[] = [];
  let authenticatedCalls = 0;
  let anonymousCalls = 0;
  const result = await fetchGitHubJsonWithRetry<{ ok: boolean }>(
    'https://api.github.test/pulls/772',
    'test-token',
    {
      fetch: (_url, init) => {
        const authenticated = new Headers(init?.headers).has('authorization');
        if (!authenticated) {
          anonymousCalls++;
          return Promise.resolve(new Response('private', { status: 404 }));
        }
        const status = statuses[authenticatedCalls++];
        return Promise.resolve(
          new Response(status === 200 ? JSON.stringify({ ok: true }) : 'transient', {
            status,
            headers: { 'content-type': 'application/json' },
          }),
        );
      },
      sleep: (milliseconds) => {
        delays.push(milliseconds);
        return Promise.resolve();
      },
    },
  );
  assertEquals(result, { ok: true });
  assertEquals(authenticatedCalls, 3);
  assertEquals(anonymousCalls, 2);
  assertEquals(delays, [1_000, 2_000]);
});

Deno.test('close-gate falls back to public metadata after an authenticated 5xx', async () => {
  const authorizations: boolean[] = [];
  const result = await fetchGitHubJsonWithRetry<{ number: number }>(
    'https://api.github.test/pulls/772',
    'test-token',
    {
      fetch: (_url, init) => {
        const authenticated = new Headers(init?.headers).has('authorization');
        authorizations.push(authenticated);
        return Promise.resolve(
          authenticated
            ? new Response('transient', { status: 503 })
            : Response.json({ number: 772 }),
        );
      },
      sleep: () => Promise.resolve(),
    },
  );
  assertEquals(result, { number: 772 });
  assertEquals(authorizations, [true, false]);
});

Deno.test('close-gate does not retry non-transient GitHub failures', async () => {
  let calls = 0;
  await assertRejects(
    () =>
      fetchGitHubJsonWithRetry('https://api.github.test/pulls/772', 'test-token', {
        fetch: () => {
          calls++;
          return Promise.resolve(new Response('forbidden', { status: 403 }));
        },
        sleep: () => Promise.resolve(),
      }),
    Error,
    '403 forbidden',
  );
  assertEquals(calls, 1);
});

Deno.test('close-gate keeps issue pass fail and override semantics with rebuilt findings', () => {
  const unchecked = findUncheckedAcceptance({
    number: 1171,
    title: 'verdict provenance',
    body: '## Acceptance\n- [ ] required\n## Planning\n- [ ] not authoritative',
    updated_at: '2026-08-03T19:00:00Z',
    labels: [],
  }).findings;
  const checked = findUncheckedAcceptance({
    number: 1171,
    title: 'verdict provenance',
    body: '## Acceptance\n- [x] required\n## Planning\n- [ ] not authoritative',
    updated_at: '2026-08-03T19:00:00Z',
    labels: [],
  }).findings;
  assertEquals(unchecked.length, 1);
  assertEquals(checked, []);
  assertEquals(closeGatePasses(false, unchecked, []), false);
  assertEquals(closeGatePasses(false, checked, []), true);
  assertEquals(closeGatePasses(true, unchecked, []), true);
});

Deno.test('close-gate fails unchecked PR DoD but ignores non-authoritative checklists', () => {
  const findings = findUncheckedPrBody({
    number: 1181,
    title: 'verdict honesty',
    head: { sha: 'abc123' },
    body: [
      '## Slices',
      '- [ ] progress only',
      '## Definition of Done',
      '- [ ] authoritative claim',
      '## Notes',
      '- [ ] ordinary checklist',
    ].join('\n'),
  });
  assertEquals(findings.map(({ line, section, text }) => ({ line, section, text })), [{
    line: 4,
    section: 'Definition of Done',
    text: 'authoritative claim',
  }]);
  assertEquals(closeGatePasses(false, [], findings), false);
});

Deno.test('close-gate pretty log carries rebuilt provenance and PR findings', () => {
  const finding: Finding = {
    issue: 1171,
    title: 'verdict provenance',
    line: 2,
    section: 'Acceptance',
    text: 'required',
    action: 'tick the issue box',
  };
  const prFinding: PrFinding = {
    pr: 1181,
    title: 'verdict honesty',
    line: 10,
    section: 'Definition of Done',
    text: 'finish implementation',
    action: 'tick the PR box',
  };
  const report: Report = {
    gate: 'close-gate',
    ok: false,
    repo: 'rickylabs/netscript',
    pr: 1181,
    headSha: 'abc123',
    evaluatedAt: '2026-08-03T20:00:00Z',
    overrideLabel: 'status:close-gate-override',
    overrideActive: false,
    closingIssues: [1171],
    closingIssueReferences: [{ issue: 1171, sources: ['body keyword'] }],
    issues: [{
      number: 1171,
      updatedAt: '2026-08-03T19:00:00Z',
      bodySha256: 'deadbeef',
    }],
    findings: [finding],
    prFindings: [prFinding],
    notes: [],
  };
  const output = formatPrettyReport(report).join('\n');
  assertStringIncludes(output, 'provenance: head=abc123 evaluated=2026-08-03T20:00:00Z');
  assertStringIncludes(
    output,
    'snapshot: #1171 updated=2026-08-03T19:00:00Z bodySha256=deadbeef',
  );
  assertStringIncludes(output, 'unchecked PR body: #1181 line 10 [Definition of Done]');
  assertStringIncludes(output, 'closing reference: #1171 source: body keyword');
});

Deno.test('close-gate workflow guard accepts live reads and fires on frozen label regression', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/ci.yml');
  assertCloseGateWorkflowUsesLiveLabels(workflow);
  assertThrows(
    () =>
      assertCloseGateWorkflowUsesLiveLabels(`jobs:
  close-gate:
    if: contains(github.event.pull_request.labels.*.name, 'status:ready-merge')
  next-job:
    runs-on: ubuntu-latest
`),
    Error,
    'reads frozen github.event.pull_request.labels',
  );
});

Deno.test('post-merge close-gate box is excluded with a visible notice', () => {
  const result = findUncheckedAcceptance({
    number: 1142,
    title: 'release gate',
    body: '## Acceptance\n- [ ] [post-merge] verify production',
    updated_at: '2026-08-03T10:00:00Z',
    labels: [],
  });
  assertEquals(result.findings, []);
  assertEquals(result.notices[0].includes('excluded post-merge box'), true);
});
