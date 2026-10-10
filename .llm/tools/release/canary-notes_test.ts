import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import {
  canaryLabelFor,
  type CanaryPayload,
  canaryReleasePayload,
  checkCanaryDrift,
  deriveCanaryPayload,
  GitHubClient,
  renderCanaryReleaseNote,
} from './canary-label.ts';
import {
  type CanaryNoteContext,
  migrationNote,
  publicReleaseText,
  referencedIssues,
  releaseClosingIssues,
} from './canary-notes.ts';
import { breakingMigrationFindings } from '../validation/check-breaking-migration.ts';
import { discoverWorkspaceMembers } from './publish-workspace.ts';

const repo = 'rickylabs/netscript';
interface Fixture {
  publishedVersion: string;
  previous: string;
  payload: CanaryPayload;
  context: CanaryNoteContext;
  releaseBody: string;
}
const fixture: Fixture = JSON.parse(
  await Deno.readTextFile(new URL('./tests/fixtures/canary.3-notes.json', import.meta.url)),
);
function render(payload: CanaryPayload = fixture.payload): string {
  return renderCanaryReleaseNote(
    fixture.publishedVersion,
    fixture.previous,
    payload,
    repo,
    fixture.context,
  );
}

Deno.test('canary.3 fixture composes sections 1–6 and preserves exact provenance and PR list', () => {
  const note = render();
  assertEquals(fixture.payload.pullRequests.length, 61);
  let previous = -1;
  for (
    const section of [
      '**What this canary is for.**',
      '## Highlights',
      '## Breaking changes and migration',
      '## Known open follow-ups',
      '## Trying this canary',
      'Canary payload derived',
      '## Included pull requests',
    ]
  ) {
    const index = note.indexOf(section);
    assert(index > previous, `${section} must appear in order`);
    previous = index;
  }
  for (
    const text of [
      'NetScript 0.0.8',
      'canary.3',
      '61 pull requests',
      'pre-release',
      'Latest stays v0.0.7',
      'All 35',
      '/actions/runs/38059950011',
      '/actions/runs/38060469468',
      'jsr:@netscript/service@0.0.8-canary.3',
      '24-hour',
      'minimumDependencyAge: 0',
      'closes no linked issues',
    ]
  ) assertStringIncludes(note, text);
  assertEquals(
    note.slice(note.indexOf('Canary payload derived')),
    fixture.releaseBody.slice(fixture.releaseBody.indexOf('Canary payload derived')).trimEnd() +
      '\n',
  );
});

Deno.test('composer gives byte-identical output for identical inputs and metadata key ordering', () => {
  const input = JSON.stringify(fixture);
  assertEquals(render(), render(JSON.parse(input).payload));
  assertEquals(JSON.stringify(fixture), input);
  const details = Object.fromEntries(
    Object.entries(fixture.payload.pullRequestDetails!).reverse().map((
      [id, pr],
    ) => [id, { ...pr, labels: [...pr.labels].reverse() }]),
  );
  assertEquals(
    render(),
    render({
      ...fixture.payload,
      pullRequestDetails: details,
      followUps: [...fixture.payload.followUps!].reverse(),
    }),
  );
});

Deno.test('highlights group by area labels then conventional scope and strip commit syntax', () => {
  const payload: CanaryPayload = {
    ...fixture.payload,
    pullRequests: [1, 2, 3],
    pullRequestTitles: {
      1: 'fix(sdk): preserve context',
      2: 'feat(cli): improve scaffolding',
      3: 'chore: refresh tools',
    },
    pullRequestDetails: {
      1: { title: 'fix(sdk): preserve context', body: '', labels: ['area:service'] },
      2: { title: 'feat(cli): improve scaffolding', body: '', labels: [] },
      3: { title: 'chore: refresh tools', body: '', labels: [] },
    },
  };
  const highlights = render(payload).split('## Highlights\n')[1].split('## Breaking changes')[0];
  assertStringIncludes(highlights, '### service\n\n- preserve context');
  assertStringIncludes(highlights, '### cli\n\n- improve scaffolding');
  assertStringIncludes(highlights, '### other\n\n- refresh tools');
  assertEquals(highlights.includes('fix(sdk):'), false);
});

