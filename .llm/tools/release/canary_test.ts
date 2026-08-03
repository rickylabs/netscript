import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import {
  canaryResult,
  type CanaryVersionDependencies,
  createCanaryRefs,
  deriveCanaryVersion,
  parseArgs,
  readRegistryVersions,
  validateRepublishVersion,
  verifyCanaryRepublishTree,
  writeCanaryResult,
} from './canary.ts';

Deno.test('canary version takes the maximum registry N across all members including yanked versions', async () => {
  const versions = new Map<string, readonly string[]>([
    ['@netscript/a', ['0.0.1-canary.1', '0.0.1-canary.7']],
    ['@netscript/b', ['0.0.1-canary.3', '0.0.1-canary.9']],
  ]);
  const result = await deriveCanaryVersion('/repo', '0.0.1', dependencies(versions));
  assertEquals(result, '0.0.1-canary.10');
});

Deno.test('canary version uses tags as a secondary collision guard and tolerates new packages', async () => {
  const deps = dependencies(new Map([['@netscript/a', ['0.0.2-canary.2']]]));
  deps.readRegistryVersions = (name) =>
    Promise.resolve(name === '@netscript/new' ? null : ['0.0.2-canary.2']);
  deps.listTags = () => Promise.resolve(['v0.0.2-canary.4']);
  const result = await deriveCanaryVersion('/repo', '0.0.2', deps);
  assertEquals(result, '0.0.2-canary.5');
});

Deno.test('canary parser accepts only a stable target and task separator', () => {
  assertEquals(parseArgs(['--', '0.0.2', '--dry-run', '--root', '/repo', '--output', '/result']), {
    targetVersion: '0.0.2',
    dryRun: true,
    root: '/repo',
    output: '/result',
  });
  assertThrows(() => parseArgs(['0.0.2-beta.1']), Error, 'stable semantic version');
  assertThrows(() => parseArgs(['0.0.2+build.1']), Error, 'stable semantic version');
});

