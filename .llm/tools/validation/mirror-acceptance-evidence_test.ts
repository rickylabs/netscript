import { assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@1';
import type { AcceptanceEvidence } from './acceptance-evidence.ts';
import {
  closingMirrorIssues,
  formatMirrorReport,
  GitHubClient,
  type MirrorClient,
  mirrorIssue,
  parseMirrorArgs,
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
    isCommitOnMain: () => Promise.reject(new Error('unused in CI')),
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
    isCommitOnMain: () => Promise.reject(new Error('unused in CI')),
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

Deno.test('mirror reports an unmatched index without rejecting or mutating', async () => {
  const client = dryRunClient(
    `Closes #1561

\`\`\`acceptance-evidence
issue: 1561
entries:
  - box-index: 1
    evidence: "focused test receipt"
  - box-index: 2
    evidence: "index does not exist"
\`\`\``,
    '## Acceptance\n- [ ] parser reports authoring failures',
  );

  const report = await runAcceptanceEvidenceMirror(client, { pr: 1644, dryRun: true }, {
    evaluatedAt: '2026-08-13T20:02:00Z',
  });

  assertEquals(report.ok, false);
  assertEquals(report.errors, [
    'Issue #1561: no acceptance box matched box-index 2; add an entry for box "#2" using exact trimmed text or its current box-index.',
  ]);
  assertEquals(client.updates, 0);
});

const TARGET_ISSUE = 2524;
const SOURCE_PR = 2558;
const MERGED_SHA = '6a6a82e15';
const SQUASHED_HEAD = '5f837c0aa';
const CHECKBOX_TEXT = 'mirror verified acceptance';

function evidenceBlock(issue: number, text: string, evidence: string): string {
  return [
    '```acceptance-evidence',
    `issue: ${issue}`,
    'entries:',
    `- box: ${JSON.stringify(text)}`,
    `  evidence: ${JSON.stringify(evidence)}`,
    '```',
  ].join('\n');
}

/** Models live issue writes and ancestry queries without any real GitHub mutation. */
function postMergeClient() {
  let body = `## Acceptance\n- [ ] ${CHECKBOX_TEXT}`;
  const pr = {
    number: SOURCE_PR,
    title: 'merged Refs-only change',
    body: `Refs #${TARGET_ISSUE}`,
    updated_at: '2026-11-01T10:00:00Z',
    labels: [] as string[],
    head: { sha: SQUASHED_HEAD },
    merged: true,
  };
  const comments = [{
    html_url: 'https://github.com/owner/repo/pull/2558#issuecomment-1',
    body: evidenceBlock(TARGET_ISSUE, CHECKBOX_TEXT, `Merged as ${MERGED_SHA}; CI run 41287999781`),
  }];
  const updates: Array<{ number: number; body: string }> = [];
  const posts: Array<{ number: number; body: string }> = [];
  const checkedShas: string[] = [];
  const fetchedIssues: number[] = [];
  const client = {
    getIssue: (number: number) => {
      fetchedIssues.push(number);
      return Promise.resolve({
        number,
        title: 'acceptance target',
        body,
        updated_at: '2026-11-01T10:01:00Z',
      });
    },
    getPullRequest: () => Promise.resolve(pr),
    getComments: (number: number) =>
      Promise.resolve(
        number === SOURCE_PR ? comments : posts.map(
          (post) => ({ html_url: '', body: post.body }),
        ),
      ),
    isCommitOnMain: (sha: string) => {
      checkedShas.push(sha);
      return Promise.resolve(sha === MERGED_SHA);
    },
    updateIssue: (number: number, nextBody: string) => {
      body = nextBody;
      updates.push({ number, body });
      return Promise.resolve();
    },
    postComment: (number: number, comment: string) => {
      posts.push({ number, body: comment });
      return Promise.resolve();
    },
  };
  return { client, pr, comments, updates, posts, checkedShas, fetchedIssues };
}

Deno.test('post-merge CLI defaults to dry-run and requires explicit apply', () => {
  const base = ['--repo', 'owner/repo', '--pr', '2558'];
  assertEquals(parseMirrorArgs(base).dryRun, false);
  assertEquals(parseMirrorArgs([...base, '--dry-run']).dryRun, true);
  assertEquals(parseMirrorArgs([...base, '--issue', '2524']).dryRun, true);
  assertEquals(parseMirrorArgs([...base, '--apply', '--issue', '2524']).dryRun, false);
  assertThrows(() => parseMirrorArgs([...base, '--apply']), Error, '--issue');
  assertThrows(() => parseMirrorArgs([...base, '--issue', '0']), Error);
  assertThrows(() => parseMirrorArgs([...base, '--issue', '2.5']), Error);
  assertThrows(() => parseMirrorArgs([...base, '--issue', '2524', '--apply', '--dry-run']), Error);
});

Deno.test('post-merge reads comment evidence for a Refs-only unlabeled PR without writing by default', async () => {
  const fixture = postMergeClient();
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
  });
  assertEquals(report.ok, true);
  assertEquals(report.dryRun, true);
  assertEquals(report.changed, [TARGET_ISSUE]);
  assertEquals(fixture.checkedShas, [MERGED_SHA]);
  assertEquals(fixture.updates, []);
  assertEquals(fixture.posts, []);
});