Deno.test('breaking PR without migration is visible and rejected at PR time', () => {
  for (
    const pr of [
      { title: 'fix(auth)!: enforce ownership', body: '## Summary\nTighten policy.', labels: [] },
      {
        title: 'feat(service): change policy',
        body: '## Breaking changes and migration\n<!-- add notes -->',
        labels: ['breaking'],
      },
    ]
  ) {
    const payload: CanaryPayload = {
      ...fixture.payload,
      pullRequests: [1],
      pullRequestTitles: { 1: pr.title },
      pullRequestDetails: { 1: pr },
    };
    assertStringIncludes(render(payload), 'migration note missing');
    assertEquals(breakingMigrationFindings(pr).length, 1);
  }
  const pr = {
    title: 'fix(auth)!: enforce ownership',
    body:
      '## Breaking changes and migration\nPass an owned session.\n```ts\nconst policy = "owned";\n```\n### Details\nUse revokeSession for operators.\n## Validation\nprivate evidence',
    labels: [],
  };
  assertStringIncludes(
    render({
      ...fixture.payload,
      pullRequests: [1],
      pullRequestTitles: { 1: pr.title },
      pullRequestDetails: { 1: pr },
    }),
    'Pass an owned session.',
  );
  assertStringIncludes(migrationNote(pr.body)!, 'const policy');
  assertEquals(migrationNote(pr.body)!.includes('private evidence'), false);
  assertEquals(breakingMigrationFindings(pr), []);
  assertEquals(
    breakingMigrationFindings({ ...pr, title: 'fix(auth): ordinary fix', body: '' }),
    [],
  );
});

Deno.test('follow-ups require explicit references, open state and true closing semantics', () => {
  const body =
    'Refs #11, #12, #13, #14, #15\nThis does not close #11.\nclosed: #12\nCloses #13\n```text\nRefs #16\nCloses #11\n```';
  assertEquals(releaseClosingIssues(body), [13]);
  assertEquals(referencedIssues(body), [11, 12, 13, 14, 15]);
  const payload: CanaryPayload = {
    ...fixture.payload,
    pullRequests: [1],
    pullRequestTitles: { 1: 'fix(cli): partial scope' },
    pullRequestDetails: { 1: { title: 'fix(cli): partial scope', body, labels: [] } },
    followUps: [
      { number: 11, title: 'Negated closure remains open', state: 'open' },
      { number: 12, title: 'Colon phrase is explanatory', state: 'open' },
      { number: 13, title: 'Genuine closure', state: 'open' },
      { number: 14, title: 'Already closed', state: 'closed' },
      { number: 15, title: 'Still tracked', state: 'open' },
      { number: 16, title: 'Fenced reference', state: 'open' },
      { number: 17, title: 'Unreferenced open issue', state: 'open' },
    ],
  };
  const section = render(payload).split('## Known open follow-ups\n')[1].split('## Trying')[0];
  for (
    const title of ['Negated closure remains open', 'Colon phrase is explanatory', 'Still tracked']
  ) assertStringIncludes(section, title);
  for (
    const title of [
      'Genuine closure',
      'Already closed',
      'Fenced reference',
      'Unreferenced open issue',
    ]
  ) assertEquals(section.includes(title), false, title);
});

Deno.test('metadata collection reads each PR and distinct referenced issue once', async () => {
  const calls: number[] = [];
  const payload = await deriveCanaryPayload('previous', 'head', {
    rangeCommits: () => Promise.resolve(['a', 'b']),
    associatedPullRequests: () => Promise.resolve([1, 2]),
    closingIssues: () => Promise.resolve([]),
    pullRequestDetails: (number) => {
      calls.push(number);
      return Promise.resolve({
        title: `fix(cli): PR ${number}`,
        body: 'Refs #10\nRefs #11',
        labels: [],
      });
    },
    issue: (number) => {
      calls.push(number);
      return Promise.resolve(
        number === 11 ? undefined : { number, title: 'Open follow-up', state: 'open' as const },
      );
    },
  });
  assertEquals(calls, [1, 2, 10, 11]);
  assertEquals(payload.followUps?.map((issue) => issue.number), [10]);
});

