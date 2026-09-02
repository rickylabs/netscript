import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { PUBLISH_ASSET_OUTPUTS } from '../generate-publish-assets.ts';
import { EXPORT_SURFACE_CORPUS_OUTPUT } from '../docs/generate-export-surface-corpus.ts';
import { GENERATED_CONSUMER_VERSION_FILES } from '../deps/bump-version.ts';
import {
  collectPreparedReleaseFiles,
  PREPARED_RELEASE_GENERATED_OUTPUTS,
  prepareRelease,
  type PrepareReleaseDependencies,
} from './prepare-release.ts';

const AGENT_DOCS_OUTPUTS = [
  '.llm/assets/agent-docs/prose.json.gz',
  '.llm/assets/agent-docs/provenance.json',
] as const;

Deno.test('shared release preparation runs the stable gate sequence in order', async () => {
  const calls: string[] = [];
  const dependencies: PrepareReleaseDependencies = {
    bump: (_root, version, mode) => {
      calls.push(`bump:${version}:${mode}`);
      return Promise.resolve({
        oldVersion: '0.0.1-beta.10',
        newVersion: version,
        files: ['/repo/deno.json'],
      });
    },
    findResidue: (_root, version) => {
      calls.push(`residue:${version}`);
      return Promise.resolve([]);
    },
    runCommand: (command, args) => {
      calls.push(`${command} ${args.join(' ')}`);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };

  await prepareRelease(
    '/repo',
    '0.0.1-canary.1',
    'release:canary',
    'canary',
    dependencies,
  );
  assertEquals(calls, [
    'bump:0.0.1-canary.1:canary',
    'deno task gen:agent-docs-prose',
    'deno task gen:publish-assets',
    'deno task gen:mcp-export-corpus --allow-dirty',
    'deno task gen:assets-barrel',
    'deno task check:agent-docs-prose',
    'residue:0.0.1-beta.10',
    'deno task publish:readiness',
    'deno task publish:dry-run',
    'deno ci --prod',
  ]);
});

Deno.test('shared release preparation explicitly authorizes its expected dirty corpus read set', async () => {
  const calls: string[] = [];
  await prepareRelease('/repo', '0.0.7-canary.6', 'release:canary', 'canary', {
    bump: (_root, version) =>
      Promise.resolve({
        oldVersion: '0.0.6',
        newVersion: version,
        files: [
          '/repo/packages/sdk/deno.json',
          '/repo/plugins/auth/scaffold.plugin.json',
        ],
      }),
    findResidue: () => Promise.resolve([]),
    runCommand: (command, args) => {
      calls.push(`${command} ${args.join(' ')}`);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  });

  assertEquals(
    calls.filter((call) => call.includes('gen:mcp-export-corpus')),
    ['deno task gen:mcp-export-corpus --allow-dirty'],
  );
  assertEquals(
    calls.filter((call) => call.includes('--allow-dirty')).length,
    1,
    'the dirty-write exception must stay scoped to corpus generation inside release preparation',
  );
});

Deno.test('shared release preparation stages every generator-owned output', () => {
  assertEquals(PREPARED_RELEASE_GENERATED_OUTPUTS, [
    ...PUBLISH_ASSET_OUTPUTS,
    EXPORT_SURFACE_CORPUS_OUTPUT,
  ]);
  const versionFiles = [
    '/repo/deno.json',
    ...GENERATED_CONSUMER_VERSION_FILES.map((path) => `/repo/${path}`),
  ];
  const prepared = collectPreparedReleaseFiles('/repo', versionFiles);
  assertEquals(prepared, [
    ...versionFiles,
    ...PUBLISH_ASSET_OUTPUTS.map((path) => `/repo/${path}`),
    `/repo/${EXPORT_SURFACE_CORPUS_OUTPUT}`,
  ]);
  for (const path of AGENT_DOCS_OUTPUTS) {
    assertEquals(
      prepared.filter((candidate) => candidate === `/repo/${path}`).length,
      1,
      `${path} must remain staged exactly once through PUBLISH_ASSET_OUTPUTS`,
    );
  }
});

Deno.test('shared release preparation regenerates assets then stops when residue remains', async () => {
  const calls: string[] = [];
  await assertRejects(
    () =>
      prepareRelease('/repo', '0.0.1-canary.1', 'release:canary', 'canary', {
        bump: (_root, version) =>
          Promise.resolve({
            oldVersion: '0.0.1-beta.10',
            newVersion: version,
            files: ['/repo/deno.json'],
          }),
        findResidue: () => Promise.resolve(['packages/example/deno.json']),
        runCommand: (command, args) => {
          calls.push(`${command} ${args.join(' ')}`);
          return Promise.resolve({ code: 0, stdout: '', stderr: '' });
        },
      }),
    Error,
    'Version residue remains',
  );
  assertEquals(calls, [
    'deno task gen:agent-docs-prose',
    'deno task gen:publish-assets',
    'deno task gen:mcp-export-corpus --allow-dirty',
    'deno task gen:assets-barrel',
    'deno task check:agent-docs-prose',
  ]);
});

Deno.test('shared release preparation fails locally when semantic agent-docs freshness is red', async () => {
  const calls: string[] = [];
  await assertRejects(
    () =>
      prepareRelease('/repo', '0.0.2', 'release:cut', 'stable', {
        bump: (_root, version) =>
          Promise.resolve({ oldVersion: '0.0.1', newVersion: version, files: ['/repo/deno.json'] }),
        findResidue: () => Promise.resolve([]),
        runCommand: (command, args) => {
          const call = `${command} ${args.join(' ')}`;
          calls.push(call);
          return Promise.resolve({
            code: call === 'deno task check:agent-docs-prose' ? 1 : 0,
            stdout: '',
            stderr: call === 'deno task check:agent-docs-prose' ? 'semantic corpus stale' : '',
          });
        },
      }),
    Error,
    'check:agent-docs-prose failed with exit 1',
  );
  assertEquals(calls, [
    'deno task gen:agent-docs-prose',
    'deno task gen:publish-assets',
    'deno task gen:mcp-export-corpus --allow-dirty',
    'deno task gen:assets-barrel',
    'deno task check:agent-docs-prose',
  ]);
});