Deno.test('machine result carries the resolved 0.0.4 canary identity', async () => {
  const root = await Deno.makeTempDir();
  try {
    const output = `${root}/canary-result.json`;
    await writeCanaryResult(output, canaryResult('0.0.4-canary.1'));

    assertEquals(JSON.parse(await Deno.readTextFile(output)), {
      version: '0.0.4-canary.1',
      tag: 'v0.0.4-canary.1',
      branch: 'release/canary-0.0.4-canary.1',
    });
    assertEquals(canaryResult('0.0.4-canary.1', true).branch, '');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('canary republish version must be canonical and belong to the target train', () => {
  validateRepublishVersion('0.0.2', '0.0.2-canary.0');
  validateRepublishVersion('0.0.2', '0.0.2-canary.3');
  assertThrows(
    () => validateRepublishVersion('0.0.2', '0.0.3-canary.3'),
    Error,
    'belong to target 0.0.2',
  );
  assertThrows(
    () => validateRepublishVersion('0.0.2', '0.0.2-canary.03'),
    Error,
    'match 0.0.2-canary.N',
  );
  assertEquals(
    parseArgs(['0.0.2', '--republish-version', '0.0.2-canary.3', '--root', '/repo']),
    {
      targetVersion: '0.0.2',
      dryRun: false,
      root: '/repo',
      republishVersion: '0.0.2-canary.3',
    },
  );
});

Deno.test('canary republish accepts only a clean checkout matching the tagged tree', async () => {
  const tree = 'a'.repeat(40);
  const commands: string[] = [];
  await verifyCanaryRepublishTree('/repo', '0.0.2-canary.3', (command, args) => {
    commands.push(`${command} ${args.join(' ')}`);
    return Promise.resolve({
      code: 0,
      stdout: args[0] === 'status' ? '' : `${tree}\n`,
      stderr: '',
    });
  });
  assertEquals(commands, [
    'git status --porcelain',
    'git rev-parse v0.0.2-canary.3^{tree}',
    'git rev-parse HEAD^{tree}',
  ]);
});

Deno.test('canary republish refuses a dirty checkout before comparing committed trees', async () => {
  await assertRejects(
    () =>
      verifyCanaryRepublishTree('/repo', '0.0.2-canary.3', (_command, args) =>
        Promise.resolve({
          code: 0,
          stdout: args[0] === 'status' ? ' M packages/sdk/mod.ts\n' : `${'a'.repeat(40)}\n`,
          stderr: '',
        })),
    Error,
    'working tree is dirty',
  );
});

Deno.test('canary republish names both tree SHAs when tagged content differs', async () => {
  const tagTree = 'a'.repeat(40);
  const headTree = 'b'.repeat(40);
  await assertRejects(
    () =>
      verifyCanaryRepublishTree('/repo', '0.0.2-canary.3', (_command, args) =>
        Promise.resolve({
          code: 0,
          stdout: args[0] === 'status'
            ? ''
            : args[1]?.startsWith('v')
            ? `${tagTree}\n`
            : `${headTree}\n`,
          stderr: '',
        })),
    Error,
    `tagged tree ${tagTree} differs from checked-out tree ${headTree}`,
  );
});

Deno.test('canary ref creation pushes only an ephemeral branch and provenance tag', async () => {
  const commands: string[] = [];
  await createCanaryRefs('/repo', '0.0.2-canary.5', ['/repo/deno.json'], (command, args) => {
    commands.push(`${command} ${args.join(' ')}`);
    return Promise.resolve({ code: 0, stdout: '', stderr: '' });
  });
  assertEquals(commands, [
    'git checkout -b release/canary-0.0.2-canary.5',
    'git add /repo/deno.json',
    'git commit -m chore(release): cut 0.0.2-canary.5',
    'git tag -a v0.0.2-canary.5 -m NetScript canary 0.0.2-canary.5',
    'git push origin HEAD:refs/heads/release/canary-0.0.2-canary.5',
    'git push origin refs/tags/v0.0.2-canary.5',
  ]);
  assertEquals(commands.some((command) => /pull|pr/i.test(command)), false);
});

Deno.test('canary version fails closed when registry discovery fails', async () => {
  const deps = dependencies(new Map());
  deps.readRegistryVersions = () => Promise.reject(new Error('HTTP 503'));
  await assertRejects(() => deriveCanaryVersion('/repo', '0.0.2', deps), Error, 'HTTP 503');
});

Deno.test('JSR registry discovery treats only 404 as a new package', async () => {
  const missing = await readRegistryVersions(
    '@netscript/new',
    () => Promise.resolve(new Response(null, { status: 404 })),
  );
  assertEquals(missing, null);

  await assertRejects(
    () =>
      readRegistryVersions(
        '@netscript/a',
        () => Promise.resolve(new Response('unavailable', { status: 503 })),
      ),
    Error,
    'HTTP 503',
  );
});

Deno.test('JSR registry discovery retains yanked version keys and rejects malformed metadata', async () => {
  const versions = await readRegistryVersions(
    '@netscript/a',
    () =>
      Promise.resolve(
        Response.json({
          versions: {
            '0.0.2-canary.1': {},
            '0.0.2-canary.2': { yanked: true },
          },
        }),
      ),
  );
  assertEquals(versions, ['0.0.2-canary.1', '0.0.2-canary.2']);

  await assertRejects(
    () =>
      readRegistryVersions(
        '@netscript/a',
        () => Promise.resolve(Response.json({ latest: '0.0.2' })),
      ),
    Error,
    'missing a versions object',
  );
});

function dependencies(
  versions: Map<string, readonly string[]>,
): CanaryVersionDependencies & {
  readRegistryVersions: CanaryVersionDependencies['readRegistryVersions'];
  listTags: CanaryVersionDependencies['listTags'];
} {
  return {
    discoverMembers: () =>
      Promise.resolve([
        { path: 'packages/a', name: '@netscript/a' },
        { path: 'packages/new', name: '@netscript/new' },
        { path: 'plugins/b', name: '@netscript/b' },
      ]),
    readRegistryVersions: (name) => Promise.resolve(versions.get(name) ?? null),
    listTags: () => Promise.resolve([]),
  };
}
