import {
  assertEquals,
  assertNotEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1';
import {
  assertPreparedReleaseGeneratedOutputsFresh,
  CANARY_PAIR_STATUS_CONTEXT,
  type CanaryPairDependencies,
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
import { rebaseAgentDocsProse } from '../generate-publish-assets.ts';
import {
  type AgentDocsProseProvenance,
  buildAgentDocsProse,
  buildAgentDocsProseFromSite,
  checkAgentDocsProseFromSite,
} from '../docs/build-agent-docs-bundle.ts';
import { join, toFileUrl } from '@std/path';

interface TestAgentDocsPayload {
  readonly schemaVersion: 1;
  readonly files: Readonly<Record<string, string>>;
}

interface TestAgentDocsProvenance {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly sourceCommit: string;
  readonly extractionTimestamp: string;
  readonly files: readonly string[];
  readonly uncompressedBytes: number;
  readonly compressedBytes: number;
  readonly sha256: string;
}

async function gzipJson(value: unknown): Promise<Uint8Array> {
  const source = new TextEncoder().encode(JSON.stringify(value));
  const stream = new Blob([source]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzipJson(bytes: Uint8Array): Promise<TestAgentDocsPayload> {
  const copy = new Uint8Array(bytes);
  const stream = new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decoded = new Uint8Array(await new Response(stream).arrayBuffer());
  return JSON.parse(new TextDecoder().decode(decoded)) as TestAgentDocsPayload;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', copy.buffer))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function testAgentDocsProvenance(
  version: string,
  prose: Uint8Array,
  files: readonly string[] = ['llms.txt'],
): Promise<TestAgentDocsProvenance> {
  const raw = await gunzipBytes(prose);
  return {
    schemaVersion: 1,
    version,
    sourceCommit: 'canary-source',
    extractionTimestamp: '2026-08-12T00:00:00Z',
    files,
    uncompressedBytes: raw.byteLength,
    compressedBytes: prose.byteLength,
    sha256: await sha256(raw),
  };
}

async function gunzipBytes(bytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes);
  const stream = new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const PAIR_PROSE_PATH = '.llm/assets/agent-docs/prose.json.gz';
const PAIR_PROVENANCE_PATH = '.llm/assets/agent-docs/provenance.json';

interface RenderedCanaryPairFixture {
  readonly root: string;
  readonly parent: string;
  readonly current: string;
  readonly previousVersion: string;
  readonly nextVersion: string;
  readonly literalRebaseSha256: string;
  readonly renderedSha256: string;
  readonly dependencies: CanaryPairDependencies;
  readonly dispose: () => Promise<void>;
}

async function createRenderedCanaryPairFixture(
  injectContentDrift: boolean,
): Promise<RenderedCanaryPairFixture> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-rendered-canary-pair-' });
  const source = await Deno.makeTempDir({ prefix: 'netscript-rendered-canary-source-' });
  const literal = await Deno.makeTempDir({ prefix: 'netscript-literal-agent-docs-rebase-' });
  const previousVersion = '0.0.5';
  const nextVersion = '0.0.6';
  const output = join(root, '.llm', 'assets', 'agent-docs');
  const site = join(source, 'site');
  const bundle = join(source, 'bundle');
  const prosePath = join(output, 'prose.json.gz');
  const provenancePath = join(output, 'provenance.json');
  const git = async (args: readonly string[], binary = false): Promise<string | Uint8Array> => {
    const result = await new Deno.Command('git', {
      args: [...args],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!result.success) {
      throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(result.stderr)}`);
    }
    return binary ? result.stdout : new TextDecoder().decode(result.stdout).trim();
  };
  const writeRenderedSite = async (version: string): Promise<void> => {
    await Deno.mkdir(site, { recursive: true });
    await Deno.writeTextFile(
      join(site, 'llms.txt'),
      `# NetScript\n\n## Task router\n\nInstall jsr:@netscript/cli@${version}.\n`,
    );
    await Deno.writeTextFile(
      join(site, 'llms-full.txt'),
      `# Full corpus\n\nInstall jsr:@netscript/cli@${version}. APIs use exact @${version} pins.\n`,
    );
    await Deno.writeTextFile(
      join(site, 'index.md'),
      `# Home\n\nThe package family uses exact @${version} pins.\n`,
    );
  };
  try {
    await Promise.all([
      Deno.mkdir(bundle, { recursive: true }),
      Deno.mkdir(output, { recursive: true }),
      Deno.mkdir(join(literal, 'packages', 'cli'), { recursive: true }),
      Deno.mkdir(join(literal, '.llm', 'assets', 'agent-docs'), { recursive: true }),
    ]);
    await Promise.all([
      Deno.writeTextFile(
        join(bundle, 'llms.txt'),
        '# NetScript\n\n## Task router\n\nParent corpus.\n',
      ),
      Deno.writeTextFile(join(bundle, 'llms-full.txt'), '# Parent full corpus.\n'),
      Deno.writeTextFile(
        join(bundle, 'MANIFEST.md'),
        `| Framework version | \`${previousVersion}\` |\n` +
          '| Extracted from commit | `parent-render` |\n' +
          '| Extraction timestamp | 2026-08-12T00:00:00Z |\n',
      ),
      Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify({ version: previousVersion })),
    ]);
    await buildAgentDocsProse(bundle, output);
    await writeRenderedSite(previousVersion);
    await buildAgentDocsProseFromSite(site, {
      version: previousVersion,
      sourceCommit: 'parent-render',
      extractionTimestamp: '2026-08-12T00:00:00Z',
      preservedCorpusPath: prosePath,
    }, output);

    await Deno.copyFile(prosePath, join(literal, PAIR_PROSE_PATH));
    await Deno.copyFile(provenancePath, join(literal, PAIR_PROVENANCE_PATH));
    await Deno.writeTextFile(
      join(literal, 'packages', 'cli', 'deno.json'),
      JSON.stringify({ version: nextVersion }),
    );
    await rebaseAgentDocsProse(
      previousVersion,
      toFileUrl(`${literal}/`),
      false,
      [],
    );
    const literalRebaseSha256 = await sha256(
      await gunzipBytes(await Deno.readFile(join(literal, PAIR_PROSE_PATH))),
    );

    await git(['init', '--quiet']);
    await git(['config', 'user.email', 'release-test@netscript.dev']);
    await git(['config', 'user.name', 'NetScript release test']);
    await git(['add', 'deno.json', PAIR_PROSE_PATH, PAIR_PROVENANCE_PATH]);
    await git(['commit', '--quiet', '-m', 'parent canary content']);
    const parent = await git(['rev-parse', 'HEAD']) as string;

    await Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify({ version: nextVersion }));
    await writeRenderedSite(nextVersion);
    await buildAgentDocsProseFromSite(site, {
      version: nextVersion,
      sourceCommit: 'head-render',
      extractionTimestamp: '2026-08-13T00:00:00Z',
      preservedCorpusPath: prosePath,
    }, output);
    const renderedSha256 = await sha256(await gunzipBytes(await Deno.readFile(prosePath)));

    if (injectContentDrift) {
      const raw = await gunzipBytes(await Deno.readFile(prosePath));
      const payload = JSON.parse(new TextDecoder().decode(raw)) as TestAgentDocsPayload;
      const files = { ...payload.files, 'llms.txt': `${payload.files['llms.txt']}\nDRIFT\n` };
      const canonical = new TextEncoder().encode(JSON.stringify({ schemaVersion: 1, files }));
      const compressed = await gzipJson({ schemaVersion: 1, files });
      const provenance = JSON.parse(
        await Deno.readTextFile(provenancePath),
      ) as AgentDocsProseProvenance;
      await Promise.all([
        Deno.writeFile(prosePath, compressed),
        Deno.writeTextFile(
          provenancePath,
          `${
            JSON.stringify(
              {
                ...provenance,
                uncompressedBytes: canonical.byteLength,
                compressedBytes: compressed.byteLength,
                sha256: await sha256(canonical),
              },
              null,
              2,
            )
          }\n`,
        ),
      ]);
    }

    await git(['add', 'deno.json', PAIR_PROSE_PATH, PAIR_PROVENANCE_PATH]);
    await git(['commit', '--quiet', '-m', 'stable cut']);
    const current = await git(['rev-parse', 'HEAD']) as string;

    const dependencies: CanaryPairDependencies = {
      revParse: async (_root, revision) => await git(['rev-parse', revision]) as string,
      changedFiles: async () =>
        (await git(['diff', '--name-only', 'HEAD^', 'HEAD']) as string).split(/\r?\n/).filter(
          Boolean,
        ),
      releaseFiles: () =>
        Promise.resolve([
          join(root, 'deno.json'),
          join(root, PAIR_PROSE_PATH),
          join(root, PAIR_PROVENANCE_PATH),
        ]),
      fileAtRevision: async (_root, revision, path) =>
        new TextDecoder().decode(
          await git(['show', `${revision}:${path}`], true) as Uint8Array,
        ),
      fileBytesAtRevision: async (_root, revision, path) =>
        await git(['show', `${revision}:${path}`], true) as Uint8Array,
      generatedOutputsFresh: async () => {
        const provenance = JSON.parse(
          await Deno.readTextFile(provenancePath),
        ) as AgentDocsProseProvenance;
        const freshness = await checkAgentDocsProseFromSite(site, {
          version: provenance.version,
          sourceCommit: provenance.sourceCommit,
          extractionTimestamp: provenance.extractionTimestamp,
          preservedCorpusPath: prosePath,
        }, output);
        if (!freshness.fresh) {
          throw new Error(`semantic agent-docs drift: ${freshness.stalePaths.join(', ')}`);
        }
      },
      request: (_method, path) =>
        Promise.resolve({
          status: 200,
          ok: true,
          body: {
            statuses: path.includes(parent)
              ? [{ context: CANARY_PAIR_STATUS_CONTEXT, state: 'success' }]
              : [],
          },
        }),
    };
    return {
      root,
      parent,
      current,
      previousVersion,
      nextVersion,
      literalRebaseSha256,
      renderedSha256,
      dependencies,
      dispose: () =>
        Promise.all([root, source, literal].map((path) =>
          Deno.remove(path, {
            recursive: true,
          })
        )).then(() => undefined),
    };
  } catch (error) {
    await Promise.all(
      [root, source, literal].map((path) => Deno.remove(path, { recursive: true })),
    );
    throw error;
  }
}

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
      '{"version":"0.0.5","npm":{"@ag-ui/core@0.0.52":{}}}',
      '{"version":"0.0.7","npm":{"@ag-ui/core@0.0.52":{}}}',
      '0.0.5',
      '0.0.7',
    ),
    true,
    'unrelated versions containing the old version as a prefix are not release drift',
  );
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

