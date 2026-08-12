import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { PUBLISH_ASSET_OUTPUTS } from '../generate-publish-assets.ts';
import { EXPORT_SURFACE_CORPUS_OUTPUT } from '../docs/generate-export-surface-corpus.ts';
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
const AGENT_DOCS_OUTPUT_SET = new Set<string>(AGENT_DOCS_OUTPUTS);

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
    'deno task gen:publish-assets',
    'deno task gen:mcp-export-corpus',
    'deno task gen:agent-docs-prose',
    'deno task gen:assets-barrel',
    'residue:0.0.1-beta.10',
    'deno task publish:readiness',
    'deno task publish:dry-run',
    'deno ci --prod',
  ]);
});

Deno.test('shared release preparation stages every generator-owned output', () => {
  assertEquals(PREPARED_RELEASE_GENERATED_OUTPUTS, [
    ...PUBLISH_ASSET_OUTPUTS.filter((path) => !AGENT_DOCS_OUTPUT_SET.has(path)),
    EXPORT_SURFACE_CORPUS_OUTPUT,
    ...AGENT_DOCS_OUTPUTS,
  ]);
  assertEquals(collectPreparedReleaseFiles('/repo', ['/repo/deno.json']), [
    '/repo/deno.json',
    ...PUBLISH_ASSET_OUTPUTS.filter((path) => !AGENT_DOCS_OUTPUT_SET.has(path)).map(
      (path) => `/repo/${path}`,
    ),
    `/repo/${EXPORT_SURFACE_CORPUS_OUTPUT}`,
    ...AGENT_DOCS_OUTPUTS.map((path) => `/repo/${path}`),
  ]);
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
    'deno task gen:publish-assets',
    'deno task gen:mcp-export-corpus',
    'deno task gen:agent-docs-prose',
    'deno task gen:assets-barrel',
  ]);
});