Deno.test('post-merge selects body evidence and ignores another issue in comments', async () => {
  const fixture = postMergeClient();
  fixture.pr.body += '\n' + evidenceBlock(TARGET_ISSUE, CHECKBOX_TEXT, `Commit ${MERGED_SHA}`);
  fixture.comments[0].body = evidenceBlock(9999, 'unrelated box', `Commit ${SQUASHED_HEAD}`);
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
  });
  assertEquals(report.ok, true);
  assertEquals(report.changed, [TARGET_ISSUE]);
  assertEquals(fixture.checkedShas, [MERGED_SHA]);
  assertEquals(fixture.fetchedIssues.every((number) => number === TARGET_ISSUE), true);
});

Deno.test('post-merge refuses an unmerged PR even with apply and matching evidence', async () => {
  const fixture = postMergeClient();
  fixture.pr.merged = false;
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    apply: true,
  });
  assertEquals(report.ok, false);
  assertStringIncludes(report.errors.join('\n'), 'must be merged');
  assertEquals(fixture.updates, []);
  assertEquals(fixture.posts, []);
});

Deno.test('post-merge refuses every unreachable citation including a squash head', async () => {
  const fixture = postMergeClient();
  fixture.comments[0].body = evidenceBlock(
    TARGET_ISSUE,
    CHECKBOX_TEXT,
    `Merged as ${MERGED_SHA} from head ${SQUASHED_HEAD}`,
  );
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    apply: true,
  });
  assertEquals(report.ok, false);
  assertStringIncludes(report.errors.join('\n'), `${SQUASHED_HEAD} is not reachable from main`);
  assertEquals(fixture.checkedShas, [MERGED_SHA, SQUASHED_HEAD]);
  assertEquals(fixture.updates, []);
  assertEquals(fixture.posts, []);
});

Deno.test('post-merge rejects a box text mismatch through the shared mapping validator', async () => {
  const fixture = postMergeClient();
  fixture.comments[0].body = evidenceBlock(
    TARGET_ISSUE,
    'different checkbox',
    `Commit ${MERGED_SHA}`,
  );
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    apply: true,
  });
  assertEquals(report.ok, false);
  assertStringIncludes(report.errors.join('\n'), 'no acceptance box matched exact box text');
  assertEquals(fixture.updates, []);
  assertEquals(fixture.posts, []);
});