Deno.test('public release output removes private metadata from titles migration and issue titles', () => {
  const path = ['', 'home', 'private-user', 'workspace'].join('/');
  const host = ['machine', 'internal'].join('.');
  const identifier = ['session', 'id:', 'private-identity'].join(' ');
  const pr = {
    title: `fix(cli)!: hide ${path}`,
    body: `## Breaking change and migration\nConnect https://${host}:42 and ${host}. ${identifier}`,
    labels: [],
  };
  const note = render({
    ...fixture.payload,
    pullRequests: [1],
    pullRequestTitles: { 1: pr.title },
    pullRequestDetails: { 1: { ...pr, body: pr.body + '\nRefs #19' } },
    followUps: [{ number: 19, title: `Remove host=${host} ${path}`, state: 'open' }],
  });
  for (const privateText of [path, host, 'private-identity']) {
    assertEquals(note.includes(privateText), false, privateText);
  }
  assertEquals(
    publicReleaseText('https://github.com.private-machine.internal/detail'),
    '[external address]',
  );
  assertStringIncludes(note, '[private path]');
  assertStringIncludes(note, '[private identifier]');
  assertStringIncludes(note, `https://github.com/${repo}/pull/1`);
  assertEquals(/(?:\/(?:home|ephemeral)\/|~\/|session.id\s*[:=])/i.test(render()), false);
});

Deno.test('publication context rejects missing exact evidence and keeps prerelease flags', () => {
  assertThrows(
    () =>
      renderCanaryReleaseNote(fixture.publishedVersion, fixture.previous, fixture.payload, repo, {
        ...fixture.context,
        productionE2ERunId: '',
      }),
    Error,
    'Exact workflow run IDs required',
  );
  assertThrows(
    () =>
      renderCanaryReleaseNote(fixture.publishedVersion, fixture.previous, fixture.payload, repo, {
        ...fixture.context,
        latestStableTag: 'v0.0.8-canary.2',
      }),
    Error,
    'Latest stable tag required',
  );
  const payload = canaryReleasePayload(fixture.publishedVersion, render());
  assertEquals(payload.prerelease, true);
  assertEquals(payload.make_latest, 'false');
});

Deno.test('canary workflow composes after exact E2E and isolated metadata workflow enforces migration', async () => {
  const workflow = await Deno.readTextFile(
    new URL('../../../.github/workflows/release-canary.yml', import.meta.url),
  );
  assert(
    workflow.indexOf('deno task release:canary-label') >
      workflow.indexOf('bash .llm/tools/release/watch-canary-e2e.sh'),
  );
  assertStringIncludes(workflow, '--production-e2e-run-id "$E2E_RUN_ID"');
  assertStringIncludes(workflow, '--publish-run-id "$GITHUB_RUN_ID"');
  const metadata = await Deno.readTextFile(
    new URL('../../../.github/workflows/pr-metadata-gates.yml', import.meta.url),
  );
  assertStringIncludes(metadata, '.llm/tools/validation/check-breaking-migration.ts');
});

Deno.test('fixture dry run invokes existing generator without network credentials or publication', async () => {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      '--allow-env',
      '.llm/tools/release/canary-label.ts',
      '--repo',
      repo,
      '--dry-run',
      '--fixture',
      '.llm/tools/release/tests/fixtures/canary.3-notes.json',
    ],
    env: { GH_TOKEN: '', GITHUB_TOKEN: '' },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  assertEquals(
    new TextDecoder().decode(output.stdout).trim(),
    renderCanaryReleaseNote(fixture.publishedVersion, fixture.previous, fixture.payload, repo, {
      ...fixture.context,
      publishedPackageCount: (await discoverWorkspaceMembers()).length,
    }).trim(),
  );
});

