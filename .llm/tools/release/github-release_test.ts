import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1';
import {
  CANARY_PAIR_STATUS_CONTEXT,
  composeReleaseBody,
  formatClosedIssues,
  isExactVersionReplacement,
  isVersionOnlyReleaseDiff,
  parseArgs,
  toTag,
  toVersion,
  verifyGreenCanaryPair,
} from './github-release.ts';

Deno.test('toVersion strips a single leading v; toTag re-adds it', () => {
  assertEquals(toVersion('v0.0.1-alpha.20'), '0.0.1-alpha.20');
  assertEquals(toVersion('0.0.1-alpha.20'), '0.0.1-alpha.20');
  assertEquals(toTag('v0.0.1-alpha.20'), 'v0.0.1-alpha.20');
  assertEquals(toTag('0.0.1-alpha.20'), 'v0.0.1-alpha.20');
});

Deno.test('version-only diff accepts the complete release version surface only', () => {
  const root = '/repo';
  const versionFiles = ['/repo/deno.json', '/repo/deno.lock', '/repo/packages/a/deno.json'];
  assertEquals(
    isVersionOnlyReleaseDiff(root, ['deno.json', 'packages/a/deno.json'], versionFiles),
    true,
  );
  assertEquals(
    isVersionOnlyReleaseDiff(root, ['deno.json', 'packages/a/mod.ts'], versionFiles),
    false,
  );
  assertEquals(isVersionOnlyReleaseDiff(root, [], versionFiles), false);
  assertEquals(isExactVersionReplacement('{"version":"1"}', '{"version":"2"}', '1', '2'), true);
  assertEquals(
    isExactVersionReplacement(
      '{"version":"1","exports":"./a.ts"}',
      '{"version":"2","exports":"./b.ts"}',
      '1',
      '2',
    ),
    false,
  );
});

Deno.test('green canary pair accepts current SHA or a version-only immediate parent', async () => {
  const request = (
    _method: string,
    path: string,
    _token: string,
  ) =>
    Promise.resolve({
      status: 200,
      ok: true,
      body: {
        statuses: path.includes('content-sha')
          ? [{ context: CANARY_PAIR_STATUS_CONTEXT, state: 'success' }]
          : [],
      },
    });
  const base = {
    changedFiles: () => Promise.resolve(['deno.json']),
    versionFiles: () => Promise.resolve(['/repo/deno.json']),
    fileAtRevision: (_root: string, revision: string) =>
      Promise.resolve(revision === 'content-sha' ? '{"version":"1"}\n' : '{"version":"2"}\n'),
    request,
  };
  assertEquals(
    await verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
      ...base,
      revParse: (_root, revision) =>
        Promise.resolve(revision === 'HEAD' ? 'content-sha' : 'parent'),
    }),
    'content-sha',
  );
  assertEquals(
    await verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
      ...base,
      revParse: (_root, revision) =>
        Promise.resolve(revision === 'HEAD' ? 'stable-version-sha' : 'content-sha'),
    }),
    'content-sha',
  );
});

Deno.test('canary pair gate fails closed for source drift and API failure', async () => {
  const noStatuses = () => Promise.resolve({ status: 200, ok: true, body: { statuses: [] } });
  await assertRejects(
    () =>
      verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
        revParse: () => Promise.resolve('source-sha'),
        changedFiles: () => Promise.resolve(['packages/a/mod.ts']),
        versionFiles: () => Promise.resolve(['/repo/deno.json']),
        fileAtRevision: () => Promise.resolve('{"version":"1"}\n'),
        request: noStatuses,
      }),
    Error,
    'contains non-version changes',
  );
  await assertRejects(
    () =>
      verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
        revParse: () => Promise.resolve('source-sha'),
        changedFiles: () => Promise.resolve(['deno.json']),
        versionFiles: () => Promise.resolve(['/repo/deno.json']),
        fileAtRevision: () => Promise.resolve('{"version":"1"}\n'),
        request: () => Promise.resolve({ status: 403, ok: false, body: { message: 'forbidden' } }),
      }),
    Error,
    'fails closed',
  );
});