Deno.test('generated release freshness checks semantic prose before downstream assets', async () => {
  const calls: string[] = [];
  await assertPreparedReleaseGeneratedOutputsFresh('/repo', {
    trackedStatus: () => Promise.resolve(''),
    runDeno: (_root, args) => {
      calls.push(`deno ${args.join(' ')}`);
      return Promise.resolve();
    },
  });
  assertEquals(calls, [
    'deno task check:agent-docs-prose',
    'deno task gen:publish-assets --check',
    'deno task check:mcp-export-corpus',
    'deno run --no-lock --allow-read --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts --check',
  ]);
});

Deno.test('generated release freshness stops before downstream checks when semantic prose is stale', async () => {
  const calls: string[] = [];
  await assertRejects(
    () =>
      assertPreparedReleaseGeneratedOutputsFresh('/repo', {
        trackedStatus: () => Promise.resolve(''),
        runDeno: (_root, args) => {
          calls.push(`deno ${args.join(' ')}`);
          return Promise.reject(new Error('semantic agent-docs stale'));
        },
      }),
    Error,
    'semantic agent-docs stale',
  );
  assertEquals(calls, ['deno task check:agent-docs-prose']);
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
  const parentProse = await gzipJson({
    schemaVersion: 1,
    files: { 'llms.txt': 'Install jsr:@netscript/cli@1.0.0-canary.1' },
  });
  const currentProse = await gzipJson({
    schemaVersion: 1,
    files: { 'llms.txt': 'Install jsr:@netscript/cli@1.0.0' },
  });
  const parentProvenance = await testAgentDocsProvenance('1.0.0-canary.1', parentProse);
  const currentProvenance = await testAgentDocsProvenance('1.0.0', currentProse);
  const changedFiles = [
    'deno.json',
    'deno.lock',
    '.llm/assets/agent-docs/prose.json.gz',
    '.llm/assets/agent-docs/provenance.json',
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
      if (path === '.llm/assets/agent-docs/provenance.json') {
        return Promise.resolve(JSON.stringify(
          revision === 'canary-content-sha' ? parentProvenance : currentProvenance,
        ));
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
    fileBytesAtRevision: (_root, revision, path) => {
      assertEquals(path, '.llm/assets/agent-docs/prose.json.gz');
      return Promise.resolve(revision === 'canary-content-sha' ? parentProse : currentProse);
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

Deno.test('parent canary evidence accepts a genuinely re-rendered version-derived corpus', async () => {
  const fixture = await createRenderedCanaryPairFixture(false);
  try {
    const beforeProvenance = JSON.parse(
      await fixture.dependencies.fileAtRevision(
        fixture.root,
        fixture.parent,
        PAIR_PROVENANCE_PATH,
      ),
    ) as TestAgentDocsProvenance;
    const afterProvenance = JSON.parse(
      await fixture.dependencies.fileAtRevision(
        fixture.root,
        fixture.current,
        PAIR_PROVENANCE_PATH,
      ),
    ) as TestAgentDocsProvenance;
    assertNotEquals(beforeProvenance.sourceCommit, afterProvenance.sourceCommit);
    assertNotEquals(beforeProvenance.extractionTimestamp, afterProvenance.extractionTimestamp);
    assertNotEquals(
      fixture.literalRebaseSha256,
      fixture.renderedSha256,
      'the real bumped render must differ canonically from literal agent-docs rebasing',
    );
    assertEquals(
      await verifyGreenCanaryPair(
        'owner/repo',
        'token',
        fixture.root,
        fixture.dependencies,
      ),
      fixture.parent,
    );
  } finally {
    await fixture.dispose();
  }
});

Deno.test('parent canary evidence rejects semantically drifted rebuilt corpus content', async () => {
  const fixture = await createRenderedCanaryPairFixture(true);
  try {
    await assertRejects(
      () =>
        verifyGreenCanaryPair(
          'owner/repo',
          'token',
          fixture.root,
          fixture.dependencies,
        ),
      Error,
      'Stable publication blocked: agent-docs prose contains non-version changes',
    );
  } finally {
    await fixture.dispose();
  }
});

Deno.test('parent canary evidence fails when derived writer outputs cannot be reproduced', async () => {
  const parentProse = await gzipJson({
    schemaVersion: 1,
    files: { 'llms.txt': 'Install jsr:@netscript/cli@1.0.0-canary.1' },
  });
  const currentProse = await gzipJson({
    schemaVersion: 1,
    files: { 'llms.txt': 'Install jsr:@netscript/cli@1.0.0' },
  });
  const parentProvenance = await testAgentDocsProvenance('1.0.0-canary.1', parentProse);
  const currentProvenance = await testAgentDocsProvenance('1.0.0', currentProse);
  await assertRejects(
    () =>
      verifyGreenCanaryPair('owner/repo', 'token', '/repo', {
        revParse: (_root, revision) =>
          Promise.resolve(revision === 'HEAD' ? 'stable-sha' : 'canary-content-sha'),
        changedFiles: () =>
          Promise.resolve([
            'deno.json',
            '.llm/assets/agent-docs/prose.json.gz',
            '.llm/assets/agent-docs/provenance.json',
          ]),
        releaseFiles: () =>
          Promise.resolve([
            '/repo/deno.json',
            '/repo/.llm/assets/agent-docs/prose.json.gz',
            '/repo/.llm/assets/agent-docs/provenance.json',
          ]),
        fileAtRevision: (_root, revision, path) => {
          if (path === 'deno.json') {
            return Promise.resolve(
              revision === 'canary-content-sha'
                ? '{"version":"1.0.0-canary.1"}'
                : '{"version":"1.0.0"}',
            );
          }
          if (path === '.llm/assets/agent-docs/provenance.json') {
            return Promise.resolve(JSON.stringify(
              revision === 'canary-content-sha' ? parentProvenance : currentProvenance,
            ));
          }
          return Promise.resolve(`${revision}:not-reproducible`);
        },
        fileBytesAtRevision: (_root, revision, path) => {
          assertEquals(path, '.llm/assets/agent-docs/prose.json.gz');
          return Promise.resolve(revision === 'canary-content-sha' ? parentProse : currentProse);
        },
        generatedOutputsFresh: () => Promise.reject(new Error('writer output is stale')),
        request: () => Promise.resolve({ status: 200, ok: true, body: { statuses: [] } }),
      }),
    Error,
    'writer output is stale',
  );
});

Deno.test('parent canary evidence rejects self-consistent non-version agent-docs injection', async () => {
  const previousVersion = '1.0.0-canary.1';
  const nextVersion = '1.0.0';
  const marker = 'MALICIOUS-NON-VERSION-CONTENT-INJECTED-BY-EVALUATOR';
  const prosePath = '.llm/assets/agent-docs/prose.json.gz';
  const provenancePath = '.llm/assets/agent-docs/provenance.json';
  const barrelPath = 'packages/cli/src/kernel/assets/agent-docs.generated.ts';
  const documentPath = 'context/01-how-the-web-became-the-default.mdx';
  const parentPayload: TestAgentDocsPayload = {
    schemaVersion: 1,
    files: { [documentPath]: `Install jsr:@netscript/cli@${previousVersion}` },
  };
  const injectedPayload: TestAgentDocsPayload = {
    schemaVersion: 1,
    files: {
      [documentPath]: `Install jsr:@netscript/cli@${nextVersion}\n${marker}`,
    },
  };
  const parentProse = await gzipJson(parentPayload);
  const injectedProse = await gzipJson(injectedPayload);
  const injectedRaw = new TextEncoder().encode(JSON.stringify(injectedPayload));
  const parentProvenance = await testAgentDocsProvenance(
    previousVersion,
    parentProse,
    [documentPath],
  );
  const injectedProvenance = await testAgentDocsProvenance(
    nextVersion,
    injectedProse,
    [documentPath],
  );
  const injectedBarrel = [
    `export const EMBEDDED_AGENT_DOCS_GZIP_BASE64 = ${
      JSON.stringify(bytesToBase64(injectedProse))
    };`,
    `export const EMBEDDED_AGENT_DOCS_PROVENANCE = ${JSON.stringify(injectedProvenance)};`,
  ].join('\n');
  const parentBarrel = 'parent canary barrel';
  const changedFiles = ['deno.json', prosePath, provenancePath, barrelPath];
  let reproducedHead = false;
  const dependencies = {
    revParse: (_root: string, revision: string) =>
      Promise.resolve(revision === 'HEAD' ? 'stable-sha' : 'canary-content-sha'),
    changedFiles: () => Promise.resolve(changedFiles),
    releaseFiles: () => Promise.resolve(changedFiles.map((path) => `/repo/${path}`)),
    fileAtRevision: (_root: string, revision: string, path: string) => {
      const parent = revision === 'canary-content-sha';
      if (path === 'deno.json') {
        return Promise.resolve(JSON.stringify({ version: parent ? previousVersion : nextVersion }));
      }
      if (path === prosePath) return Promise.resolve(parent ? 'parent gzip' : 'injected gzip');
      if (path === provenancePath) {
        return Promise.resolve(JSON.stringify(parent ? parentProvenance : injectedProvenance));
      }
      return Promise.resolve(parent ? parentBarrel : injectedBarrel);
    },
    fileBytesAtRevision: (_root: string, revision: string, path: string) => {
      assertEquals(path, prosePath);
      return Promise.resolve(revision === 'canary-content-sha' ? parentProse : injectedProse);
    },
    generatedOutputsFresh: async () => {
      const decoded = await gunzipJson(injectedProse);
      assertEquals(decoded.files[documentPath]?.includes(marker), true);
      assertEquals(injectedProvenance.sha256, await sha256(injectedRaw));
      assertStringIncludes(injectedBarrel, bytesToBase64(injectedProse));
      assertStringIncludes(injectedBarrel, injectedProvenance.sha256);
      reproducedHead = true;
      throw new Error('semantic agent-docs drift');
    },
    request: (_method: string, path: string) =>
      Promise.resolve({
        status: 200,
        ok: true,
        body: {
          statuses: path.includes('canary-content-sha')
            ? [{ context: CANARY_PAIR_STATUS_CONTEXT, state: 'success' }]
            : [],
        },
      }),
  };

  await assertRejects(
    () => dependencies.generatedOutputsFresh(),
    Error,
    'semantic agent-docs drift',
  );
  assertEquals(reproducedHead, true, 'the attack must be self-consistent at HEAD');
  await assertRejects(
    () => verifyGreenCanaryPair('owner/repo', 'token', '/repo', dependencies),
    Error,
    'agent-docs prose contains non-version changes',
  );
});

Deno.test('parent canary evidence rejects writer-preserved non-version provenance injection', async () => {
  const version = '1.0.0';
  const marker = 'MALICIOUS_PROVENANCE_FIELD_INJECTED_BY_EVALUATOR';
  const prosePath = '.llm/assets/agent-docs/prose.json.gz';
  const provenancePath = '.llm/assets/agent-docs/provenance.json';
  const barrelPath = 'packages/cli/src/kernel/assets/agent-docs.generated.ts';
  const documentPath = 'context/01-how-the-web-became-the-default.mdx';
  const prose = await gzipJson({
    schemaVersion: 1,
    files: { [documentPath]: 'Canary-verified prose.' },
  });
  const raw = new TextEncoder().encode(JSON.stringify({
    schemaVersion: 1,
    files: { [documentPath]: 'Canary-verified prose.' },
  }));
  const parentProvenance = {
    schemaVersion: 1,
    version,
    sourceCommit: 'canary-source',
    extractionTimestamp: '2026-08-12T00:00:00Z',
    files: [documentPath],
    uncompressedBytes: raw.byteLength,
    compressedBytes: prose.byteLength,
    sha256: await sha256(raw),
  };
  const injectedProvenance = { ...parentProvenance, [marker]: true };
  const injectedBarrel = `export const EMBEDDED_AGENT_DOCS_PROVENANCE = ${
    JSON.stringify(injectedProvenance)
  };`;
  const root = await Deno.makeTempDir({ prefix: 'netscript-provenance-injection-' });
  try {
    await Deno.mkdir(`${root}/packages/cli`, { recursive: true });
    await Deno.mkdir(`${root}/.llm/assets/agent-docs`, { recursive: true });
    await Deno.writeTextFile(`${root}/packages/cli/deno.json`, JSON.stringify({ version }));
    await Deno.writeFile(`${root}/${prosePath}`, prose);
    await Deno.writeTextFile(
      `${root}/${provenancePath}`,
      `${JSON.stringify(injectedProvenance, null, 2)}\n`,
    );

    const stalePaths: string[] = [];
    await rebaseAgentDocsProse(version, new URL(`file://${root}/`), true, stalePaths);
    assertEquals(
      stalePaths,
      [provenancePath],
      'the closed writer schema must reject the injected field',
    );
    assertStringIncludes(await Deno.readTextFile(`${root}/${provenancePath}`), marker);
    assertStringIncludes(injectedBarrel, marker);

    const changedFiles = [provenancePath, barrelPath];
    await assertRejects(
      () =>
        verifyGreenCanaryPair('owner/repo', 'token', root, {
          revParse: (_root, revision) =>
            Promise.resolve(revision === 'HEAD' ? 'stable-sha' : 'canary-content-sha'),
          changedFiles: () => Promise.resolve(changedFiles),
          releaseFiles: () => Promise.resolve(changedFiles.map((path) => `${root}/${path}`)),
          fileAtRevision: (_root, revision, path) => {
            if (path === 'deno.json') return Promise.resolve(JSON.stringify({ version }));
            if (path === provenancePath) {
              return Promise.resolve(
                JSON.stringify(
                  revision === 'canary-content-sha' ? parentProvenance : injectedProvenance,
                ),
              );
            }
            return Promise.resolve(
              revision === 'canary-content-sha' ? 'canary barrel' : injectedBarrel,
            );
          },
          fileBytesAtRevision: (_root, _revision, path) => {
            assertEquals(path, prosePath);
            return Promise.resolve(prose);
          },
          generatedOutputsFresh: () => Promise.resolve(),
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
        }),
      Error,
      'agent-docs provenance contains non-version changes',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
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
