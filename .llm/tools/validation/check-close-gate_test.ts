import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  closeGatePasses,
  fetchGitHubJsonWithRetry,
  type Finding,
  findStaleIssues,
  findUncheckedAcceptance,
  findUncheckedPrBody,
  formatPrettyReport,
  type PrFinding,
  type Report,
  snapshotIssue,
} from './check-close-gate.ts';

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
          new Response(
            status === 200 ? JSON.stringify({ ok: true }) : 'transient',
            { status, headers: { 'content-type': 'application/json' } },
          ),
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

Deno.test('close-gate snapshots make a pre-edit issue verdict mechanically stale', async () => {
  const evaluated = await snapshotIssue({
    number: 1171,
    title: 'verdict provenance',
    body: '## Acceptance\n- [ ] before edit',
    updated_at: '2026-08-03T19:00:00Z',
  });
  const current = await snapshotIssue({
    number: 1171,
    title: 'verdict provenance',
    body: '## Acceptance\n- [x] after edit',
    updated_at: '2026-08-03T19:10:00Z',
  });

  assertEquals(findStaleIssues([evaluated], [current]), [{
    number: 1171,
    evaluated,
    current,
  }]);
  assertEquals(findStaleIssues([current], [current]), []);
});

Deno.test('close-gate keeps issue pass fail and override semantics unchanged', () => {
  const unchecked = findUncheckedAcceptance({
    number: 1171,
    title: 'verdict provenance',
    body: '## Acceptance\n- [ ] required\n## Planning\n- [ ] not authoritative',
    updated_at: '2026-08-03T19:00:00Z',
  });
  const checked = findUncheckedAcceptance({
    number: 1171,
    title: 'verdict provenance',
    body: '## Acceptance\n- [x] required\n## Planning\n- [ ] not authoritative',
    updated_at: '2026-08-03T19:00:00Z',
  });

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

Deno.test('close-gate pretty log carries report provenance', () => {
  const finding: Finding = {
    issue: 1171,
    title: 'verdict provenance',
    line: 2,
    section: 'Acceptance',
    text: 'required',
  };
  const prFinding: PrFinding = {
    pr: 1181,
    title: 'verdict honesty',
    line: 10,
    section: 'Definition of Done',
    text: 'finish implementation',
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
    evaluatedIssues: [{
      number: 1171,
      updatedAt: '2026-08-03T19:00:00Z',
      bodySha256: 'deadbeef',
    }],
    findings: [finding],
    prFindings: [prFinding],
    notes: [],
  };
  const output = formatPrettyReport(report).join('\n');

  assertStringIncludes(output, 'head SHA: abc123');
  assertStringIncludes(output, 'evaluated at: 2026-08-03T20:00:00Z');
  assertStringIncludes(
    output,
    'evaluated issue: #1171 updatedAt=2026-08-03T19:00:00Z bodySha256=deadbeef',
  );
  assertStringIncludes(output, 'unchecked PR body: #1181 line 10 [Definition of Done]');
});