Deno.test('post-merge apply uses existing checkbox and provenance format and is idempotent', async () => {
  const fixture = postMergeClient();
  const options = { pr: SOURCE_PR, issue: TARGET_ISSUE, apply: true };
  const report = await runAcceptanceEvidenceMirror(fixture.client, options);
  assertEquals(report.ok, true);
  assertEquals(report.dryRun, false);
  assertEquals(fixture.updates, [{
    number: TARGET_ISSUE,
    body: `## Acceptance\n- [x] ${CHECKBOX_TEXT}`,
  }]);
  assertEquals(fixture.posts.length, 1);
  assertEquals(fixture.posts[0].number, TARGET_ISSUE);
  assertStringIncludes(
    fixture.posts[0].body,
    '<!-- acceptance-evidence-mirror:pr=2558;issue=2524 -->',
  );
  assertStringIncludes(fixture.posts[0].body, 'Acceptance evidence mirrored from #2558.');
  assertStringIncludes(fixture.posts[0].body, `"${CHECKBOX_TEXT}" — Merged as ${MERGED_SHA}`);
  assertStringIncludes(
    fixture.posts[0].body,
    `Provenance: updatedAt=${report.issues[0].updatedAt}; bodySha256=${
      report.issues[0].bodySha256
    }`,
  );
  const second = await runAcceptanceEvidenceMirror(fixture.client, options);
  assertEquals(second.changed, []);
  assertEquals(fixture.updates.length, 1);
  assertEquals(fixture.posts.length, 1);
});

Deno.test('CI mode still requires the live label and closing references and writes without apply', async () => {
  const fixture = postMergeClient();
  fixture.pr.merged = false;
  // Neither merge state nor main ancestry participates in the legacy CI contract.
  fixture.comments[0].body = evidenceBlock(TARGET_ISSUE, CHECKBOX_TEXT, `Head ${SQUASHED_HEAD}`);
  fixture.pr.body = `Closes #${TARGET_ISSUE}`;
  const skipped = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    dryRun: false,
  });
  assertEquals(skipped.ok, true);
  assertEquals(skipped.changed, []);
  assertStringIncludes(
    skipped.warnings.join('\n'),
    'live PR labels do not include status:ready-merge',
  );
  assertEquals(fixture.updates, []);
  fixture.pr.labels.push('status:ready-merge');
  fixture.pr.body = `Refs #${TARGET_ISSUE}`;
  const refsOnly = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    dryRun: false,
  });
  assertEquals(refsOnly.changed, []);
  assertEquals(fixture.updates, []);
  fixture.pr.body = `Closes #${TARGET_ISSUE}`;
  const applied = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    dryRun: false,
  });
  assertEquals(applied.ok, true);
  assertEquals(applied.changed, [TARGET_ISSUE]);
  assertEquals(fixture.updates.length, 1);
  assertEquals(fixture.checkedShas, []);
});

Deno.test('GitHub ancestry adapter accepts only ancestor or identical commits', async () => {
  for (const status of ['ahead', 'identical', 'behind', 'diverged']) {
    const client = new GitHubClient('owner/repo', 'unused', (input) => {
      assertEquals(
        String(input),
        `https://api.github.com/repos/owner/repo/compare/${MERGED_SHA}...main`,
      );
      return Promise.resolve(Response.json({ status }));
    });
    assertEquals(await client.isCommitOnMain(MERGED_SHA), ['ahead', 'identical'].includes(status));
  }
});

Deno.test('post-merge production comment reads paginate beyond the first page', async () => {
  const requested: string[] = [];
  const target = evidenceBlock(TARGET_ISSUE, CHECKBOX_TEXT, `Commit ${MERGED_SHA}`);
  const client = new GitHubClient('owner/repo', 'unused', (input) => {
    requested.push(String(input));
    const page = requested.length === 1
      ? Array.from({ length: 100 }, () => ({ html_url: '', body: 'ordinary comment' }))
      : [{ html_url: '', body: target }];
    return Promise.resolve(Response.json(page));
  });
  const comments = await client.getComments(SOURCE_PR, true);
  assertEquals(comments.length, 101);
  assertEquals(comments[100].body, target);
  assertEquals(requested, [
    'https://api.github.com/repos/owner/repo/issues/2558/comments?per_page=100&page=1',
    'https://api.github.com/repos/owner/repo/issues/2558/comments?per_page=100&page=2',
  ]);
});

