import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import type { AcceptanceEvidence } from './acceptance-evidence.ts';
import {
  closingMirrorIssues,
  formatMirrorReport,
  type MirrorClient,
  mirrorIssue,
  readyLabelRepairNotice,
  runAcceptanceEvidenceMirror,
} from './mirror-acceptance-evidence.ts';

Deno.test('ready-label mirror repair reruns CI without moving the evaluated head', () => {
  const notice = readyLabelRepairNotice();
  assertStringIncludes(notice, 'gh run rerun <run-id>');
  assertStringIncludes(notice, 'live reads observe the label');
  assertEquals(notice.includes('labeled event triggers'), false);
  assertEquals(notice.includes('then push'), false);
});

Deno.test('mirror excludes classified pull requests and retains lookup failures', () => {
  assertEquals(
    closingMirrorIssues(
      [1415, 1431, 1432],
      new Map([
        [1415, 'issue'],
        [1431, 'pull request'],
        [1432, 'lookup failed'],
      ]),
    ),
    {
      issues: [1415, 1432],
      notices: [
        'Closing reference #1415 classified as issue; retained for acceptance mirroring.',
        'Closing reference #1431 classified as pull request; excluded from acceptance mirroring.',
        'Closing reference #1432 classification lookup failed; retained for acceptance mirroring.',
      ],
    },
  );
});

Deno.test('mirror retries once from a live body after a mid-air edit', async () => {
  let body = '## Acceptance\n- [ ] criterion';
  let updatedAt = '2026-08-03T10:00:00Z';
  let updates = 0;
  const client: MirrorClient = {
    getIssue: (number) =>
      Promise.resolve({ number, title: 'race', body, updated_at: updatedAt, labels: [] }),
    getPullRequest: () => Promise.reject(new Error('unused')),
    getComments: () => Promise.resolve([]),
    updateIssue: (_number, nextBody) => {
      updates++;
      if (updates === 1) {
        body = '## Acceptance\n- [ ] criterion\n\nconcurrent editor note';
        updatedAt = '2026-08-03T10:00:01Z';
      } else {
        body = nextBody;
        updatedAt = '2026-08-03T10:00:02Z';
      }
      return Promise.resolve();
    },
    postComment: () => Promise.resolve(),
  };
  const evidence: AcceptanceEvidence[] = [{
    issue: 12,
    text: 'criterion',
    evidence: 'CI run',
    legacy: false,
  }];

  const result = await mirrorIssue(client, 12, evidence, false);

  assertEquals(updates, 2);
  assertEquals(result.changed, true);
  assertEquals(body, '## Acceptance\n- [x] criterion\n\nconcurrent editor note');
  assertEquals(result.snapshot.updatedAt, '2026-08-03T10:00:02Z');
});

function dryRunClient(prBody: string, issueBody: string): MirrorClient & { updates: number } {
  const client: MirrorClient & { updates: number } = {
    updates: 0,
    getIssue: (number) =>
      Promise.resolve({
        number,
        title: 'acceptance target',
        body: issueBody,
        updated_at: '2026-08-13T20:00:00Z',
        labels: [],
      }),
    getPullRequest: (number) =>
      Promise.resolve({
        number,
        title: 'draft',
        body: prBody,
        updated_at: '2026-08-13T20:01:00Z',
        labels: [{ name: 'status:ready-merge' }],
        head: { sha: 'abc123' },
        pull_request: {},
      }),
    getComments: () => Promise.resolve([]),
    updateIssue: () => {
      client.updates++;
      return Promise.resolve();
    },
    postComment: () => Promise.resolve(),
  };
  return client;
}

Deno.test('empty evidence is a structured block failure rather than a rejected mirror promise', async () => {
  const client = dryRunClient(
    `Closes #1561

\`\`\`acceptance-evidence
issue: 1561
entries: []
\`\`\``,
    '## Acceptance\n- [ ] parser reports empty evidence',
  );

  const report = await runAcceptanceEvidenceMirror(client, { pr: 1644, dryRun: true }, {
    evaluatedAt: '2026-08-13T20:02:00Z',
  });

  assertEquals(report.ok, false);
  assertEquals(report.changed, []);
  assertEquals(report.errors.length, 1);
  assertStringIncludes(report.errors[0], 'Acceptance-evidence block 1 for issue #1561');
  assertStringIncludes(report.errors[0], 'remove the block');
  assertEquals(client.updates, 0);
});

Deno.test('dry-run reports one zero-checkbox verdict before unmatched indices', async () => {
  const client = dryRunClient(
    `Closes #1621

\`\`\`acceptance-evidence
issue: 1621
entries:
  - box-index: 1
    evidence: "focused test receipt"
  - box-index: 2
    evidence: "quality-job receipt"
\`\`\``,
    '## Acceptance\n- plain bullet one\n- plain bullet two',
  );

  const report = await runAcceptanceEvidenceMirror(client, { pr: 1644, dryRun: true }, {
    evaluatedAt: '2026-08-13T20:02:00Z',
  });
  const rendered = formatMirrorReport(report);

  assertEquals(report.ok, false);
  assertEquals(report.errors, [
    'Issue #1621 has zero close-gated markdown checkboxes; remove its acceptance-evidence block or convert the issue acceptance list to markdown checkboxes.',
  ]);
  assertStringIncludes(rendered, 'acceptance-mirror DRY-RUN: FAILED');
  assertStringIncludes(rendered, 'zero close-gated markdown checkboxes');
  assertEquals(rendered.includes('box-index 1'), false);
  assertEquals(rendered.includes('box-index 2'), false);
  assertEquals(client.updates, 0);
});