Deno.test('parent canary evidence rejects seeded manifest drift inside a version file', async () => {
  await assertRejects(
    () =>
      verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
        revParse: (_root, revision) =>
          Promise.resolve(revision === 'HEAD' ? 'stable-sha' : 'content-sha'),
        changedFiles: () => Promise.resolve(['deno.json']),
        versionFiles: () => Promise.resolve(['/repo/deno.json']),
        fileAtRevision: (_root, revision) =>
          Promise.resolve(
            revision === 'content-sha'
              ? '{"version":"1","exports":"./a.ts"}\n'
              : '{"version":"2","exports":"./b.ts"}\n',
          ),
        request: () => Promise.resolve({ status: 200, ok: true, body: { statuses: [] } }),
      }),
    Error,
    'beyond the exact coordinated version replacement',
  );
});

Deno.test('formatClosedIssues renders a bulleted list, empty when none', () => {
  assertEquals(formatClosedIssues([]), '');
  const out = formatClosedIssues([
    { number: 173, title: 'SQLite scaffold fails under Prisma 7' },
    { number: 219, title: 'streams: no durable-CHAT integration' },
  ]);
  assertEquals(
    out,
    '## Closed Issues\n\n- #173 SQLite scaffold fails under Prisma 7\n- #219 streams: no durable-CHAT integration',
  );
});

Deno.test('composeReleaseBody orders intro, changelog, closed issues and drops blanks', () => {
  const body = composeReleaseBody({
    intro: 'Ships the UI surface.',
    whatsChanged: "## What's Changed\n* thing (#1)",
    closedIssues: '## Closed Issues\n\n- #1 thing',
  });
  assertEquals(
    body,
    "Ships the UI surface.\n\n## What's Changed\n* thing (#1)\n\n## Closed Issues\n\n- #1 thing\n",
  );

  // A blank closed-issues section is dropped and the body still ends in a newline.
  const noIssues = composeReleaseBody({
    intro: 'Intro.',
    whatsChanged: "## What's Changed",
    closedIssues: '',
  });
  assertEquals(noIssues, "Intro.\n\n## What's Changed\n");
});

Deno.test('parseArgs: version positional or flag, defaults to non-prerelease Latest', () => {
  const positional = parseArgs(['v0.0.1-alpha.20', '--message', 'hi']);
  assertEquals(positional.version, '0.0.1-alpha.20');
  assertEquals(positional.prerelease, false);
  assertEquals(positional.latest, true);
  assertEquals(positional.repo, 'rickylabs/netscript');

  const flagged = parseArgs(['--version', '0.0.1-alpha.20', '--notes-file', 'intro.md']);
  assertEquals(flagged.version, '0.0.1-alpha.20');
  assertEquals(flagged.notesFile, 'intro.md');
});

Deno.test('parseArgs: --prerelease implies not-Latest; explicit --latest with it throws', () => {
  const pre = parseArgs(['v0.0.1-alpha.20', '--message', 'hi', '--prerelease']);
  assertEquals(pre.prerelease, true);
  assertEquals(pre.latest, false);

  assertThrows(
    () => parseArgs(['v0.0.1-alpha.20', '--message', 'hi', '--prerelease', '--latest']),
    Error,
    'prerelease cannot be marked Latest',
  );
});

Deno.test('parseArgs: --no-latest overrides the default', () => {
  const plan = parseArgs(['v0.0.1-alpha.20', '--message', 'hi', '--no-latest']);
  assertEquals(plan.latest, false);
  assertEquals(plan.prerelease, false);
});

Deno.test('parseArgs: intro is required (the deliberate manual step)', () => {
  const err = assertThrows(
    () => parseArgs(['v0.0.1-alpha.20']),
    Error,
  );
  assertStringIncludes(err.message, 'introduction summary is required');
});

Deno.test('parseArgs: version is required', () => {
  assertThrows(
    () => parseArgs(['--message', 'hi']),
    Error,
    'requires a version',
  );
});

Deno.test('parseArgs: notes-file and message are mutually exclusive', () => {
  assertThrows(
    () => parseArgs(['v1.0.0', '--notes-file', 'a.md', '--message', 'b']),
    Error,
    'cannot be combined',
  );
});

Deno.test('parseArgs: unknown flag and missing value are rejected', () => {
  assertThrows(
    () => parseArgs(['v1.0.0', '--message', 'hi', '--bogus']),
    Error,
    'Unknown argument',
  );
  assertThrows(() => parseArgs(['v1.0.0', '--message']), Error, 'requires a value');
});
