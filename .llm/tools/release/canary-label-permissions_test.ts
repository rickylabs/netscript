import { assertEquals, assertStringIncludes } from '@std/assert';
import { discoverWorkspaceMembers } from './publish-workspace.ts';

const root = new URL('../../../', import.meta.url);
const fixtureArgs = [
  '--repo',
  'rickylabs/netscript',
  '--dry-run',
  '--fixture',
  '.llm/tools/release/tests/fixtures/canary.3-notes.json',
];

async function run(args: string[]) {
  const output = await new Deno.Command(Deno.execPath(), {
    args,
    cwd: root,
    env: { DENO_NO_PROMPT: '1', GH_TOKEN: '', GITHUB_TOKEN: '', GITHUB_RUN_ID: '12345' },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

Deno.test('canary-label task declares only its required permission allowlists', async () => {
  const config = JSON.parse(await Deno.readTextFile(new URL('deno.json', root)));
  const command: string = config.tasks['release:canary-label'];
  assertEquals(command.split(' ').filter((arg) => arg.startsWith('--allow-')), [
    '--allow-env=GH_TOKEN,GITHUB_TOKEN,GITHUB_REPOSITORY,GITHUB_RUN_ID',
    '--allow-read=packages,plugins,.llm/tools/release/tests/fixtures',
    '--allow-net=api.github.com,jsr.io',
    '--allow-run=git',
  ]);
});

Deno.test('canary-label fixture runs through deno task with declared permissions and workspace discovery', async () => {
  // Test both CLI override and environment-default paths through the shipped task.
  for (const extra of [[], ['--publish-run-id', '67890']]) {
    const output = await run(['task', 'release:canary-label', ...fixtureArgs, ...extra]);
    assertEquals(output.code, 0, output.stdout + output.stderr);
    assertStringIncludes(output.stdout, '# NetScript 0.0.8-canary.3');
    assertStringIncludes(
      output.stdout,
      `All ${(await discoverWorkspaceMembers()).length} \`@netscript/*\` packages`,
    );
  }
});

Deno.test('canary-label reads GITHUB_RUN_ID only when the CLI override is absent', async () => {
  const args = [
    'run',
    '--allow-env=GITHUB_REPOSITORY',
    '--deny-env=GITHUB_RUN_ID',
    '--allow-read=packages,plugins,.llm/tools/release/tests/fixtures',
    '.llm/tools/release/canary-label.ts',
    ...fixtureArgs,
  ];
  const explicit = await run([...args, '--publish-run-id', '67890']);
  assertEquals(explicit.code, 0, explicit.stdout + explicit.stderr);
  const fallback = await run(args);
  assertEquals(fallback.code, 1);
  assertStringIncludes(fallback.stdout, 'Requires env access to "GITHUB_RUN_ID"');
});