Deno.test('revision: failed E2E still publishes its labelled prerelease and later canaries pass drift', async () => {
  const requests: Array<{ method: string; path: string; body: Record<string, unknown> }> = [];
  const github = new GitHubClient(repo, 'fixture-token', (input, init) => {
    const path = new URL(String(input)).pathname;
    requests.push({
      method: init?.method ?? 'GET',
      path,
      body: init?.body ? JSON.parse(String(init.body)) : {},
    });
    if (path.includes('/releases/tags/')) {
      return Promise.resolve(new Response('Not found', { status: 404 }));
    }
    return Promise.resolve(
      Response.json(path.endsWith('/labels') && init?.method === 'GET' ? [] : {}),
    );
  });
  const label = canaryLabelFor(fixture.publishedVersion);
  const note = renderCanaryReleaseNote(
    fixture.publishedVersion,
    fixture.previous,
    fixture.payload,
    repo,
    {
      ...fixture.context,
      productionE2EOutcome: 'failure',
    },
  );
  await github.ensureLabel(label);
  await github.applyLabel(1, label);
  assertEquals(await github.publishCanaryRelease(fixture.publishedVersion, note), 'created');
  const release = requests.find((request) =>
    request.method === 'POST' && request.path.endsWith('/releases')
  )!;
  assertStringIncludes(String(release.body.body), 'production E2E failed');
  assertStringIncludes(
    String(release.body.body),
    `/actions/runs/${fixture.context.productionE2ERunId}`,
  );
  assertEquals(String(release.body.body).includes('both passed'), false);
  assertEquals(release.body.prerelease, true);
  assertEquals(release.body.make_latest, 'false');
  assert(
    requests.some((request) =>
      request.method === 'POST' && request.path.endsWith('/issues/1/labels')
    ),
  );
  assertEquals(
    checkCanaryDrift(
      [label, 'canary:0.0.8-canary.4'],
      [fixture.publishedVersion, '0.0.8-canary.4'],
      '0.0.8',
    ).ok,
    true,
  );
  const workflow = await Deno.readTextFile(
    new URL('../../../.github/workflows/release-canary.yml', import.meta.url),
  );
  const labelStep = workflow.slice(
    workflow.indexOf('- name: Label published canary'),
    workflow.indexOf('- name: Delete ephemeral'),
  );
  assertStringIncludes(labelStep, "if: always() && steps.publish.outcome == 'success'");
  assertStringIncludes(labelStep, 'E2E_OUTCOME: ${{ steps.e2e.outcome }}');
  assertStringIncludes(labelStep, '--production-e2e-outcome "$E2E_OUTCOME"');
  assert(
    workflow.indexOf('deno task release:canary-label') >
      workflow.indexOf('bash .llm/tools/release/watch-canary-e2e.sh'),
  );
});

Deno.test('revision: only successful E2E evidence may say passed and missing child run preserves notes', () => {
  for (const outcome of ['failure', 'cancelled', 'skipped'] as const) {
    const note = renderCanaryReleaseNote(
      fixture.publishedVersion,
      fixture.previous,
      fixture.payload,
      repo,
      {
        ...fixture.context,
        productionE2EOutcome: outcome,
      },
    );
    assertStringIncludes(note, `production E2E failed (${outcome};`);
    assertStringIncludes(note, `/actions/runs/${fixture.context.productionE2ERunId}`);
    assertEquals(note.includes('both passed'), false);
  }
  const note = renderCanaryReleaseNote(
    fixture.publishedVersion,
    fixture.previous,
    fixture.payload,
    repo,
    {
      ...fixture.context,
      productionE2EOutcome: 'skipped',
      productionE2ERunId: '',
    },
  );
  assertStringIncludes(note, 'no child run was dispatched');
  assertStringIncludes(note, `/actions/runs/${fixture.context.publishRunId}`);
  assertStringIncludes(render(), 'both passed');
});

Deno.test('revision: issue 404 and 410 do not prevent valid follow-ups while other HTTP errors fail', async () => {
  const calls: number[] = [];
  const github = new GitHubClient(repo, 'fixture-token', (input) => {
    const number = Number(String(input).split('/').at(-1));
    calls.push(number);
    if ([404, 410, 401, 503].includes(number)) {
      return Promise.resolve(new Response('fixture failure', { status: number }));
    }
    return Promise.resolve(
      Response.json({
        number,
        title: 'Referenced issue',
        state: 'open',
        ...(number === 2 ? { pull_request: {} } : {}),
      }),
    );
  });
  const payload = await deriveCanaryPayload('previous', 'head', {
    rangeCommits: () => Promise.resolve(['merge']),
    associatedPullRequests: () => Promise.resolve([1]),
    closingIssues: () => Promise.resolve([]),
    pullRequestDetails: () =>
      Promise.resolve({
        title: 'fix(cli): partial scope',
        body: 'Refs #404, #410, #1, #2',
        labels: [],
      }),
    issue: (number) => github.issue(number),
  });
  assertEquals(payload.followUps, [{ number: 1, title: 'Referenced issue', state: 'open' }]);
  assertEquals(calls, [1, 2, 404, 410]);
  for (const status of [401, 503]) {
    await assertRejects(() => github.issue(status), Error, `failed: ${status}`);
  }
});

