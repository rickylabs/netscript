import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1';
import {
  CANARY_PAIR_STATUS_CONTEXT,
  collectReleaseNotes,
  composeReleaseBody,
  formatClosedIssues,
  isExactVersionReplacement,
  isVersionOnlyReleaseDiff,
  parseArgs,
  resolvePreviousTag,
  toTag,
  toVersion,
  verifyGreenCanaryPair,
} from './github-release.ts';
import { discoverPreparedReleaseFiles } from './prepare-release.ts';

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

Deno.test('version-only diff accepts a realistic coordinated release cut and rejects source drift', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-release-files-' });
  try {
    await Deno.mkdir(`${root}/packages/a`, { recursive: true });
    await Deno.mkdir(`${root}/plugins/workers`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({ version: '1.0.0', workspace: ['packages/*', 'plugins/*'] }),
    );
    await Deno.writeTextFile(`${root}/deno.lock`, '{}');
    await Deno.writeTextFile(`${root}/packages/a/deno.json`, '{"version":"1.0.0"}');
    await Deno.writeTextFile(`${root}/plugins/workers/deno.json`, '{"version":"1.0.0"}');
    await Deno.writeTextFile(
      `${root}/plugins/workers/scaffold.plugin.json`,
      '{"version":"1.0.0"}',
    );

    const releaseFiles = await discoverPreparedReleaseFiles(root);
    const changedFiles = releaseFiles.map((path) => path.slice(`${root}/`.length));

    for (
      const expected of [
        'deno.json',
        'deno.lock',
        'packages/a/deno.json',
        '.llm/assets/agent-docs/prose.json.gz',
        '.llm/assets/agent-docs/provenance.json',
        'packages/cli/src/kernel/assets/agent-tools.generated.ts',
        'packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts',
        'plugins/workers/scaffold.plugin.json',
      ]
    ) {
      assertEquals(changedFiles.includes(expected), true, `missing writer output ${expected}`);
    }
    assertEquals(isVersionOnlyReleaseDiff(root, changedFiles, releaseFiles), true);
    assertEquals(
      isVersionOnlyReleaseDiff(root, [...changedFiles, 'packages/a/mod.ts'], releaseFiles),
      false,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
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
    releaseFiles: () => Promise.resolve(['/repo/deno.json']),
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

Deno.test('parent canary evidence checks every release path and reproduces derived writer outputs', async () => {
  const changedFiles = [
    'deno.json',
    'deno.lock',
    '.llm/assets/agent-docs/prose.json.gz',
    'packages/cli/src/kernel/assets/agent-tools.generated.ts',
    'plugins/workers/scaffold.plugin.json',
  ];
  let generatedChecks = 0;
  const result = await verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
    revParse: (_root, revision) =>
      Promise.resolve(revision === 'HEAD' ? 'stable-sha' : 'canary-content-sha'),
    changedFiles: () => Promise.resolve(changedFiles),
    releaseFiles: () => Promise.resolve(changedFiles.map((path) => `/repo/${path}`)),
    fileAtRevision: (_root, revision, path) => {
      if (path === 'deno.json') {
        return Promise.resolve(
          revision === 'canary-content-sha'
            ? '{"version":"1.0.0-canary.1"}'
            : '{"version":"1.0.0"}',
        );
      }
      if (path.endsWith('.gz') || path.endsWith('.generated.ts')) {
        return Promise.resolve(`${revision}:${path}:derived-by-writer`);
      }
      return Promise.resolve(
        revision === 'canary-content-sha'
          ? 'jsr:@netscript/a@1.0.0-canary.1'
          : 'jsr:@netscript/a@1.0.0',
      );
    },
    generatedOutputsFresh: () => {
      generatedChecks += 1;
      return Promise.resolve();
    },
    request: (_method, path) =>
      Promise.resolve({
        status: 200,
        ok: true,
        body: {
          statuses: path.includes('canary-content-sha')
            ? [{ context: CANARY_PAIR_STATUS_CONTEXT, state: 'success' }]
            : [],
        },
      }),
  });

  assertEquals(result, 'canary-content-sha');
  assertEquals(generatedChecks, 1);
});

Deno.test('parent canary evidence fails when derived writer outputs cannot be reproduced', async () => {
  await assertRejects(
    () =>
      verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
        revParse: (_root, revision) =>
          Promise.resolve(revision === 'HEAD' ? 'stable-sha' : 'canary-content-sha'),
        changedFiles: () => Promise.resolve(['deno.json', '.llm/assets/agent-docs/prose.json.gz']),
        releaseFiles: () =>
          Promise.resolve([
            '/repo/deno.json',
            '/repo/.llm/assets/agent-docs/prose.json.gz',
          ]),
        fileAtRevision: (_root, revision, path) => {
          if (path === 'deno.json') {
            return Promise.resolve(
              revision === 'canary-content-sha'
                ? '{"version":"1.0.0-canary.1"}'
                : '{"version":"1.0.0"}',
            );
          }
          return Promise.resolve(`${revision}:not-reproducible`);
        },
        generatedOutputsFresh: () => Promise.reject(new Error('writer output is stale')),
        request: () => Promise.resolve({ status: 200, ok: true, body: { statuses: [] } }),
      }),
    Error,
    'writer output is stale',
  );
});