Deno.test('post-merge combines selected body and comment entries', async () => {
  const fixture = postMergeClient();
  const secondText = 'second acceptance criterion';
  const getIssue = fixture.client.getIssue;
  fixture.client.getIssue = async (number) => {
    const issue = await getIssue(number);
    return { ...issue, body: issue.body + `\n- [ ] ${secondText}` };
  };
  fixture.pr.body += '\n' + evidenceBlock(TARGET_ISSUE, secondText, `Commit ${MERGED_SHA}`);
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
  });
  assertEquals(report.ok, true);
  assertEquals(report.changed, [TARGET_ISSUE]);
  assertEquals(fixture.checkedShas, [MERGED_SHA]);
  assertEquals(fixture.updates, []);
});

Deno.test('post-merge dryRun false alone cannot opt into writes', async () => {
  const fixture = postMergeClient();
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    dryRun: false,
  });
  assertEquals(report.ok, true);
  assertEquals(report.dryRun, true);
  assertEquals(fixture.updates, []);
  assertEquals(fixture.posts, []);
});

Deno.test('post-merge rejects missing selected structured evidence even for checked boxes', async () => {
  const fixture = postMergeClient();
  fixture.comments[0].body = evidenceBlock(9999, 'other issue', `Commit ${MERGED_SHA}`);
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    apply: true,
  });
  assertEquals(report.ok, false);
  assertStringIncludes(report.errors.join('\n'), 'no acceptance-evidence entries for issue #2524');
  assertEquals(fixture.updates, []);
  assertEquals(fixture.posts, []);
});

Deno.test('post-merge validates citations for already checked boxes', async () => {
  const fixture = postMergeClient();
  const getIssue = fixture.client.getIssue;
  fixture.client.getIssue = async (number) => {
    const issue = await getIssue(number);
    return { ...issue, body: issue.body.replace('[ ]', '[x]') };
  };
  fixture.comments[0].body = evidenceBlock(TARGET_ISSUE, CHECKBOX_TEXT, `Commit ${SQUASHED_HEAD}`);
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    apply: true,
  });
  assertEquals(report.ok, false);
  assertEquals(fixture.checkedShas, [SQUASHED_HEAD]);
  assertEquals(fixture.updates, []);
});

Deno.test('post-merge commit citations include URLs, full hashes and numeric labels but skip run IDs', async () => {
  const fixture = postMergeClient();
  fixture.comments[0].body = evidenceBlock(
    TARGET_ISSUE,
    CHECKBOX_TEXT,
    [
      `Merged as ${MERGED_SHA.toUpperCase()}, repeated ${MERGED_SHA}.`,
      'https://github.com/owner/repo/commit/1234567',
      'SHA: 2345678; commit 3456789; head `4567890`;',
      'Merged as 5678901; https://github.com/owner/repo/commits/6789012; commit abc123;',
      '1234567890123456789012345678901234567890;',
      'CI run 41287999781; byte count 2159810.',
    ].join(' '),
  );
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    apply: true,
  });
  assertEquals(report.ok, false);
  assertEquals(fixture.checkedShas, [
    MERGED_SHA,
    '1234567',
    '2345678',
    '3456789',
    '4567890',
    '5678901',
    '6789012',
    'abc123',
    '1234567890123456789012345678901234567890',
  ]);
  assertEquals(fixture.updates, []);
});

Deno.test('post-merge fails closed when ancestry lookup is unavailable', async () => {
  const fixture = postMergeClient();
  fixture.client.isCommitOnMain = () => Promise.reject(new Error('GitHub API 404'));
  const report = await runAcceptanceEvidenceMirror(fixture.client, {
    pr: SOURCE_PR,
    issue: TARGET_ISSUE,
    apply: true,
  });
  assertEquals(report.ok, false);
  assertStringIncludes(
    report.errors.join('\n'),
    `Unable to verify cited SHA ${MERGED_SHA} on main`,
  );
  assertEquals(fixture.updates, []);
  assertEquals(fixture.posts, []);
});
