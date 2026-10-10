import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  type CanaryPayload,
  canaryReleasePayload,
  deriveCanaryPayload,
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

Deno.test('canary workflow composes after exact E2E and CI enforces migration before merge', async () => {
  const workflow = await Deno.readTextFile(
    new URL('../../../.github/workflows/release-canary.yml', import.meta.url),
  );
  assert(
    workflow.indexOf('deno task release:canary-label') >
      workflow.indexOf('bash .llm/tools/release/watch-canary-e2e.sh'),
  );
  assertStringIncludes(workflow, '--production-e2e-run-id "$E2E_RUN_ID"');
  assertStringIncludes(workflow, '--publish-run-id "$GITHUB_RUN_ID"');
  const ci = await Deno.readTextFile(new URL('../../../.github/workflows/ci.yml', import.meta.url));
  assertStringIncludes(ci, '.llm/tools/validation/check-breaking-migration.ts');
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
  assertEquals(new TextDecoder().decode(output.stdout).trim(), render().trim());
});