Deno.test('revision: references accept colon and same-repo qualification without importing foreign IDs', async () => {
  const body =
    'Refs: #11, rickylabs/netscript#12, someone/else#13, #14\nRefs RICKYLABS/NETSCRIPT#12\nRefs #11\n```text\nRefs: rickylabs/netscript#15\n```';
  assertEquals(referencedIssues(body, repo), [11, 12, 14]);
  assertEquals(referencedIssues('Refs: #11\nRefs rickylabs/netscript#12'), [11]);
  const lookedUp: number[] = [];
  const payload = await deriveCanaryPayload('previous', 'head', {
    rangeCommits: () => Promise.resolve(['merge']),
    associatedPullRequests: () => Promise.resolve([1]),
    closingIssues: () => Promise.resolve([]),
    pullRequestDetails: () => Promise.resolve({ title: 'fix(cli): partial', body, labels: [] }),
    issue: (number) => {
      lookedUp.push(number);
      return Promise.resolve({ number, title: `Follow-up ${number}`, state: 'open' as const });
    },
  }, repo);
  assertEquals(lookedUp, [11, 12, 14]);
  const section = render(payload).split('## Known open follow-ups')[1].split('## Trying')[0];
  for (const number of [11, 12, 14]) assertStringIncludes(section, `Follow-up ${number}`);
  assertEquals(section.includes('#13'), false);
});

Deno.test('revision: public URL paths and internal filenames survive private-context redaction', () => {
  for (const segment of ['etc', 'opt', 'tmp', 'home']) {
    const url = `https://github.com/${repo}/blob/main/${segment}/foo.internal.ts`;
    const localPath = ['', segment, 'private-file'].join('/');
    assertEquals(publicReleaseText(`${url} ${localPath}`), `${url} [private path]`);
  }
  const filenames = 'foo.internal.ts bar.local.json worker.lan.ts localhost.ts';
  assertEquals(publicReleaseText(filenames), filenames);
  assertEquals(
    publicReleaseText('machine.internal. sub.machine.local:42 localhost'),
    '[private host]. [private host] [private host]',
  );
  assertEquals(
    publicReleaseText('https://github.com.private-machine.internal/tmp/secret'),
    '[external address]',
  );
});

Deno.test('revision: metadata events are isolated from the original CI triggers and concurrency', async () => {
  const ci = await Deno.readTextFile(new URL('../../../.github/workflows/ci.yml', import.meta.url));
  const trigger = ci.slice(ci.indexOf('on:'), ci.indexOf('permissions:'));
  assertStringIncludes(trigger, "branches: [main, 'feat/package-quality']");
  assertStringIncludes(trigger, "tags: ['v*']");
  assertStringIncludes(trigger, "branches: [main, 'feat/**', 'epic/**', 'canary/**']");
  assertStringIncludes(trigger, 'types: [opened, synchronize, reopened, ready_for_review]');
  for (const event of ['edited', 'labeled', 'unlabeled']) {
    assertEquals(trigger.includes(event), false);
  }
  assertEquals(ci.includes('check-breaking-migration.ts'), false);
  const metadata = await Deno.readTextFile(
    new URL('../../../.github/workflows/pr-metadata-gates.yml', import.meta.url),
  );
  assertStringIncludes(
    metadata,
    'types: [opened, synchronize, reopened, ready_for_review, edited, labeled, unlabeled]',
  );
  assertStringIncludes(
    metadata,
    'group: pr-metadata-gates-${{ github.event.pull_request.number }}',
  );
  assertStringIncludes(metadata, 'cancel-in-progress: true');
  assertStringIncludes(metadata, '.llm/tools/validation/check-breaking-migration.ts');
  assertEquals([...metadata.matchAll(/\n {2}[\w-]+:\n {4}runs-on:/g)].length, 1);
  assertEquals(metadata.includes('deno task'), false);
});