Deno.test('canary pair gate fails closed for source drift and API failure', async () => {
  const noStatuses = () => Promise.resolve({ status: 200, ok: true, body: { statuses: [] } });
  await assertRejects(
    () =>
      verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
        revParse: () => Promise.resolve('source-sha'),
        changedFiles: () => Promise.resolve(['packages/a/mod.ts']),
        releaseFiles: () => Promise.resolve(['/repo/deno.json']),
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
        releaseFiles: () => Promise.resolve(['/repo/deno.json']),
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
        releaseFiles: () => Promise.resolve(['/repo/deno.json']),
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

Deno.test('--prev-tag resolves a dated window and queries closed issues', async () => {
  const plan = parseArgs([
    'v1.0.0',
    '--message',
    'Release intro.',
    '--prev-tag',
    'v0.9.0',
  ]);
  const calls: string[] = [];
  const notes = await collectReleaseNotes(plan, 'token', 'v1.0.0', {
    fetchPreviousRelease: () => {
      throw new Error('auto-detection must not run with --prev-tag');
    },
    resolvePreviousTag: (_repo, _token, tag) => {
      calls.push(`resolve:${tag}`);
      return Promise.resolve({ tag, since: '2026-08-01T12:00:00Z' });
    },
    generateWhatsChanged: (_repo, _token, _tag, previousTag) => {
      calls.push(`notes:${previousTag}`);
      return Promise.resolve("## What's Changed");
    },
    fetchClosedIssues: (_repo, _token, since) => {
      calls.push(`closed:${since}`);
      return Promise.resolve([{ number: 1430, title: 'Closed issues were silently skipped' }]);
    },
  });

  assertEquals(notes.closed.length, 1);
  assertEquals(calls, [
    'resolve:v0.9.0',
    'notes:v0.9.0',
    'closed:2026-08-01T12:00:00Z',
  ]);
});

Deno.test('known previous tag with empty since fails loudly before reporting closed issues', async () => {
  const plan = parseArgs(['v1.0.0', '--message', 'Release intro.', '--prev-tag', 'v0.9.0']);
  let queriedClosedIssues = false;
  await assertRejects(
    () =>
      collectReleaseNotes(plan, 'token', 'v1.0.0', {
        fetchPreviousRelease: () => Promise.resolve(null),
        resolvePreviousTag: (_repo, _token, tag) => Promise.resolve({ tag, since: '' }),
        generateWhatsChanged: () => Promise.resolve(''),
        fetchClosedIssues: () => {
          queriedClosedIssues = true;
          return Promise.resolve([]);
        },
      }),
    Error,
    'since timestamp is empty',
  );
  assertEquals(queriedClosedIssues, false);
});

Deno.test('explicit previous tag uses release date with commit-date fallback', async () => {
  const releaseCalls: string[] = [];
  const released = await resolvePreviousTag('owner/repo', 'token', 'v0.9.0', (
    method,
    path,
  ) => {
    releaseCalls.push(`${method} ${path}`);
    return Promise.resolve({
      status: 200,
      ok: true,
      body: { published_at: '2026-07-31T10:00:00Z' },
    });
  });
  assertEquals(released, { tag: 'v0.9.0', since: '2026-07-31T10:00:00Z' });
  assertEquals(releaseCalls.length, 1);

  const fallbackCalls: string[] = [];
  const unreleased = await resolvePreviousTag('owner/repo', 'token', 'v0.9.0', (
    method,
    path,
  ) => {
    fallbackCalls.push(`${method} ${path}`);
    if (path.includes('/releases/tags/')) {
      return Promise.resolve({ status: 404, ok: false, body: { message: 'Not Found' } });
    }
    return Promise.resolve({
      status: 200,
      ok: true,
      body: { commit: { committer: { date: '2026-07-30T09:00:00Z' } } },
    });
  });
  assertEquals(unreleased, { tag: 'v0.9.0', since: '2026-07-30T09:00:00Z' });
  assertEquals(fallbackCalls.length, 2);
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

Deno.test('parseArgs: every documented release:publish invocation is accepted', async () => {
  const source = await Deno.readTextFile(new URL('./github-release.ts', import.meta.url));
  const usageLines = [...source.matchAll(/^\s*\*\s+(deno task release:publish .+)$/gm)]
    .map((match) => match[1]);

  assertEquals(usageLines.length > 0, true, 'expected at least one documented usage invocation');
  for (const usageLine of usageLines) {
    const commandLine = usageLine.slice('deno task release:publish '.length);
    const argv = [...commandLine.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)]
      .map((match) => match[1] ?? match[2] ?? match[3]);
    parseArgs(argv);
  }
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
